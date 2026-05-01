import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send-email';
import { buildPaymentReceiptHtml } from '@/lib/email/payment-receipt-template';
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

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (!order.customer_email) {
      return NextResponse.json({ error: 'Order has no customer email' }, { status: 400 });
    }
    if (order.status !== 'paid' || !order.payment_amount || !order.payment_date) {
      return NextResponse.json(
        { error: 'Order is not paid yet — payment receipt requires recorded payment.' },
        { status: 400 }
      );
    }

    const settings = await getEmailSettings();
    if (!settings.email_enabled) {
      return NextResponse.json({ error: 'Email is disabled in settings' }, { status: 400 });
    }

    const items = (order.items || []).map((i: { title: string; displayText?: string; totalPrice: number }) => ({
      title: i.title,
      displayText: i.displayText || '',
      totalPrice: Number(i.totalPrice) || 0,
    }));

    const html = buildPaymentReceiptHtml({
      orderNumber: order.order_number,
      customerName: order.customer_name || '',
      paymentMethod: order.payment_method || 'card',
      paymentReference: order.external_payment_id || null,
      paymentAmount: Number(order.payment_amount) || 0,
      paymentDate: order.payment_date,
      orderTotal: Number(order.order_total) || 0,
      headcount: order.headcount || 1,
      eventDate: order.event_date || '',
      eventTime: order.event_time || '',
      deliveryAddress: order.delivery_address || '',
      items,
      subtotal: Number(order.subtotal) || 0,
      deliveryFee: Number(order.delivery_fee) || 0,
      companyPhone: settings.company_phone,
      companyEmail: settings.company_email,
    });

    await sendEmail({
      to: order.customer_email,
      subject: `Payment Receipt — Catering Order ${order.order_number} — Lexington Betty Smokehouse`,
      html,
      replyTo: settings.company_email,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Payment receipt send error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send receipt' },
      { status: 500 }
    );
  }
}
