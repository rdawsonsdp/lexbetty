import { supabaseAdmin } from '@/lib/supabase/server';

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
  status?: 'pending' | 'invoiced' | 'paid' | 'cancelled';
  paymentMethod?: string | null;
  paymentReference?: string | null;
  paymentDate?: string | null;
  paymentAmount?: number | null;
}

export interface UpdateOrderResult {
  ok: true;
  orderId: string;
}

const EDITABLE_STATUSES = new Set(['pending', 'invoiced']);

export async function updateOrder(
  orderId: string,
  input: OrderUpdateInput
): Promise<UpdateOrderResult> {
  const { data: order, error: loadError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (loadError || !order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  if (!EDITABLE_STATUSES.has(order.status)) {
    throw new Error(`Order is ${order.status} — cannot edit. Only pending or invoiced orders are editable.`);
  }

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
  if (input.paymentMethod !== undefined) updateRow.payment_method = input.paymentMethod;
  if (input.paymentReference !== undefined) updateRow.external_payment_id = input.paymentReference;
  if (input.paymentDate !== undefined) updateRow.payment_date = input.paymentDate;
  if (input.paymentAmount !== undefined) updateRow.payment_amount = input.paymentAmount;
  if (input.items !== undefined) {
    updateRow.items = input.items;
    updateRow.subtotal = subtotal;
    updateRow.order_total = orderTotal;
  }
  if (input.deliveryFee !== undefined) {
    updateRow.delivery_fee = deliveryFee;
    updateRow.order_total = orderTotal;
  }

  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update(updateRow)
    .eq('id', orderId);

  if (updateError) {
    throw new Error(`Failed to update order: ${updateError.message}`);
  }

  return { ok: true, orderId };
}
