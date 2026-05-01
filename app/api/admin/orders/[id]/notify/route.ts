import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send-email';
import { buildQuoteEmailHtml } from '@/lib/email/quote-template';
import { buildStoreNotificationHtml } from '@/lib/email/store-notification-template';
import { getEmailSettings } from '@/lib/email/email-settings';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as { notifyCustomer?: boolean; notifyStaff?: boolean };
    if (!body.notifyCustomer && !body.notifyStaff) {
      return NextResponse.json({ error: 'No recipients selected' }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const settings = await getEmailSettings();
    if (!settings.email_enabled) {
      return NextResponse.json({ error: 'Email is disabled in settings' }, { status: 400 });
    }

    const orderType: 'quote' | 'order' = order.status === 'pending' ? 'quote' : 'order';
    const nameParts = (order.customer_name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const headcount = order.headcount || 1;
    const subtotal = Number(order.subtotal) || 0;
    const deliveryFee = Number(order.delivery_fee) || 0;
    const orderTotal = Number(order.order_total) || 0;
    const perPerson = headcount > 0 ? orderTotal / headcount : 0;

    const items = (order.items || []).map((i: { title: string; description?: string; displayText?: string; totalPrice: number; servesMin?: number; servesMax?: number }) => ({
      title: i.title,
      description: i.description,
      displayText: i.displayText || '',
      totalPrice: i.totalPrice,
      servesMin: i.servesMin,
      servesMax: i.servesMax,
    }));

    const delivery = {
      address: order.delivery_address || '',
      address2: '',
      city: '',
      state: '',
      zip: '',
    };

    const updateBanner = `<div style="background:#FEF3C7;border-bottom:2px solid #F59E0B;padding:14px 24px;text-align:center;font-family:-apple-system,sans-serif;color:#78350F;font-weight:600;font-size:14px;">⚡ ORDER UPDATED — please review the latest details below</div>`;

    const sent: string[] = [];

    if (body.notifyCustomer && order.customer_email) {
      const html = buildQuoteEmailHtml({
        orderType,
        orderNumber: order.order_number,
        contact: {
          firstName,
          lastName,
          email: order.customer_email,
          phone: order.customer_phone || '',
          company: order.customer_company || '',
        },
        delivery,
        event: {
          date: order.event_date || '',
          time: order.event_time || '',
          setupRequired: order.setup_required ?? true,
          specialInstructions: order.special_instructions || '',
        },
        items,
        headcount,
        eventType: order.event_type || '',
        subtotal,
        deliveryFee,
        orderTotal,
        perPerson,
        companyPhone: settings.company_phone,
        companyEmail: settings.company_email,
        companyAddress: settings.company_address,
        paymentLink: null,
      });

      const customerHtml = html.replace(/<body([^>]*)>/, `<body$1>${updateBanner}`);

      await sendEmail({
        to: order.customer_email,
        subject: `[UPDATED] Catering ${orderType === 'quote' ? 'Quote' : 'Order'} ${order.order_number} — Updated Details`,
        html: customerHtml,
        replyTo: settings.company_email,
      });
      sent.push('customer');
    }

    if (body.notifyStaff) {
      const STORE_RECIPIENTS = ['info@lexingtonbetty.com'];
      const additional = (settings.notification_emails || '')
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e && e.includes('@'));
      const staff = [...STORE_RECIPIENTS, ...additional.filter((e) => !STORE_RECIPIENTS.includes(e))];

      if (staff.length > 0) {
        const staffHtml = buildStoreNotificationHtml({
          orderType,
          orderNumber: order.order_number,
          customerName: order.customer_name || '',
          customerEmail: order.customer_email || '',
          customerPhone: order.customer_phone || '',
          customerCompany: order.customer_company || '',
          eventDate: order.event_date || '',
          eventTime: order.event_time || '',
          headcount,
          eventType: order.event_type || '',
          delivery,
          setupRequired: order.setup_required ?? true,
          specialInstructions: order.special_instructions || '',
          items: items.map((i: { title: string; displayText: string; totalPrice: number }) => ({
            title: i.title,
            displayText: i.displayText,
            totalPrice: i.totalPrice,
          })),
          subtotal,
          deliveryFee,
          orderTotal,
          perPerson,
        });

        const staffHtmlWithBanner = staffHtml.replace(/<body([^>]*)>/, `<body$1>${updateBanner}`);

        await sendEmail({
          to: staff[0],
          cc: staff.slice(1),
          subject: `[UPDATED] Catering ${orderType === 'quote' ? 'Quote' : 'Order'} ${order.order_number} — Order details changed`,
          html: staffHtmlWithBanner,
          replyTo: order.customer_email || settings.company_email,
        });
        sent.push('staff');
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (err) {
    console.error('Order notify error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
