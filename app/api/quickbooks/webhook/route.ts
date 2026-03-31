import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/server';
import { QBWebhookPayload } from '@/lib/quickbooks/types';
import { getInvoiceStatus, getPaymentForInvoice } from '@/lib/quickbooks/invoices';

const WEBHOOK_VERIFIER_TOKEN = process.env.QB_WEBHOOK_VERIFIER_TOKEN || '';

function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_VERIFIER_TOKEN) {
    console.warn('QB webhook received but QB_WEBHOOK_VERIFIER_TOKEN is not set — rejecting');
    return false;
  }
  const hash = crypto
    .createHmac('sha256', WEBHOOK_VERIFIER_TOKEN)
    .update(payload)
    .digest('base64');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('intuit-signature') || '';

  if (!verifySignature(rawBody, signature)) {
    console.warn('QB webhook rejected: invalid signature');
    // Return 200 to prevent Intuit from retrying with bad signature
    return NextResponse.json({ success: false }, { status: 200 });
  }

  try {
    const payload: QBWebhookPayload = JSON.parse(rawBody);

    for (const notification of payload.eventNotifications) {
      for (const entity of notification.dataChangeEvent.entities) {
        // Handle Invoice update events — check if payment was applied
        if (entity.name === 'Invoice' && entity.operation === 'Update') {
          console.log(`QB Invoice updated: ${entity.id} in realm ${notification.realmId}`);

          // Find the order linked to this invoice
          const { data: order } = await supabaseAdmin
            .from('orders')
            .select('id, status')
            .eq('qb_invoice_id', entity.id)
            .single();

          if (order && order.status !== 'paid') {
            // Verify the invoice balance is actually 0 before marking as paid
            try {
              const invoiceStatus = await getInvoiceStatus(entity.id);
              if (invoiceStatus.isPaid) {
                // Fetch payment details from QB
                const payment = await getPaymentForInvoice(entity.id);
                await supabaseAdmin
                  .from('orders')
                  .update({
                    status: 'paid',
                    qb_payment_id: payment?.paymentId || null,
                    qb_payment_method: payment?.paymentMethod || null,
                    qb_payment_date: payment?.paymentDate ? new Date(payment.paymentDate).toISOString() : new Date().toISOString(),
                    qb_payment_amount: payment?.totalAmount || invoiceStatus.totalAmt,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', order.id);
                console.log(`Order ${order.id} marked as paid — QB Payment #${payment?.paymentId || 'unknown'}, method: ${payment?.paymentMethod || 'unknown'}`);
              } else {
                console.log(`Invoice ${entity.id} updated but balance is $${invoiceStatus.balance} — not marking as paid`);
              }
            } catch (verifyErr) {
              console.error(`Failed to verify invoice ${entity.id} balance:`, verifyErr);
            }
          }
        }

        // Handle voided invoices
        if (entity.name === 'Invoice' && entity.operation === 'Void') {
          console.log(`QB Invoice voided: ${entity.id}`);
          const { data: order } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('qb_invoice_id', entity.id)
            .single();

          if (order) {
            await supabaseAdmin
              .from('orders')
              .update({ status: 'cancelled', updated_at: new Date().toISOString() })
              .eq('id', order.id);
            console.log(`Order ${order.id} cancelled (invoice voided)`);
          }
        }

        // Log payment events for audit trail
        if (entity.name === 'Payment') {
          console.log(`QB Payment ${entity.operation}: ${entity.id} in realm ${notification.realmId}`);
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('QB webhook processing error:', error);
    // Return 200 to prevent Intuit from retrying on processing errors
    return NextResponse.json({ success: true });
  }
}
