'use client';

import { formatCurrency } from '@/lib/pricing';

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

interface OrderItemsEditorProps {
  items: OrderItem[];
  onChange: (items: OrderItem[]) => void;
}

export default function OrderItemsEditor({ items, onChange }: OrderItemsEditorProps) {
  const updateQty = (index: number, nextQty: number) => {
    if (nextQty < 1) return;
    const next = items.map((item, i) => {
      if (i !== index) return item;
      const unit = item.unitPrice || 0;
      return {
        ...item,
        quantity: nextQty,
        totalPrice: unit > 0 ? unit * nextQty : item.totalPrice,
      };
    });
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="text-3xl mb-2">🍽️</div>
        <p className="font-oswald text-[#1A1A1A] font-semibold">No items in this order yet</p>
        <p className="text-sm text-gray-500 mt-1">Add items from the menu to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const hasUnitPrice = (item.unitPrice || 0) > 0;
        return (
          <div
            key={`${item.productId}-${i}`}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-oswald font-bold text-[#1A1A1A] tracking-wide leading-tight">
                  {item.title}
                </h3>
                {item.displayText && (
                  <p className="text-xs text-gray-500 mt-0.5">{item.displayText}</p>
                )}
                {!hasUnitPrice && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    Legacy item — quantity locked
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`Remove ${item.title}`}
                className="flex-shrink-0 w-7 h-7 rounded-full text-gray-400 hover:text-white hover:bg-red-500 border border-gray-200 hover:border-red-500 flex items-center justify-center transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => updateQty(i, item.quantity - 1)}
                  disabled={!hasUnitPrice || item.quantity <= 1}
                  aria-label="Decrease quantity"
                  className="w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-[#F5EDE0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  −
                </button>
                <span className="w-10 h-8 flex items-center justify-center text-sm font-semibold text-[#1A1A1A] border-x border-gray-200">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQty(i, item.quantity + 1)}
                  disabled={!hasUnitPrice}
                  aria-label="Increase quantity"
                  className="w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-[#F5EDE0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  +
                </button>
              </div>

              <div className="font-oswald font-bold text-lg text-[#E8621A]">
                {formatCurrency(item.totalPrice || 0)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
