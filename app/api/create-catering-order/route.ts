import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { findOrCreateCustomer } from '@/lib/quickbooks/customers';
import { createInvoice, sendInvoiceEmail } from '@/lib/quickbooks/invoices';
import { isQBConnected } from '@/lib/quickbooks/client';
import { sendEmail } from '@/lib/email/send-email';
import { buildQuoteEmailHtml } from '@/lib/email/quote-template';
import { getEmailSettings } from '@/lib/email/email-settings';

interface OrderItem {
  productId: string;
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedSize: string;
  displayText: string;
  servesMin?: number;
  servesMax?: number;
}

interface CreateOrderRequest {
  items?: OrderItem[];
  headcount: number;
  eventType: string;
  orderType?: 'quote' | 'order';
  buyerInfo: {
    name: string;
    email: string;
    phone: string;
    company: string;
    eventDate: string;
    eventTime?: string;
    deliveryAddress?: string;
    notes?: string;
  };
  delivery?: {
    address: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
  };
  setupRequired?: boolean;
  deliveryType?: string;
  buffetSetupFee?: number;
  deliveryFee?: number;
  salesTax?: number;
  orderTotal?: number;
  orderNumber?: string;
  analytics?: {
    session_id?: string;
    items_added?: { product_id: string; title: string }[];
    items_removed?: { product_id: string; title: string }[];
    wizard_steps_visited?: number[];
    time_to_order_seconds?: number;
    device_type?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();

    // Validate required fields
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items in order' },
        { status: 400 }
      );
    }

    if (!body.headcount || body.headcount < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid headcount' },
        { status: 400 }
      );
    }

    if (!body.buyerInfo?.email) {
      return NextResponse.json(
        { success: false, error: 'Buyer email is required' },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = body.orderNumber || `LB-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const deliveryFee = body.deliveryFee || 0;
    const subtotal = body.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const orderTotal = body.orderTotal || (subtotal + deliveryFee);
    const orderType = body.orderType || 'order';

    // Save order to Supabase
    let orderId: string | null = null;
    try {
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          order_number: orderNumber,
          status: 'pending',
          customer_name: body.buyerInfo.name,
          customer_email: body.buyerInfo.email,
          customer_phone: body.buyerInfo.phone || null,
          customer_company: body.buyerInfo.company || null,
          delivery_address: body.buyerInfo.deliveryAddress || null,
          event_date: body.buyerInfo.eventDate || null,
          event_time: body.buyerInfo.eventTime || null,
          headcount: body.headcount,
          event_type: body.eventType || null,
          setup_required: body.setupRequired ?? true,
          special_instructions: body.buyerInfo.notes || null,
          items: body.items,
          subtotal,
          delivery_fee: deliveryFee,
          order_total: orderTotal,
        })
        .select('id')
        .single();

      if (!orderError && order) {
        orderId = order.id;
      } else {
        console.warn('Failed to save order to DB:', orderError?.message);
      }
    } catch (dbErr) {
      console.warn('DB order save failed (continuing):', dbErr);
    }

    // Save training data for AI (non-blocking)
    try {
      const eventDate = body.buyerInfo.eventDate ? new Date(body.buyerInfo.eventDate) : null;
      await supabaseAdmin.from('order_training_data').insert({
        order_number: orderNumber,
        session_id: body.analytics?.session_id || null,
        event_type: body.eventType || null,
        headcount: body.headcount,
        order_type: orderType,
        final_items: body.items.map(i => ({
          product_id: i.productId,
          title: i.title,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          total_price: i.totalPrice,
          size: i.selectedSize,
        })),
        subtotal,
        delivery_fee: deliveryFee,
        sales_tax: body.salesTax || 0,
        order_total: orderTotal,
        per_person_cost: body.headcount > 0 ? orderTotal / body.headcount : 0,
        items_added: body.analytics?.items_added || null,
        items_removed: body.analytics?.items_removed || null,
        wizard_steps_visited: body.analytics?.wizard_steps_visited || null,
        time_to_order_seconds: body.analytics?.time_to_order_seconds || null,
        delivery_type: body.deliveryType || null,
        delivery_city: body.delivery?.city || null,
        delivery_zip: body.delivery?.zip || null,
        event_date: eventDate ? eventDate.toISOString().split('T')[0] : null,
        event_day_of_week: eventDate ? eventDate.toLocaleDateString('en-US', { weekday: 'long' }) : null,
        is_quote: orderType === 'quote',
        device_type: body.analytics?.device_type || null,
      });
    } catch (trainingErr) {
      console.warn('Training data save failed (non-blocking):', trainingErr);
    }

    // Send confirmation email (non-blocking)
    try {
      const emailSettings = await getEmailSettings();
      if (emailSettings.email_enabled) {
        const nameParts = body.buyerInfo.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const html = buildQuoteEmailHtml({
          orderType,
          orderNumber,
          contact: {
            firstName,
            lastName,
            email: body.buyerInfo.email,
            phone: body.buyerInfo.phone,
            company: body.buyerInfo.company,
          },
          delivery: body.delivery || {
            address: body.buyerInfo.deliveryAddress || '',
            address2: '',
            city: '',
            state: '',
            zip: '',
          },
          event: {
            date: body.buyerInfo.eventDate,
            time: body.buyerInfo.eventTime || '',
            setupRequired: body.setupRequired ?? true,
            specialInstructions: body.buyerInfo.notes || '',
          },
          items: (body.items || []).map(i => ({
            title: i.title,
            description: i.description,
            displayText: i.displayText,
            totalPrice: i.totalPrice,
            servesMin: i.servesMin,
            servesMax: i.servesMax,
          })),
          headcount: body.headcount,
          eventType: body.eventType,
          subtotal,
          deliveryFee,
          orderTotal,
          perPerson: orderTotal / body.headcount,
          companyPhone: emailSettings.company_phone,
          companyEmail: emailSettings.company_email,
          companyAddress: emailSettings.company_address,
        });

        const subjectTemplate = orderType === 'quote'
          ? emailSettings.email_subject_quote
          : emailSettings.email_subject_order;
        const subject = subjectTemplate.replace('{orderNumber}', orderNumber);

        // Parse notification CC emails
        const ccEmails = (emailSettings.notification_emails || '')
          .split(',')
          .map((e: string) => e.trim())
          .filter((e: string) => e && e.includes('@'));

        await sendEmail({
          to: body.buyerInfo.email,
          subject,
          html,
          replyTo: emailSettings.company_email,
          cc: ccEmails.length > 0 ? ccEmails : undefined,
        });
      }
    } catch (emailError) {
      console.error('Email sending failed (non-blocking):', emailError);
    }

    // For quotes, skip QB invoice creation
    if (orderType === 'quote') {
      return NextResponse.json({
        success: true,
        orderNumber,
        orderId,
        paymentLink: null,
      });
    }

    // Check if QuickBooks is connected
    const qbStatus = await isQBConnected();

    if (!qbStatus.connected) {
      // QB not connected — return success without invoice
      console.log('Order created without QB invoice (QB not connected):', orderNumber);
      return NextResponse.json({
        success: true,
        orderNumber,
        orderId,
        paymentLink: null,
        message: 'Order saved. QuickBooks not connected — no invoice created.',
      });
    }

    // Create QB customer
    const customerId = await findOrCreateCustomer({
      name: body.buyerInfo.name,
      email: body.buyerInfo.email,
      phone: body.buyerInfo.phone || undefined,
      company: body.buyerInfo.company || undefined,
    });

    // Create QB invoice
    const lineItems = body.items.map((item) => ({
      description: `${item.title} — ${item.displayText}`,
      amount: item.totalPrice,
      quantity: item.quantity,
    }));

    const { invoiceId, invoiceNumber, paymentLink } = await createInvoice({
      orderNumber,
      customerId,
      customerEmail: body.buyerInfo.email,
      lineItems,
      deliveryFee,
      eventDate: body.buyerInfo.eventDate,
      eventTime: body.buyerInfo.eventTime,
      headcount: body.headcount,
      specialInstructions: body.buyerInfo.notes,
    });

    // Update order with QB details
    if (orderId) {
      try {
        await supabaseAdmin
          .from('orders')
          .update({
            qb_invoice_id: invoiceId,
            qb_invoice_number: invoiceNumber,
            qb_customer_id: customerId,
            payment_link: paymentLink,
            status: 'invoiced',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      } catch (updateErr) {
        console.warn('Failed to update order with QB details:', updateErr);
      }
    }

    // Send invoice email via QB
    try {
      await sendInvoiceEmail(invoiceId);
    } catch (emailErr) {
      console.warn('Failed to send QB invoice email:', emailErr);
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId,
      invoiceNumber,
      paymentLink,
    });
  } catch (error) {
    console.error('Error creating catering order:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
