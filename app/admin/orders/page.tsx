'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminAuthGate from '@/components/admin/AdminAuthGate';
import AdminNav from '@/components/admin/AdminNav';
import { formatCurrency } from '@/lib/pricing';
import { generateOrderPDF, generatePackingSlipPDF, OrderPDFData } from '@/lib/order-pdf';

// ── Types ──────────────────────────────────────────────

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
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  order_total: number;
  qb_invoice_id: string | null;
  qb_invoice_number: string | null;
  qb_payment_id: string | null;
  qb_payment_method: string | null;
  qb_payment_date: string | null;
  qb_payment_amount: number | null;
  payment_link: string | null;
  created_at: string;
  updated_at: string;
}

type SortColumn = 'created_at' | 'order_number' | 'customer_name' | 'event_date' | 'order_total' | 'status';

// ── Helpers ────────────────────────────────────────────

function getToken(): string {
  return sessionStorage.getItem('admin_token') ?? '';
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

const STATUS_LABELS: Record<string, string> = {
  all: 'All',
  pending: 'Pending',
  invoiced: 'Invoiced',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  invoiced: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function orderToPDFData(order: AdminOrder): OrderPDFData {
  return {
    orderNumber: order.order_number,
    items: (order.items || []).map((i) => ({
      title: i.title,
      displayText: i.displayText,
      totalPrice: i.totalPrice,
    })),
    headcount: order.headcount,
    subtotal: order.subtotal,
    deliveryFee: order.delivery_fee,
    orderTotal: order.order_total,
    contact: {
      name: order.customer_name,
      email: order.customer_email,
      phone: order.customer_phone || '',
      company: order.customer_company || undefined,
    },
    deliveryAddress: order.delivery_address || '',
    event: {
      date: order.event_date,
      time: order.event_time,
      setupRequired: order.setup_required,
      specialInstructions: order.special_instructions || undefined,
    },
  };
}

// ── Main Page ──────────────────────────────────────────

function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const limit = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        search: debouncedSearch,
        sort: sortColumn,
        dir: sortDir,
        page: String(page),
        limit: String(limit),
      });

      const res = await fetch(`/api/admin/orders?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch orders');

      const data = await res.json();
      setOrders(data.orders);
      setTotalCount(data.totalCount);
      setStatusCounts(data.statusCounts || {});
    } catch {
      setToast({ message: 'Failed to load orders', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, sortColumn, sortDir, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch, sortColumn, sortDir]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Sort handler
  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDir('desc');
    }
  };

  // Status update
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setToast({ message: `Order status updated to ${newStatus}`, type: 'success' });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      fetchOrders();
    } catch {
      setToast({ message: 'Failed to update order status', type: 'error' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const SortArrow = ({ col }: { col: SortColumn }) => {
    if (sortColumn !== col) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-[#E8621A] ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const totalPages = Math.ceil(totalCount / limit);
  const showFrom = totalCount > 0 ? (page - 1) * limit + 1 : 0;
  const showTo = Math.min(page * limit, totalCount);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-oswald text-2xl font-bold text-[#1A1A1A] tracking-wide">Orders</h1>
            <p className="text-sm text-gray-500 mt-1">{totalCount} total order{totalCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 flex-wrap mb-4">
          {Object.keys(STATUS_LABELS).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {STATUS_LABELS[s]}
              {statusCounts[s] !== undefined && (
                <span className={`ml-1.5 ${statusFilter === s ? 'text-white/70' : 'text-gray-400'}`}>
                  {statusCounts[s]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by order #, customer name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E8621A]/30 focus:border-[#E8621A]"
          />
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3 text-gray-500">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading orders...
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-500 font-medium">No orders found</p>
              <p className="text-gray-400 text-sm mt-1">
                {debouncedSearch ? 'Try a different search term' : 'Orders will appear here as they come in'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 cursor-pointer hover:text-[#1A1A1A]" onClick={() => handleSort('order_number')}>
                        Order # <SortArrow col="order_number" />
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 cursor-pointer hover:text-[#1A1A1A]" onClick={() => handleSort('customer_name')}>
                        Customer <SortArrow col="customer_name" />
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 cursor-pointer hover:text-[#1A1A1A]" onClick={() => handleSort('event_date')}>
                        Event Date <SortArrow col="event_date" />
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500">
                        Items
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 cursor-pointer hover:text-[#1A1A1A]" onClick={() => handleSort('order_total')}>
                        Total <SortArrow col="order_total" />
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 cursor-pointer hover:text-[#1A1A1A]" onClick={() => handleSort('status')}>
                        Status <SortArrow col="status" />
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 cursor-pointer hover:text-[#1A1A1A]" onClick={() => handleSort('created_at')}>
                        Created <SortArrow col="created_at" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="border-b border-gray-100 hover:bg-[#F5EDE0]/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-oswald font-bold text-[#E8621A]">
                          {order.order_number}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#1A1A1A]">{order.customer_name}</div>
                          {order.customer_company && (
                            <div className="text-xs text-gray-400">{order.customer_company}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(order.event_date)}</td>
                        <td className="px-4 py-3 text-gray-600">{(order.items || []).length}</td>
                        <td className="px-4 py-3 font-semibold text-[#1A1A1A]">{formatCurrency(order.order_total)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{formatDateTime(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="p-4 hover:bg-[#F5EDE0]/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-oswald font-bold text-[#E8621A]">{order.order_number}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">{order.customer_name}</p>
                        <p className="text-xs text-gray-400">{formatDate(order.event_date)} · {(order.items || []).length} items</p>
                      </div>
                      <p className="font-oswald font-bold text-[#1A1A1A]">{formatCurrency(order.order_total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">
                Showing {showFrom}–{showTo} of {totalCount}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Slide-Out Panel */}
      {selectedOrder && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setSelectedOrder(null)}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white z-50 shadow-2xl overflow-y-auto animate-slide-in-right">
            {/* Panel Header */}
            <div className="sticky top-0 bg-[#1A1A1A] text-white px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-oswald text-xl font-bold tracking-wide">{selectedOrder.order_number}</h2>
                <p className="text-white/60 text-xs mt-0.5">Created {formatDateTime(selectedOrder.created_at)}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Management */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value)}
                  disabled={updatingStatus}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E8621A]/30 disabled:opacity-50"
                >
                  <option value="pending">Pending</option>
                  <option value="invoiced">Invoiced</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[selectedOrder.status] || 'bg-gray-100 text-gray-600'}`}>
                  {selectedOrder.status}
                </span>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Customer</h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-medium text-[#1A1A1A]">{selectedOrder.customer_name}</p>
                    <p className="text-gray-500">{selectedOrder.customer_email}</p>
                    {selectedOrder.customer_phone && <p className="text-gray-500">{selectedOrder.customer_phone}</p>}
                    {selectedOrder.customer_company && <p className="text-gray-400">{selectedOrder.customer_company}</p>}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Delivery Address</p>
                    <p className="text-gray-600">{selectedOrder.delivery_address || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Event Details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Date</p>
                    <p className="font-medium text-[#1A1A1A]">{formatDate(selectedOrder.event_date)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Time</p>
                    <p className="font-medium text-[#1A1A1A]">{selectedOrder.event_time || '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Guests</p>
                    <p className="font-medium text-[#1A1A1A]">{selectedOrder.headcount}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Setup</p>
                    <p className="font-medium text-[#1A1A1A]">{selectedOrder.setup_required ? 'Full' : 'Drop-off'}</p>
                  </div>
                </div>
                {selectedOrder.special_instructions && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-700 uppercase mb-1">Special Instructions</p>
                    <p className="text-sm text-amber-800">{selectedOrder.special_instructions}</p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Order Items ({(selectedOrder.items || []).length})
                </h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Item</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Details</th>
                        <th className="text-right px-4 py-2.5 font-semibold text-gray-500">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.items || []).map((item, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0">
                          <td className="px-4 py-2.5 font-medium text-[#1A1A1A]">{item.title}</td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs">{item.displayText}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-[#1A1A1A]">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-[#F5EDE0] rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-medium">{formatCurrency(selectedOrder.delivery_fee)}</span>
                </div>
                <div className="flex justify-between font-oswald font-bold text-lg pt-2 border-t border-[#E8621A]/30">
                  <span className="text-[#1A1A1A]">Order Total</span>
                  <span className="text-[#E8621A]">{formatCurrency(selectedOrder.order_total)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Per Person ({selectedOrder.headcount} guests)</span>
                  <span>{formatCurrency(selectedOrder.headcount > 0 ? selectedOrder.order_total / selectedOrder.headcount : 0)}</span>
                </div>
              </div>

              {/* QuickBooks Info */}
              {(selectedOrder.qb_invoice_id || selectedOrder.payment_link) && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">QuickBooks</h3>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        {selectedOrder.qb_invoice_number && (
                          <tr className="border-b border-gray-100">
                            <td className="px-4 py-2.5 text-gray-500 font-medium">Invoice #</td>
                            <td className="px-4 py-2.5 text-[#1A1A1A] font-semibold">{selectedOrder.qb_invoice_number}</td>
                          </tr>
                        )}
                        {selectedOrder.qb_invoice_id && (
                          <tr className="border-b border-gray-100">
                            <td className="px-4 py-2.5 text-gray-500 font-medium">Invoice ID</td>
                            <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{selectedOrder.qb_invoice_id}</td>
                          </tr>
                        )}
                        {selectedOrder.qb_payment_id && (
                          <tr className="border-b border-gray-100 bg-green-50">
                            <td className="px-4 py-2.5 text-green-700 font-medium">Payment ID</td>
                            <td className="px-4 py-2.5 text-green-800 font-semibold">{selectedOrder.qb_payment_id}</td>
                          </tr>
                        )}
                        {selectedOrder.qb_payment_method && (
                          <tr className="border-b border-gray-100 bg-green-50">
                            <td className="px-4 py-2.5 text-green-700 font-medium">Payment Method</td>
                            <td className="px-4 py-2.5 text-green-800">{selectedOrder.qb_payment_method}</td>
                          </tr>
                        )}
                        {selectedOrder.qb_payment_amount && (
                          <tr className="border-b border-gray-100 bg-green-50">
                            <td className="px-4 py-2.5 text-green-700 font-medium">Amount Paid</td>
                            <td className="px-4 py-2.5 text-green-800 font-semibold">{formatCurrency(selectedOrder.qb_payment_amount)}</td>
                          </tr>
                        )}
                        {selectedOrder.qb_payment_date && (
                          <tr className="border-b border-gray-100 bg-green-50">
                            <td className="px-4 py-2.5 text-green-700 font-medium">Payment Date</td>
                            <td className="px-4 py-2.5 text-green-800">{formatDate(selectedOrder.qb_payment_date)}</td>
                          </tr>
                        )}
                        {selectedOrder.payment_link && (
                          <tr>
                            <td className="px-4 py-2.5 text-gray-500 font-medium">Payment Link</td>
                            <td className="px-4 py-2.5">
                              <a
                                href={selectedOrder.payment_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#E8621A] hover:underline font-medium"
                              >
                                Open in QuickBooks →
                              </a>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => generateOrderPDF(orderToPDFData(selectedOrder))}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-[#1A1A1A] text-[#1A1A1A] font-oswald font-bold rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Full Order PDF
                </button>
                <button
                  onClick={() => generatePackingSlipPDF(orderToPDFData(selectedOrder))}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-[#E8621A] text-[#E8621A] font-oswald font-bold rounded-lg hover:bg-[#E8621A] hover:text-white transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Packing Slip
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
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

export default function AdminOrdersPageWrapper() {
  return (
    <AdminAuthGate>
      <AdminOrdersPage />
    </AdminAuthGate>
  );
}
