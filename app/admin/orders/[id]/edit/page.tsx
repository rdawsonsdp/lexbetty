'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import OrderEditForm, { OrderItem } from '@/components/admin/OrderEditForm';
import OrderItemsEditor from '@/components/admin/OrderItemsEditor';
import MenuPicker from '@/components/admin/MenuPicker';

export default function EditOrderPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id || '';

  const [items, setItems] = useState<OrderItem[]>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    const token = sessionStorage.getItem('admin_token') ?? '';
    fetch(`/api/admin/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.order) return;
        setItems(data.order.items || []);
        setDeliveryFee(data.order.delivery_fee || 0);
        setInitialized(true);
      })
      .catch(() => {});
  }, [orderId]);

  const handleAddItem = (item: OrderItem) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === item.productId && i.selectedSize === item.selectedSize);
      if (existingIdx >= 0) {
        const next = [...prev];
        const existing = next[existingIdx];
        const newQty = existing.quantity + 1;
        next[existingIdx] = {
          ...existing,
          quantity: newQty,
          totalPrice: existing.unitPrice * newQty,
        };
        return next;
      }
      return [...prev, item];
    });
  };

  const itemsSlot = (
    <div className="space-y-4">
      <OrderItemsEditor items={items} onChange={setItems} />
      {initialized && (
        <details className="bg-white rounded-xl shadow-sm border overflow-hidden" open>
          <summary className="cursor-pointer select-none px-4 py-3 font-oswald font-bold text-sm text-[#1A1A1A] tracking-wide hover:bg-gray-50 flex items-center justify-between">
            <span>Add Items From Menu</span>
            <span className="text-xs text-gray-500 font-normal">Click any item to add</span>
          </summary>
          <div className="border-t">
            <MenuPicker onAdd={handleAddItem} existingProductIds={items.map((i) => i.productId)} />
          </div>
        </details>
      )}
    </div>
  );

  return (
    <OrderEditForm
      itemsSlot={itemsSlot}
      items={initialized ? items : undefined}
      onItemsChange={setItems}
      deliveryFee={initialized ? deliveryFee : undefined}
      onDeliveryFeeChange={setDeliveryFee}
    />
  );
}
