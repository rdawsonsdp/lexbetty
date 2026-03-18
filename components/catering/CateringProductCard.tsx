'use client';

import { useState, useEffect } from 'react';
import { CateringProduct } from '@/lib/types';
import ProductImagePlaceholder from '@/components/ui/ProductImagePlaceholder';
import { useCatering } from '@/context/CateringContext';
import { formatCurrency } from '@/lib/pricing';
import { isMeatProduct, calculateMeatOrder } from '@/lib/portion-engine';

interface CateringProductCardProps {
  product: CateringProduct;
  featured?: boolean;
}

interface QtyOption {
  value: number;
  label: string;
  price: number;
  serves: string;
}

function generateOptions(product: CateringProduct, headcount: number): QtyOption[] {
  const p = product.pricing;
  const minQty = product.minOrderQuantity || 1;

  switch (p.type) {
    case 'per-each': {
      const opts: QtyOption[] = [];
      const start = Math.max(minQty, 1);
      const step = start >= 5 ? 5 : 1;
      const max = Math.max(start * 8, 50);
      for (let qty = start; qty <= max; qty += step) {
        const servesApprox = Math.floor((qty * 16) / 3);
        opts.push({
          value: qty,
          label: `${qty} lbs — ${formatCurrency(p.priceEach * qty)}`,
          price: p.priceEach * qty,
          serves: `serves ~${servesApprox}`,
        });
      }
      return opts;
    }
    case 'per-lb': {
      const opts: QtyOption[] = [];
      const startLb = Math.max(minQty, 1);
      const stepLb = startLb >= 5 ? 5 : 1;
      const maxLb = Math.max(startLb * 8, 50);
      for (let qty = startLb; qty <= maxLb; qty += stepLb) {
        const servesApprox = Math.floor((qty * 16) / 3);
        opts.push({
          value: qty,
          label: `${qty} lbs — ${formatCurrency(p.pricePerLb * qty)}`,
          price: p.pricePerLb * qty,
          serves: `serves ~${servesApprox}`,
        });
      }
      return opts;
    }
    case 'per-container': {
      const opts: QtyOption[] = [];
      for (let qty = 1; qty <= 10; qty++) {
        opts.push({
          value: qty,
          label: `${qty} container${qty > 1 ? 's' : ''} — ${formatCurrency(p.pricePerContainer * qty)}`,
          price: p.pricePerContainer * qty,
          serves: `serves ${p.servesPerContainer * qty}`,
        });
      }
      return opts;
    }
    case 'per-dozen': {
      const opts: QtyOption[] = [];
      const maxDz = Math.max(Math.ceil(headcount / p.servesPerDozen) + 3, 8);
      for (let qty = 1; qty <= maxDz; qty++) {
        opts.push({
          value: qty,
          label: `${qty} dozen — ${formatCurrency(p.pricePerDozen * qty)}`,
          price: p.pricePerDozen * qty,
          serves: `serves ${p.servesPerDozen * qty}`,
        });
      }
      return opts;
    }
    default:
      return [];
  }
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

export default function CateringProductCard({ product, featured }: CateringProductCardProps) {
  const { state, dispatch, isItemInCart, getItemQuantity } = useCatering();
  const inCart = isItemInCart(product.id);
  const itemQty = getItemQuantity(product.id);
  const cartItem = state.selectedItems.find(i => i.product.id === product.id);
  const selectedSize = cartItem?.selectedSize;
  const minQty = product.minOrderQuantity || 1;
  const hasSizes = product.pricing.type === 'pan' || product.pricing.type === 'tray';
  const hasQtyDropdown = ['per-each', 'per-lb', 'per-container', 'per-dozen'].includes(product.pricing.type);

  // Local preview state for dropdown selection (before adding to cart)
  const defaultQty = getDefaultQty(product, state.headcount);
  const [previewQty, setPreviewQty] = useState(defaultQty);
  const [previewSize, setPreviewSize] = useState<string | undefined>(undefined);

  // Sync preview with cart when item is in cart
  useEffect(() => {
    if (inCart) {
      setPreviewQty(itemQty);
      if (selectedSize) setPreviewSize(selectedSize);
    }
  }, [inCart, itemQty, selectedSize]);

  // Recalc default when headcount changes
  useEffect(() => {
    if (!inCart) setPreviewQty(getDefaultQty(product, state.headcount));
  }, [state.headcount, product, inCart]);

  // Calculate displayed price based on current selection
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

  // Serving text for current selection
  const servingText = (() => {
    const p = product.pricing;
    const qty = inCart ? itemQty : previewQty;
    if (hasSizes) {
      const currentSize = previewSize || (p.type === 'pan' || p.type === 'tray' ? p.sizes[p.sizes.length - 1].size : undefined);
      const sizeObj = (p.type === 'pan' || p.type === 'tray')
        ? p.sizes.find(s => s.size === currentSize) || p.sizes[p.sizes.length - 1]
        : null;
      if (!sizeObj) return '';
      const cartQty = inCart ? itemQty : 1;
      const label = p.type === 'pan' ? (sizeObj.size === 'half' ? 'Half Pan' : 'Full Pan') : sizeObj.size.charAt(0).toUpperCase() + sizeObj.size.slice(1) + ' Tray';
      return `${cartQty > 1 ? cartQty + ' × ' : ''}${label} (serves ${sizeObj.servesMin * cartQty}-${sizeObj.servesMax * cartQty})`;
    }
    switch (p.type) {
      case 'per-each': return `${qty} ${p.unit === 'lb' ? 'lbs' : ''} — serves ~${Math.floor((qty * 16) / 3)}`;
      case 'per-lb': return `${qty} lbs — serves ~${Math.floor((qty * 16) / 3)}`;
      case 'per-container': return `${qty} container${qty > 1 ? 's' : ''} — serves ${p.servesPerContainer * qty}`;
      case 'per-dozen': return `${qty} dozen — serves ${p.servesPerDozen * qty}`;
      case 'per-person': return `${state.headcount} servings`;
      case 'flat': return 'Flat rate';
      default: return '';
    }
  })();

  const handleAdd = () => {
    dispatch({ type: 'ADD_ITEM', payload: product });
    // Set the previewed quantity if it differs from default
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
      if (val < minQty) {
        handleRemove();
      } else {
        dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { productId: product.id, quantity: val } });
      }
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

  // --- RENDER SELECTORS ---

  const sizeSelector = hasSizes ? (() => {
    const sizes = product.pricing.type === 'pan' ? product.pricing.sizes
      : product.pricing.type === 'tray' ? product.pricing.sizes : [];
    return (
      <select
        value={previewSize || selectedSize || sizes[sizes.length - 1]?.size || ''}
        onChange={(e) => handleSizeChange(e.target.value)}
        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
      >
        {sizes.map((opt) => {
          const label = product.pricing.type === 'pan'
            ? (opt.size === 'half' ? 'Half Pan' : 'Full Pan')
            : opt.size.charAt(0).toUpperCase() + opt.size.slice(1) + ' Tray';
          return (
            <option key={opt.size} value={opt.size}>
              {label} — {formatCurrency(opt.price)} (serves {opt.servesMin}-{opt.servesMax})
            </option>
          );
        })}
      </select>
    );
  })() : null;

  const qtyDropdown = hasQtyDropdown ? (() => {
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
        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
      >
        {inCart && <option value="0">Remove from order</option>}
        {opts.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label} ({opt.serves})
          </option>
        ))}
      </select>
    );
  })() : null;

  // Quantity stepper for pan/tray items (how many pans)
  const panStepper = hasSizes && inCart ? (
    <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => {
          if (itemQty <= minQty) handleRemove();
          else dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { productId: product.id, quantity: itemQty - 1 } });
        }}
        className="w-10 h-10 flex items-center justify-center text-[#1A1A1A] hover:bg-gray-50 rounded-l-lg font-bold text-lg"
      >
        {itemQty <= minQty ? (
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ) : '−'}
      </button>
      <span className="font-oswald font-bold text-[#1A1A1A] text-lg min-w-[2rem] text-center">{itemQty}</span>
      <button
        onClick={() => dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { productId: product.id, quantity: itemQty + 1 } })}
        className="w-10 h-10 flex items-center justify-center text-[#1A1A1A] hover:bg-gray-50 rounded-r-lg font-bold text-lg"
      >+</button>
    </div>
  ) : null;

  // Dietary tags
  const dietaryTags = (
    product.tags && product.tags.length > 0 ? (
      <div className="flex flex-wrap gap-1 mb-2">
        {product.tags.includes('vegan') && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Vegan</span>}
        {product.tags.includes('vegetarian') && !product.tags.includes('vegan') && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">Vegetarian</span>}
        {product.tags.includes('gluten-free') && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">GF</span>}
        {product.tags.includes('dairy-free') && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">DF</span>}
        {product.tags.includes('halal') && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">Halal</span>}
        {product.specialOrder && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-medium border border-red-200">Special Order</span>}
      </div>
    ) : null
  );

  return (
    <div className={`flex flex-col h-full group ${product.featured ? 'ring-2 ring-[#E8621A] rounded-xl p-2 bg-[#E8621A]/5' : ''}`}>
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <ProductImagePlaceholder title={product.title} />
        {product.featured && (
          <div className="absolute top-2 left-2 bg-[#E8621A] text-white text-[10px] font-oswald font-bold tracking-wider px-2 py-0.5 rounded">
            CHEF&apos;S PICK
          </div>
        )}
      </div>
      <div className={`flex-1 flex flex-col ${featured ? 'pt-4' : 'pt-3 sm:pt-4'}`}>
        <h3 className={`font-oswald font-semibold text-[#1A1A1A] mb-1 tracking-wide ${featured ? 'text-base sm:text-lg' : 'text-sm sm:text-base line-clamp-2'}`}>
          {product.title}
        </h3>
        <p className={`text-gray-500 mb-2 line-clamp-2 ${featured ? 'text-xs sm:text-sm' : 'text-xs'}`}>{product.description}</p>
        {dietaryTags}

        {/* Price & serving info — updates with dropdown selection */}
        <div className="mb-3">
          <div className="text-lg sm:text-xl font-oswald font-bold text-[#E8621A]">
            {formatCurrency(displayPrice)}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{servingText}</div>
          {minQty > 1 && <div className="text-xs text-amber-600 font-medium mt-0.5">Min. order: {minQty}</div>}
        </div>

        {/* Selectors */}
        <div className="mt-auto space-y-2">
          {sizeSelector}
          {qtyDropdown}
          {panStepper}
          {!inCart ? (
            <button
              onClick={handleAdd}
              className="w-full font-oswald text-sm tracking-wide border border-[#1A1A1A] text-[#1A1A1A] py-2.5 rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-colors"
            >
              Add to Order
            </button>
          ) : !hasQtyDropdown && !hasSizes ? (
            <button
              onClick={handleRemove}
              className="w-full font-oswald text-sm tracking-wide bg-[#1A1A1A] text-white py-2.5 rounded-lg hover:bg-red-500 transition-colors"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
