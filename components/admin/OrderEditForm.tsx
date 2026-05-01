'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminAuthGate from '@/components/admin/AdminAuthGate';
import AdminNav from '@/components/admin/AdminNav';
import { formatCurrency } from '@/lib/pricing';

export interface OrderItem {
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

interface AdminOrder {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_company: string | null;
  delivery_address: string | null;
  event_date: string | null;
  event_time: string | null;
  headcount: number;
  event_type: string | null;
  setup_required: boolean;
  special_instructions: string | null;
  customer_notes: string | null;
  admin_notes: string | null;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  order_total: number;
  payment_method?: string | null;
  external_payment_id?: string | null;
  payment_amount?: number | null;
  payment_date?: string | null;
}

type PaymentMethod = 'card' | 'cash' | 'check' | 'ach' | 'other';

type EditableStatus = 'pending' | 'invoiced' | 'paid' | 'cancelled';

const EDITABLE_STATUSES = new Set(['pending', 'invoiced', 'paid']);

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  invoiced: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

interface FormState {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string;
  deliveryAddress: string;
  eventDate: string;
  eventTime: string;
  headcount: number;
  eventType: string;
  setupRequired: boolean;
  specialInstructions: string;
  customerNotes: string;
  adminNotes: string;
  status: EditableStatus;
}

function orderToForm(o: AdminOrder): FormState {
  return {
    customerName: o.customer_name || '',
    customerEmail: o.customer_email || '',
    customerPhone: o.customer_phone || '',
    customerCompany: o.customer_company || '',
    deliveryAddress: o.delivery_address || '',
    eventDate: o.event_date || '',
    eventTime: o.event_time || '',
    headcount: o.headcount || 0,
    eventType: o.event_type || '',
    setupRequired: !!o.setup_required,
    specialInstructions: o.special_instructions || '',
    customerNotes: o.customer_notes || '',
    adminNotes: o.admin_notes || '',
    status: (o.status as EditableStatus) || 'pending',
  };
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${sessionStorage.getItem('admin_token') ?? ''}`,
  };
}

export interface OrderEditFormProps {
  itemsSlot?: React.ReactNode;
  items?: OrderItem[];
  onItemsChange?: (items: OrderItem[]) => void;
  deliveryFee?: number;
  onDeliveryFeeChange?: (fee: number) => void;
}

function OrderEditFormInner({
  itemsSlot,
  items: itemsProp,
  deliveryFee: deliveryFeeProp,
  onDeliveryFeeChange,
}: OrderEditFormProps) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = params?.id || '';

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [snapshot, setSnapshot] = useState<FormState | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [localDeliveryFee, setLocalDeliveryFee] = useState<number>(0);
  const [snapshotDeliveryFee, setSnapshotDeliveryFee] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Payment form state (used when order.status === 'invoiced')
  const todayIso = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(todayIso());

  const [notifyingCustomer, setNotifyingCustomer] = useState(false);
  const [notifyingStaff, setNotifyingStaff] = useState(false);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { headers: authHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load order');
      }
      const { order: o } = (await res.json()) as { order: AdminOrder };
      setOrder(o);
      const f = orderToForm(o);
      setForm(f);
      setSnapshot(f);
      setLocalDeliveryFee(o.delivery_fee || 0);
      setSnapshotDeliveryFee(o.delivery_fee || 0);
      setPaymentAmount(o.order_total || 0);
      setPaymentMethod('card');
      setPaymentReference('');
      setPaymentDate(todayIso());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId, loadOrder]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const effectiveItems = itemsProp ?? order?.items ?? [];
  const effectiveDeliveryFee = deliveryFeeProp ?? localDeliveryFee;

  const subtotal = useMemo(
    () => effectiveItems.reduce((s, it) => s + (it.totalPrice || 0), 0),
    [effectiveItems]
  );
  const orderTotal = subtotal + (effectiveDeliveryFee || 0);
  const perPerson = form && form.headcount > 0 ? orderTotal / form.headcount : 0;

  const itemsChanged = itemsProp !== undefined && order ? itemsProp !== order.items : false;
  const feeChanged = effectiveDeliveryFee !== snapshotDeliveryFee;

  const dirty = useMemo(() => {
    if (!form || !snapshot) return false;
    const formDiff = (Object.keys(form) as (keyof FormState)[]).some((k) => form[k] !== snapshot[k]);
    return formDiff || itemsChanged || feeChanged;
  }, [form, snapshot, itemsChanged, feeChanged]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const buildPatch = () => {
    if (!form || !snapshot || !order) return {};
    const patch: Record<string, unknown> = {};
    if (form.customerName !== snapshot.customerName) patch.customerName = form.customerName;
    if (form.customerEmail !== snapshot.customerEmail) patch.customerEmail = form.customerEmail;
    if (form.customerPhone !== snapshot.customerPhone) patch.customerPhone = form.customerPhone || null;
    if (form.customerCompany !== snapshot.customerCompany) patch.customerCompany = form.customerCompany || null;
    if (form.deliveryAddress !== snapshot.deliveryAddress) patch.deliveryAddress = form.deliveryAddress || null;
    if (form.eventDate !== snapshot.eventDate) patch.eventDate = form.eventDate || null;
    if (form.eventTime !== snapshot.eventTime) patch.eventTime = form.eventTime || null;
    if (form.headcount !== snapshot.headcount) patch.headcount = form.headcount;
    if (form.eventType !== snapshot.eventType) patch.eventType = form.eventType || null;
    if (form.setupRequired !== snapshot.setupRequired) patch.setupRequired = form.setupRequired;
    if (form.specialInstructions !== snapshot.specialInstructions) patch.specialInstructions = form.specialInstructions || null;
    if (form.customerNotes !== snapshot.customerNotes) patch.customerNotes = form.customerNotes || null;
    if (form.status !== snapshot.status) patch.status = form.status;
    if (itemsChanged && itemsProp) patch.items = itemsProp;
    if (feeChanged) patch.deliveryFee = effectiveDeliveryFee;
    return patch;
  };

  const submitPatch = async (patch: Record<string, unknown>, successMsg: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update order');
      }
      await loadOrder();
      setToast({ message: successMsg, type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to update', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const patch = buildPatch();
    if (Object.keys(patch).length === 0) return;
    await submitPatch(patch, 'Order saved');
  };

  const handleNotify = async (target: 'customer' | 'staff') => {
    const setBusy = target === 'customer' ? setNotifyingCustomer : setNotifyingStaff;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/notify`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          notifyCustomer: target === 'customer',
          notifyStaff: target === 'staff',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to email ${target}`);
      }
      setToast({
        message: target === 'customer'
          ? `Update email sent to customer`
          : `Update email sent to staff`,
        type: 'success',
      });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Email failed', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    await submitPatch({ status: 'cancelled' }, 'Order cancelled');
  };

  const handleRecordPayment = async () => {
    if (!(paymentAmount > 0)) {
      setToast({ message: 'Amount must be greater than 0', type: 'error' });
      return;
    }
    if (!confirm('Mark this order as paid?')) return;
    // Combine payment date with current time as full ISO datetime
    const now = new Date();
    const [y, m, d] = paymentDate.split('-').map((s) => Number(s));
    const dt = new Date(
      y || now.getFullYear(),
      (m || 1) - 1,
      d || 1,
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    );
    await submitPatch(
      {
        status: 'paid',
        paymentMethod,
        paymentReference: paymentReference.trim() || null,
        paymentAmount,
        paymentDate: dt.toISOString(),
      },
      'Payment recorded'
    );

    // Auto-send payment receipt to the customer
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/payment-receipt`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        setToast({ message: 'Payment recorded · receipt emailed to customer', type: 'success' });
      } else {
        setToast({ message: 'Payment recorded · receipt email failed — please follow up', type: 'error' });
      }
    } catch {
      setToast({ message: 'Payment recorded · receipt email failed', type: 'error' });
    }
  };

  const formatPaymentDate = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex items-center justify-center py-20 text-gray-500">
          <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading order…
        </div>
      </div>
    );
  }

  if (error || !order || !form) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="max-w-xl mx-auto px-4 py-12">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm mb-4">
            {error || 'Order not available'}
          </div>
          <button
            onClick={() => router.push('/admin/orders')}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!EDITABLE_STATUSES.has(order.status)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="max-w-xl mx-auto px-4 py-12">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm mb-4">
            Order is <strong>{order.status}</strong> — only pending or invoiced orders can be edited.
          </div>
          <button
            onClick={() => router.push('/admin/orders')}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-oswald text-lg sm:text-xl font-bold text-[#1A1A1A] tracking-wide">
              Editing Order {order.order_number}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
              {order.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <button
              onClick={() => handleNotify('customer')}
              disabled={saving || notifyingCustomer || notifyingStaff}
              title="Send the customer an updated copy of this order"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-[#0E9F6E] text-white rounded-lg hover:bg-[#0B8055] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {notifyingCustomer ? 'Sending…' : 'Email Customer'}
            </button>
            <button
              onClick={() => handleNotify('staff')}
              disabled={saving || notifyingCustomer || notifyingStaff}
              title="Send LBSH staff an updated copy of this order"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-[#0694A2] text-white rounded-lg hover:bg-[#057B86] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {notifyingStaff ? 'Sending…' : 'Email Staff'}
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button
              onClick={() => router.push('/admin/orders')}
              className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            {order.status !== 'cancelled' && (
              <button
                onClick={handleCancelOrder}
                disabled={saving}
                className="px-3 py-1.5 text-sm font-semibold border border-red-500 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                Cancel Order
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="px-4 py-1.5 text-sm font-semibold bg-[#E8621A] text-white rounded-lg hover:bg-[#c8531a] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Section title="Customer">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Name">
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) => update('customerName', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => update('customerEmail', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  value={form.customerPhone}
                  onChange={(e) => update('customerPhone', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Company">
                <input
                  type="text"
                  value={form.customerCompany}
                  onChange={(e) => update('customerCompany', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          <Section title="Event">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Event Date">
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => update('eventDate', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Event Time">
                <input
                  type="text"
                  placeholder="e.g. 12:30 PM"
                  value={form.eventTime}
                  onChange={(e) => update('eventTime', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Headcount">
                <input
                  type="number"
                  min={1}
                  value={form.headcount}
                  onChange={(e) => update('headcount', Number(e.target.value) || 0)}
                  className={inputCls}
                />
              </Field>
              <Field label="Event Type">
                <select
                  value={form.eventType}
                  onChange={(e) => update('eventType', e.target.value)}
                  className={inputCls}
                >
                  <option value="">—</option>
                  <option value="lunch">Lunch</option>
                  <option value="alacarte">A La Carte</option>
                </select>
              </Field>
            </div>
            <label className="flex items-center gap-2 mt-4 text-sm">
              <input
                type="checkbox"
                checked={form.setupRequired}
                onChange={(e) => update('setupRequired', e.target.checked)}
                className="w-4 h-4 accent-[#E8621A]"
              />
              <span className="text-[#1A1A1A]">Setup required</span>
            </label>
          </Section>

          <Section title="Delivery">
            <Field label="Delivery Address">
              <textarea
                rows={3}
                value={form.deliveryAddress}
                onChange={(e) => update('deliveryAddress', e.target.value)}
                placeholder="Street, city, state, zip"
                className={`${inputCls} resize-none`}
              />
            </Field>
          </Section>

          <Section title="Notes">
            <Field
              label="Special Instructions"
              hint="Kitchen / dietary instructions — visible to staff and on the packing slip."
            >
              <textarea
                rows={3}
                value={form.specialInstructions}
                onChange={(e) => update('specialInstructions', e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </Field>
            <Field label="Customer Notes" hint="Visible to the customer in their order confirmation.">
              <textarea
                rows={3}
                value={form.customerNotes}
                onChange={(e) => update('customerNotes', e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </Field>
            <Field label="Admin Notes" hint="Internal only — never shown to the customer.">
              <textarea
                rows={3}
                value={form.adminNotes}
                onChange={(e) => update('adminNotes', e.target.value)}
                className={`${inputCls} resize-none`}
                disabled
              />
              <p className="text-xs text-gray-400 mt-1">
                Admin notes are managed from the Orders list panel.
              </p>
            </Field>
          </Section>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Section title="Items">
            <div id="items-slot" data-testid="items-slot">
              {itemsSlot ?? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {effectiveItems.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500">No items.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <tbody>
                        {effectiveItems.map((it, i) => (
                          <tr key={i} className="border-b border-gray-100 last:border-0">
                            <td className="px-3 py-2">
                              <div className="font-medium text-[#1A1A1A]">{it.title}</div>
                              <div className="text-xs text-gray-500">{it.displayText}</div>
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-[#1A1A1A]">
                              {formatCurrency(it.totalPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </Section>

          <Section title="Totals">
            <div className="bg-[#F5EDE0] rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Delivery Fee</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={effectiveDeliveryFee}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    if (onDeliveryFeeChange) onDeliveryFeeChange(v);
                    else setLocalDeliveryFee(v);
                  }}
                  className="w-28 px-2 py-1 border border-gray-300 rounded text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#E8621A]/30"
                />
              </div>
              <div className="flex justify-between font-oswald font-bold text-lg pt-2 border-t border-[#E8621A]/30">
                <span className="text-[#1A1A1A]">Order Total</span>
                <span className="text-[#E8621A]">{formatCurrency(orderTotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Per Person ({form.headcount} guests)</span>
                <span>{formatCurrency(perPerson)}</span>
              </div>
            </div>
          </Section>

          {order.status === 'invoiced' && (
            <Section title="Record Payment">
              <p className="text-xs text-gray-500 -mt-2">
                Fill these in after you&apos;ve collected payment via Clover or other method, then click Mark Paid.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Payment Method">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className={inputCls}
                  >
                    <option value="card">Card</option>
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="ach">ACH</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Confirmation / Reference #">
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Clover txn ID, check #, last 4"
                    className={inputCls}
                  />
                </Field>
                <Field label="Amount Paid">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Payment Date">
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
              <button
                onClick={handleRecordPayment}
                disabled={saving || !(paymentAmount > 0)}
                className="w-full mt-2 px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Mark Paid'}
              </button>
            </Section>
          )}

          {order.status === 'paid' && (
            <Section title="Payment Recorded">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Method</span>
                  <span className="font-medium text-[#1A1A1A] capitalize">
                    {order.payment_method || '—'}
                  </span>
                </div>
                {order.external_payment_id && (
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-600">Reference</span>
                    <span className="font-medium text-[#1A1A1A] text-right break-all">
                      {order.external_payment_id}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-semibold text-[#1A1A1A]">
                    {formatCurrency(order.payment_amount || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium text-[#1A1A1A]">
                    {formatPaymentDate(order.payment_date) || '—'}
                  </span>
                </div>
              </div>
            </Section>
          )}

          <Section title="Status">
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value as EditableStatus)}
              className={inputCls}
            >
              <option value="pending">Pending</option>
              <option value="invoiced">Invoiced</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Section>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E8621A]/30 focus:border-[#E8621A] disabled:bg-gray-50 disabled:text-gray-400';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h2 className="font-oswald text-sm font-bold text-[#1A1A1A] uppercase tracking-wide mb-4">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </span>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </label>
  );
}

export default function OrderEditForm(props: OrderEditFormProps) {
  return (
    <AdminAuthGate>
      <OrderEditFormInner {...props} />
    </AdminAuthGate>
  );
}
