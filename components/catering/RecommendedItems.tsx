'use client';

import { useCatering } from '@/context/CateringContext';
import { getProductsByEventType } from '@/lib/products';
import { getEventTypeName } from '@/lib/event-types';
import { formatCurrency, calculateProductOrder } from '@/lib/pricing';
import { CateringProduct } from '@/lib/types';
import ProductImagePlaceholder from '@/components/ui/ProductImagePlaceholder';

export default function RecommendedItems() {
  const { state, dispatch, isItemInCart } = useCatering();

  if (!state.eventType) return null;

  const allProducts = getProductsByEventType(state.eventType);

  // Filter: popular items not already in cart, respecting budget if set
  const recommended = allProducts
    .filter(p => p.tags?.includes('popular') && !isItemInCart(p.id))
    .filter(p => {
      if (!state.budgetRange) return true;
      const calc = calculateProductOrder(p, state.headcount);
      const perPerson = calc.totalPrice / state.headcount;
      return perPerson <= state.budgetRange.max;
    })
    .slice(0, 6);

  if (recommended.length === 0) return null;

  const handleAdd = (product: CateringProduct) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  return (
    <div className="border-2 border-[#E8621A]/50 rounded-xl p-4 sm:p-6 bg-[#E8621A]/5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[#E8621A] text-lg">&#9733;</span>
        <h3 className="font-oswald text-lg font-bold text-[#1A1A1A] tracking-wide">
          RECOMMENDED FOR YOUR {getEventTypeName(state.eventType).toUpperCase()}
        </h3>
        <span className="text-xs text-gray-500">
          ({state.headcount} guests{state.budgetRange ? `, ${state.budgetRange.label} budget` : ''})
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {recommended.map((product) => {
          const calc = calculateProductOrder(product, state.headcount);
          return (
            <div
              key={product.id}
              className="bg-white rounded-lg overflow-hidden"
            >
              <div className="relative aspect-square">
                <ProductImagePlaceholder title={product.title} />
              </div>
              <div className="pt-3 pb-2 px-2">
                <h4 className="font-oswald font-semibold text-[#1A1A1A] text-sm sm:text-base line-clamp-1">
                  {product.title}
                </h4>
                <p className="text-xs text-gray-500 mb-1 line-clamp-2">{product.description}</p>
                <p className="text-xs sm:text-sm text-[#E8621A] font-semibold mb-2">
                  {formatCurrency(calc.totalPrice / state.headcount)}/person
                </p>
                <button
                  onClick={() => handleAdd(product)}
                  className="w-full text-xs sm:text-sm font-semibold bg-[#1A1A1A] text-white py-2 rounded-lg hover:bg-[#E8621A] transition-colors"
                >
                  Add to Order
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
