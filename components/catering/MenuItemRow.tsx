'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CateringProduct } from '@/lib/types';
import { useCatering } from '@/context/CateringContext';
import { formatCurrency } from '@/lib/pricing';
import { isMeatProduct, calculateMeatOrder } from '@/lib/portion-engine';

interface MenuItemRowProps {
  product: CateringProduct;
}

function getDefaultQty(product: CateringProduct, headcount: number): number {
  const minQty = product.minOrderQuantity || 1;
  const p = product.pricing;
  if (p.type === 'per-each' && isMeatProduct(product.id)) {
    const calc = calculateMeatOrder(product, headcount);
    return calc.enforced;
  }
  if (p.type === 'per-each') return Math.max(minQty, 1);
  if (p.type === 'per-container') return Math.max(1, Math.ceil(headcount / p.servesPerContainer));
  if (p.type === 'per-dozen') return Math.max(1, Math.ceil(headcount / p.servesPerDozen));
  return minQty;
}

function generateOptions(product: CateringProduct, headcount: number) {
  const p = product.pricing;
  const minQty = product.minOrderQuantity || 1;
  switch (p.type) {
    case 'per-each': {
      const opts: { value: number; label: string }[] = [];
      const start = Math.max(minQty, 1);
      const step = start >= 5 ? 5 : 1;
      const max = Math.max(start * 8, 50);
      for (let qty = start; qty <= max; qty += step) {
        opts.push({ value: qty, label: `${qty} lbs — ${formatCurrency(p.priceEach * qty)}` });
      }
      return opts;
    }
    case 'per-lb': {
      const opts: { value: number; label: string }[] = [];
      const start = Math.max(minQty, 1);
      const step = start >= 5 ? 5 : 1;
      const max = Math.max(start * 8, 50);
      for (let qty = start; qty <= max; qty += step) {
        opts.push({ value: qty, label: `${qty} lbs — ${formatCurrency(p.pricePerLb * qty)}` });
      }
      return opts;
    }
    case 'per-container': {
      const opts: { value: number; label: string }[] = [];
      for (let qty = 1; qty <= 10; qty++) {
        opts.push({ value: qty, label: `${qty} container${qty > 1 ? 's' : ''} — ${formatCurrency(p.pricePerContainer * qty)} (serves ${p.servesPerContainer * qty})` });
      }
      return opts;
    }
    case 'per-dozen': {
      const opts: { value: number; label: string }[] = [];
      const maxDz = Math.max(Math.ceil(headcount / p.servesPerDozen) + 3, 8);
      for (let qty = 1; qty <= maxDz; qty++) {
        opts.push({ value: qty, label: `${qty} dozen — ${formatCurrency(p.pricePerDozen * qty)} (serves ${p.servesPerDozen * qty})` });
      }
      return opts;
    }
    default:
      return [];
  }
}

export default function MenuItemRow({ product }: MenuItemRowProps) {
  const { state, dispatch, isItemInCart, getItemQuantity } = useCatering();
  const inCart = isItemInCart(product.id);
  const itemQty = getItemQuantity(product.id);
  const cartItem = state.selectedItems.find(i => i.product.id === product.id);
  const selectedSize = cartItem?.selectedSize;
  const minQty = product.minOrderQuantity || 1;
  const hasSizes = product.pricing.type === 'pan' || product.pricing.type === 'tray';
  const hasQtyDropdown = ['per-each', 'per-lb', 'per-container', 'per-dozen'].includes(product.pricing.type);

  const defaultQty = getDefaultQty(product, state.headcount);
  const [previewQty, setPreviewQty] = useState(defaultQty);
  const [previewSize, setPreviewSize] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (inCart) {
      setPreviewQty(itemQty);
      if (selectedSize) setPreviewSize(selectedSize);
    }
  }, [inCart, itemQty, selectedSize]);

  useEffect(() => {
    if (!inCart) setPreviewQty(getDefaultQty(product, state.headcount));
  }, [state.headcount, product, inCart]);

  // Price display
  const displayPrice = (() => {
    const p = product.pricing;
    if (hasSizes) {
      const currentSize = previewSize || (p.type === 'pan' || p.type === 'tray' ? p.sizes[p.sizes.length - 1].size : undefined);
      const sizeObj = (p.type === 'pan' || p.type === 'tray')
        ? p.sizes.find(s => s.size === currentSize) || p.sizes[p.sizes.length - 1]
        : null;
      const qty = inCart ? itemQty : 1;
      return sizeObj ? sizeObj.price * qty : 0;
    }
    const qty = inCart ? itemQty : previewQty;
    switch (p.type) {
      case 'per-each': return p.priceEach * qty;
      case 'per-lb': return p.pricePerLb * qty;
      case 'per-container': return p.pricePerContainer * qty;
      case 'per-dozen': return p.pricePerDozen * qty;
      case 'per-person': return p.pricePerPerson * state.headcount;
      case 'flat': return p.flatPrice;
      default: return 0;
    }
  })();

  // Variant summary text
  const variantText = (() => {
    const p = product.pricing;
    if (hasSizes && (p.type === 'pan' || p.type === 'tray')) {
      return p.sizes.map(s => {
        const label = p.type === 'pan'
          ? (s.size === 'half' ? 'Half Pan' : 'Full Pan')
          : s.size.charAt(0).toUpperCase() + s.size.slice(1);
        return `${label} ${formatCurrency(s.price)} (serves ${s.servesMin}-${s.servesMax})`;
      }).join(' · ');
    }
    switch (p.type) {
      case 'per-each': return `${formatCurrency(p.priceEach)}/lb`;
      case 'per-lb': return `${formatCurrency(p.pricePerLb)}/lb`;
      case 'per-container': return `${formatCurrency(p.pricePerContainer)}/container (serves ${p.servesPerContainer})`;
      case 'per-dozen': return `${formatCurrency(p.pricePerDozen)}/dozen`;
      case 'per-person': return `${formatCurrency(p.pricePerPerson)}/person`;
      case 'flat': return formatCurrency(p.flatPrice);
      default: return '';
    }
  })();

  const handleAdd = () => {
    dispatch({ type: 'ADD_ITEM', payload: product });
    if (hasQtyDropdown && previewQty > minQty) {
      setTimeout(() => {
        dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { productId: product.id, quantity: previewQty } });
      }, 0);
    }
    if (previewSize) {
      setTimeout(() => {
        dispatch({ type: 'SET_ITEM_SIZE', payload: { productId: product.id, size: previewSize as 'half' | 'full' | 'small' | 'medium' | 'large' } });
      }, 0);
    }
  };

  const handleRemove = () => {
    dispatch({ type: 'REMOVE_ITEM', payload: product.id });
  };

  const handleQtyChange = (val: number) => {
    if (inCart) {
      if (val < minQty) handleRemove();
      else dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { productId: product.id, quantity: val } });
    } else {
      setPreviewQty(val);
    }
  };

  const handleSizeChange = (size: string) => {
    if (inCart) {
      dispatch({ type: 'SET_ITEM_SIZE', payload: { productId: product.id, size: size as 'half' | 'full' | 'small' | 'medium' | 'large' } });
    }
    setPreviewSize(size);
  };

  return (
    <div className={`py-4 border-b border-gray-100 last:border-b-0 ${inCart ? 'bg-[#E8621A]/5 -mx-3 px-3 rounded-lg' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Left: Name, description, variant info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-oswald font-semibold text-[#1A1A1A] text-sm sm:text-base tracking-wide">
              {product.title}
            </h4>
            {product.featured && (
              <span className="bg-[#E8621A] text-white text-[9px] font-oswald font-bold tracking-wider px-1.5 py-0.5 rounded flex-shrink-0">
                CHEF&apos;S PICK
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{product.description}</p>
          <p className="text-[#E8621A] font-semibold text-xs mt-1">{variantText}</p>

        {/* Selectors */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {hasSizes && (() => {
            const sizes = product.pricing.type === 'pan' ? product.pricing.sizes
              : product.pricing.type === 'tray' ? product.pricing.sizes : [];
            return (
              <select
                value={previewSize || selectedSize || sizes[sizes.length - 1]?.size || ''}
                onChange={(e) => handleSizeChange(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
              >
                {sizes.map((opt) => {
                  const label = product.pricing.type === 'pan'
                    ? (opt.size === 'half' ? 'Half Pan' : 'Full Pan')
                    : opt.size.charAt(0).toUpperCase() + opt.size.slice(1);
                  return (
                    <option key={opt.size} value={opt.size}>
                      {label} — {formatCurrency(opt.price)}
                    </option>
                  );
                })}
              </select>
            );
          })()}

          {hasQtyDropdown && (() => {
            const opts = generateOptions(product, state.headcount);
            const currentVal = inCart ? itemQty : previewQty;
            return (
              <select
                value={currentVal}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val === 0) { handleRemove(); return; }
                  handleQtyChange(val);
                }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
              >
                {inCart && <option value="0">Remove</option>}
                {opts.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            );
          })()}

          {/* Pan stepper */}
          {hasSizes && inCart && (
            <div className="flex items-center bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => {
                  if (itemQty <= minQty) handleRemove();
                  else dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { productId: product.id, quantity: itemQty - 1 } });
                }}
                className="w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-gray-50 rounded-l-lg font-bold"
              >
                {itemQty <= minQty ? '×' : '−'}
              </button>
              <span className="font-oswald font-bold text-[#1A1A1A] text-sm min-w-[1.5rem] text-center">{itemQty}</span>
              <button
                onClick={() => dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { productId: product.id, quantity: itemQty + 1 } })}
                className="w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-gray-50 rounded-r-lg font-bold"
              >+</button>
            </div>
          )}
        </div>
      </div>

        {/* Price */}
        <div className="flex-shrink-0">
          <span className="font-oswald font-bold text-[#1A1A1A] text-base">
            {formatCurrency(displayPrice)}
          </span>
        </div>
      </div>

      {/* Full-width Add/Remove button */}
      <div className="mt-3">
        {!inCart ? (
          <button
            onClick={handleAdd}
            className="w-full font-oswald text-sm font-bold tracking-wide bg-[#E8621A] text-white py-3 rounded-lg shadow-[0_4px_0_0_#b84a10] hover:shadow-[0_2px_0_0_#b84a10] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all"
          >
            ADD TO ORDER
          </button>
        ) : !hasQtyDropdown && !hasSizes ? (
          <button
            onClick={handleRemove}
            className="w-full font-oswald text-sm font-bold tracking-wide bg-[#1A1A1A] text-white py-3 rounded-lg shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all hover:bg-red-600 hover:shadow-[0_2px_0_0_#991b1b]"
          >
            REMOVE
          </button>
        ) : null}
      </div>
    </div>
  );
}
