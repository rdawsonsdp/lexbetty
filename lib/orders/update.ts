import { supabaseAdmin } from '@/lib/supabase/server';
import { findOrCreateCustomer } from '@/lib/quickbooks/customers';
import { updateInvoice } from '@/lib/quickbooks/invoices';
import { isQBConnected } from '@/lib/quickbooks/client';

export interface OrderItemInput {
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

export interface OrderUpdateInput {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string | null;
  customerCompany?: string | null;
  deliveryAddress?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
  headcount?: number;
  eventType?: string | null;
  setupRequired?: boolean;
  specialInstructions?: string | null;
  customerNotes?: string | null;
  items?: OrderItemInput[];
  deliveryFee?: number;
  taxExempt?: boolean;
  status?: 'pending' | 'invoiced' | 'cancelled';
}

export interface UpdateOrderResult {
  ok: true;
  orderId: string;
  qbSynced: boolean;
  qbWarning?: string;
}

const EDITABLE_STATUSES = new Set(['pending', 'invoiced']);

const FINANCIAL_FIELDS: (keyof OrderUpdateInput)[] = [
  'items',
  'deliveryFee',
];

const QB_RELEVANT_FIELDS: (keyof OrderUpdateInput)[] = [
  'items',
  'deliveryFee',
  'eventDate',
  'eventTime',
  'headcount',
  'specialInstructions',
  'customerName',
  'customerEmail',
  'customerPhone',
  'customerCompany',
];

export async function updateOrder(
  orderId: string,
  input: OrderUpdateInput
): Promise<UpdateOrderResult> {
  // 1. Load current order
  const { data: order, error: loadError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (loadError || !order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  // 2. Status gate — only pending or invoiced orders are editable.
  // Once paid/ready/complete/cancelled, the order is locked.
  if (!EDITABLE_STATUSES.has(order.status)) {
    throw new Error(`Order is ${order.status} — cannot edit. Only pending or invoiced orders are editable.`);
  }

  // 3. Build the update row (merge input over current)
  const items = input.items ?? order.items;
  const deliveryFee = input.deliveryFee ?? order.delivery_fee;
  const subtotal = Array.isArray(items)
    ? items.reduce((sum: number, it: OrderItemInput) => sum + (it.totalPrice || 0), 0)
    : order.subtotal;
  const orderTotal = subtotal + deliveryFee;

  const updateRow: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.customerName !== undefined) updateRow.customer_name = input.customerName;
  if (input.customerEmail !== undefined) updateRow.customer_email = input.customerEmail;
  if (input.customerPhone !== undefined) updateRow.customer_phone = input.customerPhone;
  if (input.customerCompany !== undefined) updateRow.customer_company = input.customerCompany;
  if (input.deliveryAddress !== undefined) updateRow.delivery_address = input.deliveryAddress;
  if (input.eventDate !== undefined) updateRow.event_date = input.eventDate;
  if (input.eventTime !== undefined) updateRow.event_time = input.eventTime;
  if (input.headcount !== undefined) updateRow.headcount = input.headcount;
  if (input.eventType !== undefined) updateRow.event_type = input.eventType;
  if (input.setupRequired !== undefined) updateRow.setup_required = input.setupRequired;
  if (input.specialInstructions !== undefined) updateRow.special_instructions = input.specialInstructions;
  if (input.customerNotes !== undefined) updateRow.customer_notes = input.customerNotes;
  if (input.taxExempt !== undefined) updateRow.tax_exempt = input.taxExempt;
  if (input.status !== undefined) updateRow.status = input.status;
  if (input.items !== undefined) {
    updateRow.items = input.items;
    updateRow.subtotal = subtotal;
    updateRow.order_total = orderTotal;
  }
  if (input.deliveryFee !== undefined) {
    updateRow.delivery_fee = deliveryFee;
    updateRow.order_total = orderTotal;
  }

  // 4. Persist DB changes first — QB sync is best-effort
  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update(updateRow)
    .eq('id', orderId);

  if (updateError) {
    throw new Error(`Failed to update order: ${updateError.message}`);
  }

  // 5. If the order has a QB invoice and any QB-relevant field changed, sync to QB
  let qbSynced = false;
  let qbWarning: string | undefined;

  const hasFinancialChange = FINANCIAL_FIELDS.some(f => input[f] !== undefined);
  const hasQBRelevantChange = QB_RELEVANT_FIELDS.some(f => input[f] !== undefined);

  if (order.qb_invoice_id && hasQBRelevantChange) {
    try {
      const qbStatus = await isQBConnected();
      if (!qbStatus.connected) {
        qbWarning = 'QuickBooks not connected — invoice not updated.';
      } else {
        // Resolve customer ref if customer fields changed
        let customerId: string | undefined = order.qb_customer_id || undefined;
        const customerChanged =
          input.customerName !== undefined ||
          input.customerEmail !== undefined ||
          input.customerPhone !== undefined ||
          input.customerCompany !== undefined;

        if (customerChanged) {
          customerId = await findOrCreateCustomer({
            name: input.customerName ?? order.customer_name,
            email: input.customerEmail ?? order.customer_email,
            phone: input.customerPhone ?? order.customer_phone ?? undefined,
            company: input.customerCompany ?? order.customer_company ?? undefined,
          });
        }

        const lineItems = (items as OrderItemInput[]).map((item) => ({
          description: `${item.title} — ${item.displayText}`,
          amount: item.totalPrice,
          quantity: item.quantity,
        }));

        const qbResult = await updateInvoice(order.qb_invoice_id, {
          customerId: customerChanged ? customerId : undefined,
          customerEmail: input.customerEmail,
          lineItems: hasFinancialChange ? lineItems : undefined,
          deliveryFee: hasFinancialChange ? deliveryFee : undefined,
          eventDate: input.eventDate ?? undefined,
          eventTime: input.eventTime ?? undefined,
          headcount: input.headcount,
          specialInstructions: input.specialInstructions ?? undefined,
        });

        // Persist refreshed payment link + customer id
        const qbPatch: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (qbResult.paymentLink) qbPatch.payment_link = qbResult.paymentLink;
        if (customerId && customerChanged) qbPatch.qb_customer_id = customerId;

        if (Object.keys(qbPatch).length > 1) {
          await supabaseAdmin.from('orders').update(qbPatch).eq('id', orderId);
        }

        qbSynced = true;
      }
    } catch (qbErr) {
      qbWarning = qbErr instanceof Error ? qbErr.message : 'QuickBooks sync failed';
      console.warn(`QB sync failed for order ${orderId}:`, qbWarning);
    }
  }

  return { ok: true, orderId, qbSynced, qbWarning };
}
