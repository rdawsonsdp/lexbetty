'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCatering } from '@/context/CateringContext';
import { useActiveProducts } from '@/lib/hooks/useActiveProducts';
import { formatCurrency } from '@/lib/pricing';
import { CateringProduct } from '@/lib/types';
import {
  MEAT_TAG,
  isMeatTagged,
  isPerLbMeat,
  isPanMeat,
  calculateMeatRecommendation,
  calculatePlannerTotal,
  MeatSelection,
} from '@/lib/meat-planner';

interface MeatPlannerPopupProps {
  isOpen: boolean;
  onClose: (meatsAdded: boolean) => void;
  headcount: number;
}

export default function MeatPlannerPopup({
  isOpen,
  onClose,
  headcount,
}: MeatPlannerPopupProps) {
  const { state, dispatch } = useCatering();
  const { activeProducts } = useActiveProducts();
  const [mounted, setMounted] = useState(false);
  const [selections, setSelections] = useState<Record<string, MeatSelection>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // All meat products from the active catalog, in catalog order
  const meatProducts = activeProducts.filter(isMeatTagged);
  const perLbMeats = meatProducts.filter(isPerLbMeat);
  const panContainerMeats = meatProducts.filter(p => isPanMeat(p) || p.pricing.type === 'per-container');

  // Initialise selections from the cart each time the popup opens
  useEffect(() => {
    if (!isOpen) return;
    const initial: Record<string, MeatSelection> = {};
    meatProducts.forEach(p => {
      const cartItem = state.selectedItems.find(i => i.product.id === p.id);
      if (cartItem) {
        initial[p.id] = {
          selected: true,
          quantity: cartItem.quantity,
          size: cartItem.selectedSize as 'half' | 'full' | undefined,
        };
      }
    });
    setSelections(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // --- handlers -------------------------------------------------------------

  const toggleMeat = (productId: string) => {
    setSelections(prev => {
      const current = prev[productId];
      if (current?.selected) {
        return { ...prev, [productId]: { ...current, selected: false } };
      }
      const product = meatProducts.find(p => p.id === productId)!;
      const rec = calculateMeatRecommendation(product, headcount, current?.size);
      return {
        ...prev,
        [productId]: {
          selected: true,
          quantity: rec.enforcedQty,
          size: rec.defaultSize || current?.size,
        },
      };
    });
  };

  const adjustQuantity = (productId: string, delta: number) => {
    setSelections(prev => {
      const current = prev[productId];
      if (!current?.selected) return prev;
      const product = meatProducts.find(p => p.id === productId)!;
      const rec = calculateMeatRecommendation(product, headcount, current.size);
      const newQty = Math.max(rec.minimum, current.quantity + delta * rec.step);
      return { ...prev, [productId]: { ...current, quantity: newQty } };
    });
  };

  const changeSize = (productId: string, size: 'half' | 'full') => {
    setSelections(prev => {
      const current = prev[productId];
      if (!current?.selected) return prev;
      const product = meatProducts.find(p => p.id === productId)!;
      const rec = calculateMeatRecommendation(product, headcount, size);
      return {
        ...prev,
        [productId]: { ...current, size, quantity: rec.enforcedQty },
      };
    });
  };

  const handleAddMeats = () => {
    // Remove all existing meats from the cart
    meatProducts.forEach(p =>
      dispatch({ type: 'REMOVE_ITEM', payload: p.id }),
    );

    // Add each selected meat with the correct qty & size
    Object.entries(selections).forEach(([id, sel]) => {
      if (!sel.selected) return;
      const product = meatProducts.find(p => p.id === id);
      if (!product) return;
      dispatch({ type: 'ADD_ITEM', payload: product });
      dispatch({
        type: 'UPDATE_ITEM_QUANTITY',
        payload: { productId: id, quantity: sel.quantity },
      });
      if (sel.size) {
        dispatch({
          type: 'SET_ITEM_SIZE',
          payload: { productId: id, size: sel.size },
        });
      }
    });

    onClose(true);
  };

  const handleSkip = () => onClose(false);

  // --- totals ---------------------------------------------------------------

  const { total, perPerson, count } = calculatePlannerTotal(
    selections,
    meatProducts,
    headcount,
  );

  // --- render ---------------------------------------------------------------

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative w-full md:max-w-2xl md:mx-4 max-h-[92vh] md:max-h-[85vh] bg-white rounded-t-2xl md:rounded-2xl flex flex-col shadow-2xl">
        {/* ─── Header ─── */}
        <div className="px-5 sm:px-6 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="font-oswald text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-wide">
              PLAN YOUR PROTEINS
            </h2>
            <button
              onClick={handleSkip}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            We recommend 3 oz per person per meat for{' '}
            <span className="font-semibold text-[#1A1A1A]">
              {headcount} guests
            </span>
          </p>
        </div>

        {/* ─── Body (scrollable) ─── */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4">
          {/* Per-lb section */}
          {perLbMeats.length > 0 && (
            <>
              <h3 className="font-oswald text-xs tracking-[0.2em] text-[#9B9189] uppercase mb-3">
                Meats by the Pound
              </h3>
              <div className="space-y-2">
                {perLbMeats.map(product => (
                  <PerLbRow
                    key={product.id}
                    product={product}
                    headcount={headcount}
                    sel={selections[product.id]}
                    onToggle={() => toggleMeat(product.id)}
                    onAdjust={d => adjustQuantity(product.id, d)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Pan & Container section */}
          {panContainerMeats.length > 0 && (
            <>
              <h3 className="font-oswald text-xs tracking-[0.2em] text-[#9B9189] uppercase mt-6 mb-3">
                Pan &amp; Container Meats
              </h3>
              <div className="space-y-2">
                {panContainerMeats.map(product => (
                  <PanContainerRow
                    key={product.id}
                    product={product}
                    headcount={headcount}
                    sel={selections[product.id]}
                    onToggle={() => toggleMeat(product.id)}
                    onAdjust={d => adjustQuantity(product.id, d)}
                    onSizeChange={s => changeSize(product.id, s)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="border-t border-gray-200 px-5 sm:px-6 py-4 space-y-3 bg-white rounded-b-2xl">
          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {count} meat{count !== 1 ? 's' : ''} selected
            </span>
            {count > 0 && (
              <span className="font-oswald font-bold text-[#1A1A1A]">
                TOTAL: {formatCurrency(total)}{' '}
                <span className="text-sm font-normal text-gray-500">
                  ({formatCurrency(perPerson)}/person)
                </span>
              </span>
            )}
          </div>

          {/* Add button */}
          <button
            onClick={handleAddMeats}
            className="w-full bg-[#E8621A] text-white py-3.5 rounded-xl font-oswald font-bold tracking-wide text-lg hover:bg-[#d4570f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ADD MEATS TO ORDER
          </button>

          {/* Skip link */}
          <button
            onClick={handleSkip}
            className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors"
          >
            Skip &mdash; I&apos;ll pick meats below
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        checked ? 'bg-[#E8621A] border-[#E8621A]' : 'border-gray-300'
      }`}
    >
      {checked && (
        <svg
          className="w-3 h-3 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </div>
  );
}

function QtyStepper({
  value,
  label,
  min,
  onAdjust,
}: {
  value: number;
  label: string;
  min: number;
  onAdjust: (delta: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onAdjust(-1)}
        disabled={value <= min}
        className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-[#1A1A1A] hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
      >
        &minus;
      </button>
      <span className="font-oswald font-bold text-[#1A1A1A] min-w-[5rem] text-center">
        {value} {label}
      </span>
      <button
        onClick={() => onAdjust(1)}
        className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-[#1A1A1A] hover:bg-gray-50 font-bold"
      >
        +
      </button>
    </div>
  );
}

// ─── Per-lb row ─────────────────────────────────────────────────────────────

function PerLbRow({
  product,
  headcount,
  sel,
  onToggle,
  onAdjust,
}: {
  product: CateringProduct;
  headcount: number;
  sel: MeatSelection | undefined;
  onToggle: () => void;
  onAdjust: (d: number) => void;
}) {
  const isSelected = sel?.selected || false;
  const rec = calculateMeatRecommendation(product, headcount);
  const price =
    product.pricing.type === 'per-each' ? product.pricing.priceEach : 0;

  return (
    <div
      className={`border rounded-xl transition-colors ${
        isSelected
          ? 'border-[#E8621A] bg-[#E8621A]/5'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Toggle row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <Checkbox checked={isSelected} />
          <span className="font-oswald font-semibold text-[#1A1A1A]">
            {product.title}
          </span>
          {product.specialOrder && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-medium border border-red-200">
              SPECIAL ORDER
            </span>
          )}
        </div>
        <span className="font-oswald font-bold text-[#1A1A1A] text-sm whitespace-nowrap">
          {formatCurrency(price)}/lb
        </span>
      </button>

      {/* Expanded controls */}
      {isSelected && sel && (
        <div className="px-4 pb-4 pl-12">
          <p className="text-sm text-gray-500 mb-3">{rec.mathString}</p>
          <div className="flex items-center justify-between">
            <QtyStepper
              value={sel.quantity}
              label="lbs"
              min={rec.minimum}
              onAdjust={onAdjust}
            />
            <span className="font-oswald font-bold text-[#E8621A] text-lg">
              {formatCurrency(price * sel.quantity)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pan / Container row ────────────────────────────────────────────────────

function PanContainerRow({
  product,
  headcount,
  sel,
  onToggle,
  onAdjust,
  onSizeChange,
}: {
  product: CateringProduct;
  headcount: number;
  sel: MeatSelection | undefined;
  onToggle: () => void;
  onAdjust: (d: number) => void;
  onSizeChange: (size: 'half' | 'full') => void;
}) {
  const isSelected = sel?.selected || false;
  const isPan = product.pricing.type === 'pan';
  const rec = calculateMeatRecommendation(product, headcount, sel?.size);

  // Price label for the unselected state
  let priceLabel = '';
  if (isPan && product.pricing.type === 'pan') {
    const half = product.pricing.sizes.find(s => s.size === 'half');
    const full = product.pricing.sizes.find(s => s.size === 'full');
    priceLabel = `Half ${formatCurrency(half?.price || 0)} / Full ${formatCurrency(full?.price || 0)}`;
  } else if (product.pricing.type === 'per-container') {
    priceLabel = `${formatCurrency(product.pricing.pricePerContainer)}/container (serves ${product.pricing.servesPerContainer})`;
  }

  // Serves text for unselected pan meats
  let servesHint = '';
  if (isPan && product.pricing.type === 'pan') {
    const full = product.pricing.sizes.find(s => s.size === 'full');
    if (full) servesHint = `serves ${full.servesMin}-${full.servesMax}`;
  }

  return (
    <div
      className={`border rounded-xl transition-colors ${
        isSelected
          ? 'border-[#E8621A] bg-[#E8621A]/5'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Toggle row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left gap-2"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Checkbox checked={isSelected} />
          <span className="font-oswald font-semibold text-[#1A1A1A] truncate">
            {product.title}
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-xs sm:text-sm text-gray-500">{priceLabel}</span>
          {servesHint && (
            <span className="text-xs text-gray-400 block">{servesHint}</span>
          )}
        </div>
      </button>

      {/* Expanded controls */}
      {isSelected && sel && (
        <div className="px-4 pb-4 pl-12">
          {/* Pan size toggle */}
          {isPan && product.pricing.type === 'pan' && (
            <div className="flex gap-2 mb-3">
              {product.pricing.sizes.map(sizeOpt => {
                const active =
                  (sel.size || rec.defaultSize) === sizeOpt.size;
                return (
                  <button
                    key={sizeOpt.size}
                    onClick={() =>
                      onSizeChange(sizeOpt.size as 'half' | 'full')
                    }
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      active
                        ? 'border-[#E8621A] bg-[#E8621A]/10 text-[#E8621A]'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {sizeOpt.size === 'half' ? 'Half Pan' : 'Full Pan'} &mdash;{' '}
                    {formatCurrency(sizeOpt.price)}
                  </button>
                );
              })}
            </div>
          )}

          <p className="text-sm text-gray-500 mb-3">{rec.mathString}</p>

          <div className="flex items-center justify-between">
            <QtyStepper
              value={sel.quantity}
              label={isPan ? '' : 'container' + (sel.quantity !== 1 ? 's' : '')}
              min={rec.minimum}
              onAdjust={onAdjust}
            />
            <span className="font-oswald font-bold text-[#E8621A] text-lg">
              {formatCurrency(rec.unitPrice * sel.quantity)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
