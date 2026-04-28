'use client';

import { useState, useEffect, useRef } from 'react';
import { useCatering } from '@/context/CateringContext';
import { getEventTypeName } from '@/lib/event-types';
import { formatCurrency } from '@/lib/pricing';
import { getBudgetStatus } from '@/lib/budgets';
import { useActiveProducts } from '@/lib/hooks/useActiveProducts';
import { MEAT_TAG } from '@/lib/meat-planner';
import Image from 'next/image';
import CateringProductCard from './CateringProductCard';
import MenuItemRow from './MenuItemRow';
import CateringCart from './CateringCart';
import MeatPlannerPopup from './MeatPlannerPopup';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

// Menu section definitions — order matters for display
const MENU_SECTIONS = [
  { id: 'meats', label: 'Meats', tag: 'meats', image: '/images/meats-hero.webp' },
  { id: 'sliders', label: 'Sliders', tag: 'sliders', image: '/images/sliders-hero.webp' },
  { id: 'sides', label: 'Sides', tag: 'sides', image: '/images/sides-hero.webp' },
  { id: 'dessert', label: 'Desserts', tag: 'dessert', image: '' },
  { id: 'beverage', label: 'Drinks', tag: 'beverage', image: '' },
  { id: 'condiments', label: 'Extras', tag: 'condiments', image: '' },
];

export default function ProductSelectionStep() {
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

  // Show all products including meats (meat planner selections show in Meats section)
  const products = allProducts;

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

  // Filter products based on search term only
  const filteredProducts = products.filter((product) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        product.title.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }
    return true;
  });

  // Group products into sections by tag
  const groupedSections = MENU_SECTIONS.map(section => ({
    ...section,
    products: filteredProducts
      .filter(p => p.tags?.includes(section.tag))
      .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)),
  })).filter(section => section.products.length > 0);

  // Section refs for scroll-to navigation
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
            BUILD YOUR EVENT ORDER
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

        {/* Category Section Nav */}
        {groupedSections.length > 1 && (
          <div className="flex overflow-x-auto gap-2 pb-1 mb-6 scrollbar-hide">
            {groupedSections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-[#E8621A] hover:text-[#1A1A1A]'
                  }`}
                >
                  {section.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Menu Sections */}
          <div className="lg:col-span-2">
            {groupedSections.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-gray-500">
                  {searchTerm
                    ? 'No products match your search.'
                    : 'No products available for this event type.'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-3 text-[#E8621A] hover:underline text-sm"
                  >
                    Clear search
                  </button>
                )}
              </Card>
            ) : (
              groupedSections.map((section) => (
                <div
                  key={section.id}
                  ref={(el) => { sectionRefs.current[section.id] = el; }}
                  className="mb-12 scroll-mt-24"
                >
                  {/* Section Header */}
                  <div className="mb-5">
                    <h3 className="font-oswald text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-wide uppercase">
                      {section.label}
                    </h3>
                    <div className="w-12 h-1 bg-[#E8621A] mt-2" />
                  </div>

                  {/* 2-column: hero image left, menu items right */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Hero image */}
                    {section.image && (
                      <div className="relative aspect-[16/9] md:aspect-[3/4] rounded-xl overflow-hidden">
                        <Image
                          src={section.image}
                          alt={section.label}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Right: Menu item rows */}
                    <div className={section.image ? '' : 'md:col-span-2'}>
                      {section.products.map((product) => (
                        <MenuItemRow key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain rounded-xl scrollbar-thin">
              <CateringCart onCheckout={handleContinueToExtras} />
            </div>
          </div>
        </div>

        {/* Mobile Cart Bar - Fixed at bottom */}
        {state.selectedItems.length > 0 && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1A1A1A] px-6 py-3">
            <div className="flex items-center justify-between">
              <span className="font-oswald font-semibold text-white text-sm">
                {state.selectedItems.length} item{state.selectedItems.length !== 1 ? 's' : ''}
              </span>
              <span className="font-oswald font-bold text-[#E8621A] text-lg">
                {formatCurrency(orderTotal)}
              </span>
            </div>
          </div>
        )}

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
