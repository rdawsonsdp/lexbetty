'use client';

import { CateringProduct } from '@/lib/types';
import ProductImagePlaceholder from '@/components/ui/ProductImagePlaceholder';
import { useCatering } from '@/context/CateringContext';
import { calculateProductOrder, formatCurrency } from '@/lib/pricing';

interface CateringProductCardProps {
  product: CateringProduct;
  featured?: boolean;
}

export default function CateringProductCard({ product, featured }: CateringProductCardProps) {
  const { state, dispatch, isItemInCart, getItemQuantity } = useCatering();
  const inCart = isItemInCart(product.id);
  const itemQty = getItemQuantity(product.id);

  // Calculate what the customer will get based on current headcount
  const orderCalc = calculateProductOrder(product, state.headcount);
  const displayTotal = orderCalc.totalPrice * (itemQty || 1);

  const handleAdd = () => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  const handleRemove = () => {
    dispatch({ type: 'REMOVE_ITEM', payload: product.id });
  };

  const handleUpdateQuantity = (newQty: number) => {
    if (newQty <= 0) {
      handleRemove();
    } else {
      dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { productId: product.id, quantity: newQty } });
    }
  };

  // Shared dietary tags
  const dietaryTags = (
    product.tags && product.tags.length > 0 ? (
      <div className="flex flex-wrap gap-1 mb-2">
        {product.tags.includes('vegan') && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Vegan</span>
        )}
        {product.tags.includes('vegetarian') && !product.tags.includes('vegan') && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">Vegetarian</span>
        )}
        {product.tags.includes('gluten-free') && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">GF</span>
        )}
        {product.tags.includes('dairy-free') && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">DF</span>
        )}
        {product.tags.includes('halal') && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">Halal</span>
        )}
      </div>
    ) : null
  );

  // Shared quantity stepper
  const quantityStepper = (
    <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => handleUpdateQuantity(itemQty - 1)}
        className="w-10 h-10 flex items-center justify-center text-[#383838] hover:bg-gray-50 rounded-l-lg transition-colors font-bold text-lg"
        aria-label="Decrease quantity"
      >
        {itemQty === 1 ? (
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ) : '−'}
      </button>
      <span className="font-oswald font-bold text-[#383838] text-lg min-w-[2rem] text-center">
        {itemQty}
      </span>
      <button
        onClick={() => handleUpdateQuantity(Math.min(itemQty + 1, 4))}
        disabled={itemQty >= 4}
        className="w-10 h-10 flex items-center justify-center text-[#383838] hover:bg-gray-50 rounded-r-lg transition-colors font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );

  // Shared add button — filled with checkmark when in cart
  const addButton = inCart ? (
    <div className="space-y-2">
      {quantityStepper}
    </div>
  ) : (
    <button
      onClick={handleAdd}
      className="w-full font-oswald text-sm tracking-wide border border-[#383838] text-[#383838] py-2.5 rounded-lg hover:bg-[#383838] hover:text-white transition-colors"
    >
      Add to Order
    </button>
  );

  // Featured card layout
  if (featured) {
    return (
      <div className="flex flex-col h-full group">
        {/* Image placeholder */}
        <div className="relative aspect-square overflow-hidden rounded-lg">
          <ProductImagePlaceholder title={product.title} />
        </div>

        {/* Content */}
        <div className="flex-1 pt-4 flex flex-col">
          <h3 className="font-oswald text-base sm:text-lg font-semibold text-[#383838] mb-1 tracking-wide">
            {product.title}
          </h3>

          {dietaryTags}

          {/* Price + serving info */}
          <div className="mb-3">
            <div className="text-lg sm:text-xl font-oswald font-bold text-[#383838]">
              {formatCurrency(displayTotal)}
            </div>
            <div className="text-sm text-gray-600 mt-0.5">
              {itemQty > 1 ? `${itemQty} × ` : ''}{orderCalc.displayText}
            </div>
          </div>

          {/* Button */}
          <div className="mt-auto">
            {addButton}
          </div>
        </div>
      </div>
    );
  }

  // Standard card layout — clean, no card wrapper
  return (
    <div className="flex flex-col h-full group">
      {/* Product image placeholder */}
      <div className="relative aspect-square rounded-lg overflow-hidden">
        <ProductImagePlaceholder title={product.title} />
      </div>

      {/* Product info — simple typography below image */}
      <div className="pt-3 sm:pt-4 flex flex-col flex-1">
        <h3 className="font-oswald font-semibold text-[#383838] mb-1 text-sm sm:text-base line-clamp-2 tracking-wide">
          {product.title}
        </h3>

        {dietaryTags}

        {/* Price + serving info */}
        <div className="mb-3">
          <div className="text-lg sm:text-xl font-oswald font-bold text-[#383838]">
            {formatCurrency(displayTotal)}
          </div>
          <div className="text-sm text-gray-600 mt-0.5">
            {itemQty > 1 ? `${itemQty} × ` : ''}{orderCalc.displayText}
          </div>
        </div>

        {/* Add button / quantity stepper */}
        <div className="mt-auto">
          {addButton}
        </div>
      </div>
    </div>
  );
}
