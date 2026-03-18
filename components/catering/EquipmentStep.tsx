'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCatering } from '@/context/CateringContext';
import { useActiveProducts } from '@/lib/hooks/useActiveProducts';
import { formatCurrency, calculateProductOrder } from '@/lib/pricing';
import { CateringProduct } from '@/lib/types';

export default function EquipmentStep() {
  const router = useRouter();
  const { state, dispatch, isItemInCart, getItemQuantity } = useCatering();
  const { getActiveByEventType } = useActiveProducts();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Get only equipment items
  const equipmentProducts = getActiveByEventType(state.eventType).filter(
    p => p.tags?.includes('equipment') || p.tags?.includes('cutlery')
  );

  // Smart suggestions based on order
  const panCount = state.selectedItems.reduce((sum, item) => {
    if (item.product.pricing.type === 'pan') return sum + item.quantity;
    return sum;
  }, 0);

  const suggestions: { productId: string; reason: string }[] = [];
  if (panCount > 0) {
    suggestions.push({ productId: 'sterno', reason: `You have ${panCount} pan${panCount > 1 ? 's' : ''} — keep them warm` });
    suggestions.push({ productId: 'catering-rack', reason: 'Hold your pans at serving height' });
  }
  if (state.headcount >= 10) {
    suggestions.push({ productId: 'utensil-sets', reason: `${state.headcount} guests will need utensils` });
    suggestions.push({ productId: 'serving-utensils', reason: 'For self-serve stations' });
  }

  const handleAdd = (product: CateringProduct) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  const handleUpdateQuantity = (product: CateringProduct, newQty: number) => {
    const minQty = product.minOrderQuantity || 1;
    if (newQty < minQty) {
      dispatch({ type: 'REMOVE_ITEM', payload: product.id });
    } else {
      dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { productId: product.id, quantity: newQty } });
    }
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 5 });
  };

  return (
    <div ref={sectionRef} className="bg-[#F5EDE0] py-12 sm:py-16 scroll-mt-4">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] tracking-wider mb-4">
            EQUIPMENT & EXTRAS
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Add serving equipment to complete your catering setup. These are optional but recommended.
          </p>
        </div>

        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="border-2 border-[#E8621A]/30 rounded-xl p-4 sm:p-6 bg-[#E8621A]/5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[#E8621A] text-lg">&#9733;</span>
                <h3 className="font-oswald text-lg font-bold text-[#1A1A1A] tracking-wide">
                  SUGGESTED FOR YOUR ORDER
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestions.map(({ productId, reason }) => {
                  const product = equipmentProducts.find(p => p.id === productId);
                  if (!product) return null;
                  const inCart = isItemInCart(productId);
                  const qty = getItemQuantity(productId);
                  const calc = calculateProductOrder(product, state.headcount);

                  return (
                    <div key={productId} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="font-oswald font-semibold text-[#1A1A1A] text-sm">{product.title}</p>
                        <p className="text-xs text-gray-500">{reason}</p>
                        <p className="text-xs text-[#E8621A] font-semibold mt-0.5">{formatCurrency(calc.totalPrice)}</p>
                      </div>
                      {inCart ? (
                        <div className="flex items-center gap-1 bg-gray-50 rounded-lg border border-gray-200">
                          <button
                            onClick={() => handleUpdateQuantity(product, qty - 1)}
                            className="w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-gray-100 rounded-l-lg font-bold"
                          >
                            {qty <= (product.minOrderQuantity || 1) ? '×' : '−'}
                          </button>
                          <span className="font-oswald font-bold text-[#1A1A1A] text-sm w-6 text-center">{qty}</span>
                          <button
                            onClick={() => handleUpdateQuantity(product, qty + 1)}
                            className="w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-gray-100 rounded-r-lg font-bold"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAdd(product)}
                          className="text-xs font-semibold bg-[#1A1A1A] text-white px-3 py-2 rounded-lg hover:bg-[#E8621A] transition-colors whitespace-nowrap"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* All Equipment Grid */}
        <div className="max-w-3xl mx-auto">
          <h3 className="font-oswald text-lg font-bold text-[#1A1A1A] tracking-wide mb-4">
            ALL EQUIPMENT
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {equipmentProducts.map((product) => {
              const inCart = isItemInCart(product.id);
              const qty = getItemQuantity(product.id);
              const calc = calculateProductOrder(product, state.headcount);

              return (
                <div key={product.id} className="bg-white rounded-lg overflow-hidden border border-gray-100">
                  <div className="relative aspect-square bg-gray-100">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="font-oswald font-semibold text-[#1A1A1A] text-sm mb-1">{product.title}</h4>
                    <p className="text-xs text-gray-500 mb-2">{formatCurrency(calc.totalPrice)} each</p>
                    {inCart ? (
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg border border-gray-200">
                        <button
                          onClick={() => handleUpdateQuantity(product, qty - 1)}
                          className="w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-gray-100 rounded-l-lg font-bold text-sm"
                        >
                          {qty <= (product.minOrderQuantity || 1) ? '×' : '−'}
                        </button>
                        <span className="font-oswald font-bold text-[#1A1A1A] text-sm">{qty}</span>
                        <button
                          onClick={() => handleUpdateQuantity(product, qty + 1)}
                          className="w-8 h-8 flex items-center justify-center text-[#1A1A1A] hover:bg-gray-100 rounded-r-lg font-bold text-sm"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAdd(product)}
                        className="w-full text-xs font-semibold bg-[#1A1A1A] text-white py-2 rounded-lg hover:bg-[#E8621A] transition-colors"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Checkout / Skip */}
        <div className="mt-10 text-center space-y-4">
          <button
            onClick={handleCheckout}
            className="font-oswald font-bold text-white bg-[#E8621A] px-10 py-3 rounded-lg hover:opacity-90 transition-all tracking-wide text-lg"
          >
            PROCEED TO CHECKOUT
          </button>
          <div>
            <button
              onClick={handleBack}
              className="font-oswald text-gray-500 hover:text-[#1A1A1A] transition-colors tracking-wide"
            >
              ← BACK TO MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
