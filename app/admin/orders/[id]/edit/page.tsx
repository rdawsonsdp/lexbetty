'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminAuthGate from '@/components/admin/AdminAuthGate';
import AdminNav from '@/components/admin/AdminNav';
import { useCatering } from '@/context/CateringContext';
import {
  CateringProduct,
  SelectedCateringItem,
  EventType,
  BuyerInfo,
  EventInfo,
} from '@/lib/types';

interface DBOrderItem {
  productId: string;
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedSize?: 'small' | 'medium' | 'large' | 'half' | 'full';
  displayText?: string;
  servesMin?: number;
  servesMax?: number;
}

interface DBOrder {
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
  items: DBOrderItem[];
}

const EDITABLE_STATUSES = new Set(['pending', 'invoiced']);

function buildSyntheticProduct(item: DBOrderItem): CateringProduct {
  // Used when the order references a product no longer in the catalog.
  // Treats the line as a flat-priced item so the cart preserves it.
  return {
    id: item.productId,
    title: item.title,
    description: item.description || '',
    image: '',
    categories: [],
    pricing: {
      type: 'flat',
      flatPrice: item.totalPrice,
    },
    minOrderQuantity: 1,
  };
}

function EditOrderLoaderInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { dispatch } = useCatering();
  const orderId = params?.id || '';

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const adminToken = sessionStorage.getItem('admin_token') || '';

    async function load() {
      try {
        const [orderRes, productsRes] = await Promise.all([
          fetch(`/api/admin/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
          }),
          fetch('/api/catering-products'),
        ]);

        if (!orderRes.ok) {
          const data = await orderRes.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to load order');
        }
        const orderData = await orderRes.json();
        const order: DBOrder = orderData.order;

        if (!EDITABLE_STATUSES.has(order.status)) {
          throw new Error(`Order is ${order.status} — cannot edit. Only pending or invoiced orders are editable.`);
        }

        const productsData = productsRes.ok
          ? await productsRes.json().catch(() => ({ products: [] }))
          : { products: [] };
        const catalog: CateringProduct[] = productsData.products || [];
        const catalogById = new Map(catalog.map((p) => [p.id, p]));

        // Map DB items → SelectedCateringItem
        const selectedItems: SelectedCateringItem[] = (order.items || []).map((item) => {
          const product = catalogById.get(item.productId) || buildSyntheticProduct(item);
          return {
            product,
            quantity: item.quantity || 1,
            selectedSize: item.selectedSize,
          };
        });

        // Reconstruct EventInfo from delivery_address if it looks like "addr, city, state zip"
        const eventInfo: EventInfo = {
          eventDate: order.event_date || '',
          eventTime: order.event_time || '',
          specialInstructions: order.special_instructions || '',
          address: order.delivery_address || '',
          city: '',
          state: '',
          zip: '',
          setupRequired: order.setup_required ?? true,
        };

        // Reconstruct BuyerInfo
        const buyerInfo: BuyerInfo = {
          name: order.customer_name || '',
          email: order.customer_email || '',
          phone: order.customer_phone || '',
          company: order.customer_company || '',
          eventDate: order.event_date || '',
          eventTime: order.event_time || '',
          deliveryAddress: order.delivery_address || '',
          notes: order.special_instructions || '',
        };

        if (cancelled) return;

        dispatch({
          type: 'LOAD_ORDER_FOR_EDIT',
          payload: {
            orderId: order.id,
            orderNumber: order.order_number,
            items: selectedItems,
            headcount: order.headcount || 10,
            eventType: (order.event_type as EventType | null) || null,
            eventInfo,
            buyerInfo,
          },
        });

        // Land on /products so the admin can browse the menu and adjust the cart
        router.replace('/products');
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load order');
        }
      }
    }

    if (orderId) load();
    return () => {
      cancelled = true;
    };
  }, [orderId, dispatch, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="max-w-xl mx-auto px-4 py-12">
        {error ? (
          <>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm mb-4">
              {error}
            </div>
            <button
              onClick={() => router.push('/admin/orders')}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Back to Orders
            </button>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
            <p className="text-sm text-gray-600">Loading order into menu…</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditOrderPage() {
  return (
    <AdminAuthGate>
      <EditOrderLoaderInner />
    </AdminAuthGate>
  );
}
