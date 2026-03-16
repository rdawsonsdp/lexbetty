import { NextRequest, NextResponse } from 'next/server';
import { createCateringDraftOrder } from '@/lib/shopify';
import { sendEmail } from '@/lib/email/send-email';
import { buildQuoteEmailHtml } from '@/lib/email/quote-template';
import { getEmailSettings } from '@/lib/email/email-settings';

interface CreateOrderRequest {
  items?: Array<{ productId: string; title: string; quantity: number; unitPrice: number; totalPrice: number; selectedSize: string; displayText: string }>;
  lineItems?: Array<{ variantId: string; quantity: number }>;
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
  deliveryFee?: number;
  orderTotal?: number;
  orderNumber?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();

    // Validate required fields — checkout sends `items`, Shopify path uses `lineItems`
    const hasItems = (body.items && body.items.length > 0) || (body.lineItems && body.lineItems.length > 0);
    if (!hasItems) {
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

    // Check if Shopify is configured
    const shopifyConfigured =
      process.env.SHOPIFY_STORE_DOMAIN &&
      process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

    let result;
    if (!shopifyConfigured) {
      // Return mock response for development
      console.log('Mock order created (Shopify not configured):', body);
      result = {
        draftOrderId: 'mock-order-123',
        draftOrderNumber: '#MOCK-1001',
        invoiceUrl: 'https://example.com/mock-invoice',
      };
    } else {
      // Create the draft order in Shopify
      const lineItems = body.lineItems ?? (body.items || []).map(item => ({
        variantId: item.productId,
        quantity: item.quantity,
      }));
      result = await createCateringDraftOrder(
        lineItems,
        body.headcount,
        body.eventType,
        body.buyerInfo
      );
    }

    // Send confirmation email (non-blocking)
    try {
      const emailSettings = await getEmailSettings();
      if (emailSettings.email_enabled) {
        const orderType = body.orderType || 'order';
        const orderNumber = body.orderNumber || 'SD-0000';
        const subtotal = (body.items || []).reduce((sum, i) => sum + i.totalPrice, 0);

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
            displayText: i.displayText,
            totalPrice: i.totalPrice,
          })),
          headcount: body.headcount,
          eventType: body.eventType,
          subtotal,
          deliveryFee: body.deliveryFee || 0,
          orderTotal: body.orderTotal || subtotal + (body.deliveryFee || 0),
          perPerson: (body.orderTotal || subtotal + (body.deliveryFee || 0)) / body.headcount,
          companyPhone: emailSettings.company_phone,
          companyEmail: emailSettings.company_email,
          companyAddress: emailSettings.company_address,
        });

        const subjectTemplate = orderType === 'quote'
          ? emailSettings.email_subject_quote
          : emailSettings.email_subject_order;
        const subject = subjectTemplate.replace('{orderNumber}', orderNumber);

        await sendEmail({
          to: body.buyerInfo.email,
          subject,
          html,
          replyTo: emailSettings.company_email,
        });
      }
    } catch (emailError) {
      console.error('Email sending failed (non-blocking):', emailError);
    }

    return NextResponse.json({
      success: true,
      ...result,
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
