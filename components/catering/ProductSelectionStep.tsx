'use client';

import { useState, useEffect, useRef } from 'react';
import { useCatering } from '@/context/CateringContext';
import { getEventTypeName } from '@/lib/event-types';
import { formatCurrency } from '@/lib/pricing';
import { getBudgetStatus } from '@/lib/budgets';
import { useActiveProducts } from '@/lib/hooks/useActiveProducts';
import { MEAT_TAG, isMeatTagged } from '@/lib/meat-planner';
import CateringProductCard from './CateringProductCard';
import CateringCart from './CateringCart';
import MeatPlannerPopup from './MeatPlannerPopup';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface ProductSelectionStepProps {
  activeFilters?: string[];
  onToggleFilter?: (tag: string) => void;
  filterBar?: React.ReactNode;
  recommendedSection?: React.ReactNode;
}

export default function ProductSelectionStep({
  activeFilters = [],
  onToggleFilter,
  filterBar,
  recommendedSection,
}: ProductSelectionStepProps) {
  const { state, dispatch, perPersonCost, totalCost } = useCatering();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showMeatPlanner, setShowMeatPlanner] = useState(false);
  const [meatsPlanned, setMeatsPlanned] = useState(false);
  const hasAutoOpenedRef = useRef(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { getActiveByEventType } = useActiveProducts();

  useEffect(() => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Calculate delivery and total for mobile cart button
  const getDeliveryFee = (headcount: number): number => {
    if (headcount <= 25) return 75;
    if (headcount <= 50) return 125;
    return 200;
  };
  const deliveryFee = getDeliveryFee(state.headcount);
  const orderTotal = totalCost + (state.selectedItems.length > 0 ? deliveryFee : 0);

  // Budget status
  const budgetStatus = getBudgetStatus(perPersonCost, state.budgetRange, state.customBudget);
  const budgetColor = budgetStatus === 'on-track' ? 'text-green-600' : budgetStatus === 'under' ? 'text-yellow-600' : 'text-red-600';
  const budgetBg = budgetStatus === 'on-track' ? 'bg-green-50 border-green-200' : budgetStatus === 'under' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';

  // Close cart when pressing Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCartOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when cart is open on mobile
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  // Get products filtered by event type, excluding equipment
  const allProducts = getActiveByEventType(state.eventType).filter(
    p => !p.tags?.includes('equipment') && !p.tags?.includes('cutlery') && !p.tags?.includes('service')
  );

  // Check if this event type has meat products
  const hasMeatProducts = allProducts.some(p => p.tags?.includes(MEAT_TAG));

  // Auto-open meat planner on first mount (if meats available)
  useEffect(() => {
    if (hasAutoOpenedRef.current || !hasMeatProducts) return;
    hasAutoOpenedRef.current = true;
    const hasMeatsInCart = state.selectedItems.some(i => i.product.tags?.includes(MEAT_TAG));
    if (hasMeatsInCart) {
      setMeatsPlanned(true);
    } else {
      setShowMeatPlanner(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMeatProducts]);

  // Handle planner close
  const handlePlannerClose = (meatsAdded: boolean) => {
    setShowMeatPlanner(false);
    if (meatsAdded) setMeatsPlanned(true);
  };

  // When meats are managed via planner, filter them out of the grid
  const products = meatsPlanned
    ? allProducts.filter(p => !p.tags?.includes(MEAT_TAG))
    : allProducts;

  // Meat summary for the bar
  const meatItems = meatsPlanned
    ? state.selectedItems.filter(i => i.product.tags?.includes(MEAT_TAG))
    : [];
  const meatCount = meatItems.length;
  const meatTotal = meatItems.reduce((sum, item) => {
    const p = item.product.pricing;
    if (p.type === 'per-each') return sum + p.priceEach * item.quantity;
    if (p.type === 'per-lb') return sum + p.pricePerLb * item.quantity;
    if (p.type === 'per-container') return sum + p.pricePerContainer * item.quantity;
    if (p.type === 'pan') {
      const sizeOpt = p.sizes.find(s => s.size === item.selectedSize) || p.sizes[0];
      return sum + sizeOpt.price * item.quantity;
    }
    return sum;
  }, 0);

  // Filter products based on search term and dietary filters
  const filteredProducts = products.filter((product) => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        product.title.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.tags?.some(tag => tag.toLowerCase().includes(term));
      if (!matchesSearch) return false;
    }
    // Dietary filters (must match ALL active filters)
    if (activeFilters.length > 0) {
      const matchesFilters = activeFilters.every(f => product.tags?.includes(f));
      if (!matchesFilters) return false;
    }
    return true;
  });

  // Separate featured items from regular items
  const featuredProducts = filteredProducts.filter(p => p.featured);
  const regularProducts = filteredProducts.filter(p => !p.featured);

  // Sort regular products by pricing type to group similar items
  const sortedProducts = [...regularProducts].sort((a, b) => {
    const typeOrder: Record<string, number> = { 'tray': 0, 'pan': 1, 'per-person': 2, 'per-dozen': 3, 'per-each': 4, 'per-lb': 4, 'per-container': 5, 'flat': 6 };
    const typeA = typeOrder[a.pricing.type] ?? 99;
    const typeB = typeOrder[b.pricing.type] ?? 99;
    return typeA - typeB;
  });

  const handleContinueToExtras = () => {
    dispatch({ type: 'SET_STEP', payload: 6 });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 4 });
  };

  return (
    <div ref={sectionRef} className="bg-white py-12 sm:py-16 scroll-mt-4">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {state.eventType && (
              <Badge variant={state.eventType as 'breakfast' | 'lunch' | 'alacarte'}>
                {getEventTypeName(state.eventType)}
              </Badge>
            )}
          </div>
          <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] tracking-wider mb-4">
            BUILD YOUR {state.eventType?.toUpperCase() || 'EVENT'}
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto mb-6">
            Everything here is crowd-tested and loved. Sizes adjust automatically for your {state.headcount} guests.
          </p>
        </div>

        {/* Per-Person Cost Bar */}
        {state.selectedItems.length > 0 && (
          <div className={`sticky top-0 z-30 mb-6 p-4 rounded-xl border-2 ${budgetBg} flex flex-wrap items-center justify-between gap-4`}>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide block">Per Person</span>
                <span className="font-oswald text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
                  {formatCurrency(orderTotal / state.headcount)}
                </span>
              </div>
              <div className="h-10 w-px bg-gray-300 hidden sm:block" />
              <div className="hidden sm:block">
                <span className="text-xs text-gray-500 uppercase tracking-wide block">
                  {state.headcount} guests
                </span>
                <span className="font-oswald text-xl font-bold text-[#E8621A]">
                  {formatCurrency(orderTotal)} total
                </span>
              </div>
            </div>
            {state.budgetRange && (
              <div className={`text-sm font-semibold ${budgetColor}`}>
                {budgetStatus === 'on-track' && 'Within budget range'}
                {budgetStatus === 'under' && 'Below budget range'}
                {budgetStatus === 'over' && 'Over budget range'}
                <span className="text-xs text-gray-500 ml-1">({state.budgetRange.label})</span>
              </div>
            )}
          </div>
        )}

        {/* Meat Planner Summary / Open Button */}
        {hasMeatProducts && (
          meatsPlanned && meatCount > 0 ? (
            <div className="mb-6 p-4 bg-[#E8621A]/10 border-2 border-[#E8621A]/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#E8621A] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">{meatCount}</span>
                </div>
                <div>
                  <span className="font-oswald font-bold text-[#1A1A1A]">
                    {meatCount} meat{meatCount !== 1 ? 's' : ''} selected
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    {formatCurrency(meatTotal)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowMeatPlanner(true)}
                className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg font-oswald text-sm tracking-wide hover:bg-[#4a4646] transition-colors"
              >
                Edit Meats
              </button>
            </div>
          ) : !meatsPlanned ? (
            <div className="mb-4 text-center">
              <button
                onClick={() => setShowMeatPlanner(true)}
                className="inline-flex items-center gap-2 text-sm text-[#E8621A] hover:underline font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Open Meat Planner
              </button>
            </div>
          ) : null
        )}

        {/* Search */}
        <div className="max-w-md mx-auto mb-4">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#E8621A] focus:outline-none"
          />
        </div>

        {/* Dietary Filter Bar (injected from parent) */}
        {filterBar && <div className="mb-6">{filterBar}</div>}

        {/* Recommended section removed — featured items shown inline below */}


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Product Grid */}
          <div className="lg:col-span-2">
            {/* Featured Items Banner */}
            {featuredProducts.length > 0 && (
              <div className="mb-10">
                {/* Subtle header */}
                <div className="mb-5">
                  <p className="font-oswald text-xs tracking-[0.2em] text-[#9B9189] uppercase mb-1">
                    Chef&apos;s Recommendation
                  </p>
                  <h3 className="font-oswald text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-wide">
                    The BBQ Spread
                  </h3>
                </div>

                {/* Featured Products — compact grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {featuredProducts.map((product) => (
                    <CateringProductCard key={product.id} product={product} featured />
                  ))}
                </div>
              </div>
            )}

            {sortedProducts.length === 0 && featuredProducts.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-gray-500">
                  {searchTerm || activeFilters.length > 0
                    ? 'No products match your filters.'
                    : 'No products available for this event type.'}
                </p>
                {(searchTerm || activeFilters.length > 0) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      if (onToggleFilter) activeFilters.forEach(f => onToggleFilter(f));
                    }}
                    className="mt-3 text-[#E8621A] hover:underline text-sm"
                  >
                    Clear filters
                  </button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                {sortedProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-scale-in"
                    style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
                  >
                    <CateringProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl">
              <CateringCart onCheckout={handleContinueToExtras} />
            </div>
          </div>
        </div>

        {/* Mobile Cart Button - Fixed at bottom */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-white via-white to-transparent">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#1A1A1A] text-white rounded-xl py-4 px-6 flex items-center justify-between shadow-lg hover:bg-[#4a4646] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {state.selectedItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#E8621A] text-[#1A1A1A] text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {state.selectedItems.length}
                  </span>
                )}
              </div>
              <span className="font-oswald font-semibold">
                {state.selectedItems.length === 0 ? 'View Cart' : `${state.selectedItems.length} item${state.selectedItems.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            {state.selectedItems.length > 0 && (
              <span className="font-oswald font-bold text-[#E8621A]">
                {formatCurrency(orderTotal)}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Cart Drawer */}
        {isCartOpen && (
          <>
            {/* Overlay */}
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsCartOpen(false)}
            />
            {/* Drawer */}
            <div className="lg:hidden fixed inset-y-0 right-0 w-full max-w-md bg-[#F5EDE0] z-50 shadow-2xl animate-slide-in-right overflow-y-auto">
              {/* Drawer Header */}
              <div className="sticky top-0 bg-[#1A1A1A] text-white px-4 py-4 flex items-center justify-between z-10">
                <h2 className="font-oswald text-xl font-bold tracking-wide">Your Order</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close cart"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Cart Content */}
              <div className="p-4 pb-24">
                <CateringCart onCheckout={() => { setIsCartOpen(false); handleContinueToExtras(); }} />
              </div>
            </div>
          </>
        )}

        {/* Back button */}
        <div className="mt-10 text-center">
          <button
            onClick={handleBack}
            className="font-oswald text-gray-500 hover:text-[#1A1A1A] transition-colors tracking-wide"
          >
            ← BACK TO ORDER TYPE
          </button>
        </div>
      </div>

      {/* Meat Planner Popup */}
      {hasMeatProducts && (
        <MeatPlannerPopup
          isOpen={showMeatPlanner}
          onClose={handlePlannerClose}
          headcount={state.headcount}
        />
      )}
    </div>
  );
}
