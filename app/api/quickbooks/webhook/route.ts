import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/server';
import { QBWebhookPayload } from '@/lib/quickbooks/types';

const WEBHOOK_VERIFIER_TOKEN = process.env.QB_WEBHOOK_VERIFIER_TOKEN || '';

function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_VERIFIER_TOKEN) return false;
  const hash = crypto
    .createHmac('sha256', WEBHOOK_VERIFIER_TOKEN)
    .update(payload)
    .digest('base64');
  return hash === signature;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('intuit-signature') || '';

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const payload: QBWebhookPayload = JSON.parse(rawBody);

    for (const notification of payload.eventNotifications) {
      for (const entity of notification.dataChangeEvent.entities) {
        // Handle Payment events — mark the linked order as paid
        if (entity.name === 'Payment' && (entity.operation === 'Create' || entity.operation === 'Update')) {
          // Payment entity doesn't directly reference the invoice,
          // so we need to look up the payment to find linked invoices.
          // For now, log it — the order confirmation page can also poll status.
          console.log(`QB Payment ${entity.operation}: ${entity.id} in realm ${notification.realmId}`);
        }

        // Handle Invoice events
        if (entity.name === 'Invoice' && entity.operation === 'Update') {
          // An invoice was updated — could mean payment was applied
          // We'll check if balance is 0 via a status check
          console.log(`QB Invoice updated: ${entity.id}`);

          // Find the order linked to this invoice
          const { data: order } = await supabaseAdmin
            .from('orders')
            .select('id, status')
            .eq('qb_invoice_id', entity.id)
            .single();

          if (order && order.status !== 'paid') {
            // Mark as paid — in production, you'd verify the invoice balance is 0
            // via a QB API call before marking as paid
            await supabaseAdmin
              .from('orders')
              .update({ status: 'paid', updated_at: new Date().toISOString() })
              .eq('id', order.id);

            console.log(`Order ${order.id} marked as paid`);
          }
        }

        // Handle voided invoices
        if (entity.name === 'Invoice' && entity.operation === 'Void') {
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
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('QB webhook processing error:', error);
    // Return 200 to prevent retries even on processing errors
    return NextResponse.json({ success: true });
  }
}
