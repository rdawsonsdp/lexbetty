'use client';

import { useRouter } from 'next/navigation';
import { useCatering } from '@/context/CateringContext';
import { formatCurrency } from '@/lib/pricing';

function getItemPrice(item: { product: any; quantity: number; selectedSize?: string }): number {
  const p = item.product.pricing;
  if (!p) return 0;
  switch (p.type) {
    case 'flat': return p.flatPrice;
    case 'per-person': return (p.pricePerPerson || p.basePrice || 0) * item.quantity;
    case 'per-each': return (p.priceEach || 0) * item.quantity;
    case 'per-lb': return (p.pricePerLb || 0) * item.quantity;
    case 'per-dozen': return (p.pricePerDozen || 0) * item.quantity;
    case 'per-container': return (p.pricePerContainer || 0) * item.quantity;
    case 'pan': {
      const size = item.selectedSize || 'full';
      const panSize = p.sizes?.find((s: any) => s.size === size) || p.sizes?.[p.sizes.length - 1];
      return (panSize?.price || 0) * item.quantity;
    }
    case 'tray': {
      const size = item.selectedSize || 'large';
      const traySize = p.sizes?.find((s: any) => s.size === size) || p.sizes?.[p.sizes.length - 1];
      return (traySize?.price || 0) * item.quantity;
    }
    default: return 0;
  }
}

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const router = useRouter();
  const { state, dispatch, totalCost, calculatedItems } = useCatering();
  const itemCount = state.selectedItems.length;
  const cartCount = state.selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const perPerson = state.headcount > 0 ? totalCost / state.headcount : 0;

  const handleCheckout = () => {
    router.push('/checkout');
    setTimeout(() => onClose(), 100);
  };

  const handleRemove = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { productId, quantity } });
  };

  const isPackage = (item: any) => item.product.tags?.includes('package');

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-out Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#F5EDE0] z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="font-oswald text-2xl font-bold text-[#1A1A1A] tracking-wide">
            Order Summary
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close cart"
          >
            <svg className="w-6 h-6 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {state.selectedItems.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[#1A1A1A]/10 flex items-center justify-center">
                <svg className="w-10 h-10 text-[#1A1A1A]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="font-oswald text-lg text-[#1A1A1A] tracking-wide mb-1">Your cart is empty</p>
              <p className="text-sm text-[#9B9189]">Add some delicious BBQ to get started</p>
            </div>
          ) : (
            <div className="bg-white mx-4 mt-4 rounded-xl shadow-sm">
              {/* Items — shown first */}
              <div className="px-5 py-4 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Your Catering Order</p>
                <div className="space-y-5">
                  {state.selectedItems.map((item) => {
                    const descLines = item.product.description?.split('\n') || [];
                    const calc = calculatedItems.find(c => c.product.id === item.product.id);
                    const itemPrice = calc?.totalPrice || getItemPrice(item);

                    return (
                      <div key={item.product.id}>
                        <div className="flex justify-between gap-3">
                          <h4 className="font-oswald font-bold text-[#1A1A1A] text-base">
                            {item.product.title}
                          </h4>
                          <span className="font-oswald font-bold text-[#1A1A1A] text-base flex-shrink-0">
                            {formatCurrency(itemPrice)}
                          </span>
                        </div>
                        {calc?.displayText && (
                          <p className="text-xs text-[#E8621A] mt-0.5">{calc.displayText}</p>
                        )}
                        {!calc?.displayText && descLines.length > 0 && (
                          <div className="mt-1">
                            {descLines.map((line: string, i: number) => (
                              <p key={i} className={`text-sm ${i === 0 ? 'text-[#E8621A]' : 'text-gray-500'}`}>
                                {line}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Quantity + Remove */}
                        <div className="flex items-center justify-between mt-2">
                          {!isPackage(item) ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                                className="w-8 h-8 rounded-lg bg-[#F5EDE0] hover:bg-[#E8621A] hover:text-white text-[#1A1A1A] font-bold transition-colors flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="font-oswald font-bold text-base w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                                className="w-8 h-8 rounded-lg bg-[#F5EDE0] hover:bg-[#E8621A] hover:text-white text-[#1A1A1A] font-bold transition-colors flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <div />
                          )}
                          <button
                            onClick={() => handleRemove(item.product.id)}
                            className="text-sm text-red-500 hover:text-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary Numbers */}
              <div className="px-5 py-4 space-y-3 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                  <span className="font-medium text-[#1A1A1A]">{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Guests</span>
                  <span className="font-medium text-[#1A1A1A]">{state.headcount}</span>
                </div>
              </div>

              {/* Total */}
              <div className="px-5 py-4 border-b border-gray-200">
                <div className="flex justify-between font-oswald font-bold text-lg">
                  <span className="text-[#1A1A1A]">Total</span>
                  <span className="text-[#E8621A]">{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Per Person</span>
                  <span>{formatCurrency(perPerson)}</span>
                </div>
              </div>

              {/* Trust Signals */}
              <div className="px-5 py-4 border-t border-gray-200 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  On-time delivery guaranteed
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Full setup included
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Satisfaction guaranteed
                </div>
              </div>

              {/* Need Help */}
              <div className="px-5 py-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Need Help?</p>
                <a href="tel:3126008155" className="text-sm text-[#E8621A] hover:text-[#1A1A1A] transition-colors font-semibold">
                  (312) 600-8155
                </a>
                <p className="text-xs text-gray-400 mt-0.5">Call, email, or text us anytime</p>
              </div>

              {/* Add More CTA */}
              <button
                onClick={() => { router.push('/products'); setTimeout(() => onClose(), 100); }}
                className="w-full bg-[#1A1A1A] text-white font-oswald font-bold tracking-wider py-3 text-center hover:opacity-90 transition-opacity rounded-b-xl flex items-center justify-center gap-2"
              >
                STILL HUNGRY? ADD MORE
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Footer — Checkout Button */}
        {state.selectedItems.length > 0 && (
          <div className="bg-white border-t border-gray-200 px-5 py-4 flex-shrink-0">
            <button
              onClick={handleCheckout}
              className="w-full bg-[#E8621A] text-white font-oswald font-bold text-lg tracking-wider py-4 rounded-xl hover:opacity-90 transition-opacity"
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        )}
      </div>
    </>
  );
}
