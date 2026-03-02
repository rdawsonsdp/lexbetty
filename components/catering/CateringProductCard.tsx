'use client';

import Image from 'next/image';
import { CateringProduct } from '@/lib/types';
import { useCatering } from '@/context/CateringContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { getPricingTypeLabel, calculateProductOrder, formatCurrency } from '@/lib/pricing';

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

  // Featured card layout — vertical card inside the group container
  if (featured) {
    return (
      <div className="flex flex-col h-full group">
        {/* Image */}
        <div className="relative h-[180px] sm:h-[220px] overflow-hidden">
          <Image
            src={product.image}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
          {inCart && (
            <div className="absolute top-3 left-3 z-10">
              <Badge variant="success">In Cart{itemQty > 1 ? ` (${itemQty})` : ''}</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col">
          <h3 className="font-oswald text-lg sm:text-xl font-bold text-[#f7efd7] mb-2 tracking-wide">
            {product.title}
          </h3>
          <p className="text-white/70 text-xs sm:text-sm mb-3 flex-grow">
            {product.description}
          </p>

          {/* Dietary Badges */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {product.tags.includes('gluten-free') && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">GF</span>
              )}
              {product.tags.includes('dairy-free') && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">DF</span>
              )}
              {product.tags.includes('vegetarian') && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-semibold">Vegetarian</span>
              )}
            </div>
          )}

          {/* Pricing */}
          <div className="mb-4">
            <div className="text-xl sm:text-2xl font-oswald font-bold text-[#dabb64]">
              {formatCurrency(displayTotal)}
            </div>
            <div className="text-xs text-white/50 mt-1">
              {itemQty > 1 ? `${itemQty} × ` : ''}For {state.headcount} guests: <span className="text-white/70">{orderCalc.displayText}</span>
            </div>
          </div>

          {/* Button */}
          <div className="mt-auto">
            {inCart ? (
              <div className="flex items-center justify-between bg-white/10 rounded-lg border border-white/20">
                <button
                  onClick={() => handleUpdateQuantity(itemQty - 1)}
                  className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-l-lg transition-colors font-bold text-lg"
                  aria-label="Decrease quantity"
                >
                  {itemQty === 1 ? (
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  ) : '−'}
                </button>
                <span className="font-oswald font-bold text-white text-lg min-w-[2rem] text-center">
                  {itemQty}
                </span>
                <button
                  onClick={() => handleUpdateQuantity(Math.min(itemQty + 1, 4))}
                  disabled={itemQty >= 4}
                  className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-r-lg transition-colors font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                className="w-full font-oswald font-bold text-sm tracking-wide bg-[#dabb64] text-[#363333] py-2.5 rounded-lg hover:bg-[#f7efd7] transition-colors"
              >
                Add to Order
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Standard card layout
  return (
    <Card className="flex flex-col h-full hover-lift group relative overflow-hidden bg-[#f7efd7]">
      {/* Decorative gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-[#dabb64]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Product Image */}
        <div className="aspect-square bg-gray-200 rounded-lg mb-3 sm:mb-4 overflow-hidden relative">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.title}
              fill
              className="object-cover img-zoom"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-[#f7efd7] to-[#dabb64]/30">
              <svg
                className="w-12 h-12 sm:w-16 sm:h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* In Cart indicator */}
          {inCart && (
            <div className="absolute top-2 left-2">
              <Badge variant="success">
                In Cart{itemQty > 1 ? ` (${itemQty})` : ''}
              </Badge>
            </div>
          )}

          {/* Pricing type badge */}
          <div className="absolute top-2 right-2">
            <Badge variant="default" className="text-xs">
              {getPricingTypeLabel(product)}
            </Badge>
          </div>
        </div>

        {/* Product Info */}
        <h3 className="font-oswald font-semibold text-[#363333] mb-1 text-sm sm:text-base line-clamp-2 tracking-wide">
          {product.title}
        </h3>

        {/* Dietary Badges */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {product.tags.includes('vegan') && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">Vegan</span>
            )}
            {product.tags.includes('vegetarian') && !product.tags.includes('vegan') && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-semibold">Vegetarian</span>
            )}
            {product.tags.includes('gluten-free') && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">GF</span>
            )}
            {product.tags.includes('dairy-free') && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">DF</span>
            )}
            {product.tags.includes('halal') && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 font-semibold">Halal</span>
            )}
          </div>
        )}

        <p className="text-xs sm:text-sm text-gray-600 mb-3 flex-grow line-clamp-2">
          {product.description}
        </p>

        {/* Calculated Total Price */}
        <div className="mb-3">
          <div className="text-lg sm:text-xl font-oswald font-bold text-[#363333]">
            {formatCurrency(displayTotal)}
          </div>
          <div className="text-xs text-[#8B7355] mt-1">
            {itemQty > 1 ? `${itemQty} × ` : ''}{orderCalc.displayText}
          </div>
        </div>

        {/* Add/Remove Button or Quantity Stepper */}
        <div className="mt-auto">
          {inCart ? (
            <div className="space-y-2">
              {/* Quantity Stepper */}
              <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200">
                <button
                  onClick={() => handleUpdateQuantity(itemQty - 1)}
                  className="w-10 h-10 flex items-center justify-center text-[#363333] hover:bg-gray-100 rounded-l-lg transition-colors font-bold text-lg"
                  aria-label="Decrease quantity"
                >
                  {itemQty === 1 ? (
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  ) : '−'}
                </button>
                <span className="font-oswald font-bold text-[#363333] text-lg min-w-[2rem] text-center">
                  {itemQty}
                </span>
                <button
                  onClick={() => handleUpdateQuantity(Math.min(itemQty + 1, 4))}
                  disabled={itemQty >= 4}
                  className="w-10 h-10 flex items-center justify-center text-[#363333] hover:bg-gray-100 rounded-r-lg transition-colors font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          ) : (
            <Button onClick={handleAdd} className="w-full">
              Add to Order
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
