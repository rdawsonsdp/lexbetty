'use client';

import { useEffect, useRef } from 'react';
import { useCatering } from '@/context/CateringContext';
import { BUDGET_RANGES } from '@/lib/budgets';
import { useActivePackages } from '@/lib/hooks/useActivePackages';
import { formatCurrency } from '@/lib/pricing';
import { OrderType } from '@/lib/types';
import BudgetCard from './BudgetCard';

export default function EventInfoStep() {
  const { state, dispatch } = useCatering();
  const sectionRef = useRef<HTMLDivElement>(null);
  const quickHeadcounts = [10, 25, 50, 100, 150, 200];

  useEffect(() => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleHeadcountChange = (value: number) => {
    dispatch({ type: 'SET_HEADCOUNT', payload: Math.max(1, value) });
  };

  const handleSelectBudget = (budget: typeof BUDGET_RANGES[number]) => {
    dispatch({ type: 'SET_BUDGET_RANGE', payload: budget });
  };

  const handleSelectOrderType = (orderType: OrderType) => {
    dispatch({ type: 'SET_ORDER_TYPE', payload: orderType });
  };

  const handleSkip = () => {
    // Skip straight to build-your-own menu
    dispatch({ type: 'SET_ORDER_TYPE', payload: 'build-your-own' });
  };

  const handleBack = () => {
    dispatch({ type: 'GO_BACK' });
  };

  // Get package price range for preview
  const { packages: allPackages } = useActivePackages();
  const packages = state.eventType ? allPackages.filter(pkg => pkg.categories.includes(state.eventType!)) : [];
  const minPrice = packages.length > 0 ? Math.min(...packages.map(p => p.pricePerPerson)) : 0;
  const maxPrice = packages.length > 0 ? Math.max(...packages.map(p => p.pricePerPerson)) : 0;

  const orderOptions = [
    {
      id: 'build-your-own' as OrderType,
      icon: '\u{1F6E0}\u{FE0F}',
      title: 'BUILD YOUR OWN',
      description: 'Customize your menu with individual items',
      detail: 'Choose exactly what you want, item by item',
    },
    {
      id: 'packages' as OrderType,
      icon: '\u{1F4E6}',
      title: 'CHOOSE A PACKAGE',
      description: 'Pre-built menus ready to order',
      detail: packages.length > 0
        ? `Packages from ${formatCurrency(minPrice)}-${formatCurrency(maxPrice)}/person for ${state.headcount} guests`
        : 'Curated menu packages',
    },
  ];

  return (
    <div ref={sectionRef} className="bg-white py-12 sm:py-16 scroll-mt-4">
      <div className="container mx-auto px-4">
        {/* Headcount Section */}
        <div className="text-center mb-12">
          <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] tracking-wider mb-4">
            HOW MANY GUESTS?
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            The more we know, the better we serve. This helps us get your portions just right.
          </p>

          {/* Large Headcount Input */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => handleHeadcountChange(state.headcount - 5)}
              className="w-14 h-14 rounded-full bg-[#F5EDE0] hover:bg-[#E8621A] text-[#1A1A1A] font-bold text-2xl transition-colors flex items-center justify-center"
              aria-label="Decrease guests by 5"
            >
              -
            </button>
            <input
              type="number"
              value={state.headcount}
              onChange={(e) => handleHeadcountChange(parseInt(e.target.value) || 10)}
              className="w-28 h-14 text-center text-3xl font-oswald font-bold border-2 border-[#1A1A1A] rounded-lg focus:ring-2 focus:ring-[#E8621A]/50 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min="1"
            />
            <button
              onClick={() => handleHeadcountChange(state.headcount + 5)}
              className="w-14 h-14 rounded-full bg-[#F5EDE0] hover:bg-[#E8621A] text-[#1A1A1A] font-bold text-2xl transition-colors flex items-center justify-center"
              aria-label="Increase guests by 5"
            >
              +
            </button>
          </div>

          {/* Quick-select pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {quickHeadcounts.map((n) => {
              const isSelected = state.headcount === n;
              return (
                <button
                  key={n}
                  onClick={() => handleHeadcountChange(n)}
                  className={`px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 border-2 ${
                    isSelected
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] scale-[1.02] shadow-md'
                      : 'bg-[#F5EDE0] text-gray-600 border-transparent opacity-50 grayscale hover:opacity-100 hover:grayscale-0 hover:bg-[#E8621A]/30 hover:text-[#1A1A1A]'
                  }`}
                >
                  {n} guests
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget Section */}
        <div className="text-center mb-12">
          <h3 className="font-oswald text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-wider mb-3">
            WHAT&apos;S YOUR PER-PERSON BUDGET?
          </h3>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Totally optional — this just helps us highlight the best value for your group.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {BUDGET_RANGES.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                isSelected={state.budgetRange?.id === budget.id}
                hasSelection={!!state.budgetRange}
                onSelect={() => handleSelectBudget(budget)}
              />
            ))}
          </div>
        </div>

        {/* Order Type Section */}
        <div className="text-center mb-8">
          <h3 className="font-oswald text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-wider mb-3">
            HOW WOULD YOU LIKE TO ORDER?
          </h3>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            However you like to plan — we&apos;ve got you covered either way.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {orderOptions.map((option, index) => (
              <div
                key={option.id}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  onClick={() => handleSelectOrderType(option.id)}
                  className={`
                    bg-white border-2 rounded-xl p-8 sm:p-10 text-center cursor-pointer
                    transition-all duration-300 hover:scale-105 shadow-md
                    ${state.orderType === option.id
                      ? 'border-[#1A1A1A] bg-[#E8621A]/20'
                      : 'border-gray-200 hover:border-[#E8621A]'
                    }
                  `}
                >
                  <div className="text-6xl sm:text-7xl mb-4">{option.icon}</div>
                  <h3 className="font-oswald text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-3 tracking-wide">
                    {option.title}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base mb-2">
                    {option.description}
                  </p>
                  <p className="text-xs text-[#E8621A] font-semibold">
                    {option.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back */}
        <div className="mt-10 text-center">
          <button
            onClick={handleBack}
            className="font-oswald text-gray-500 hover:text-[#1A1A1A] transition-colors tracking-wide"
          >
            &larr; BACK TO EVENT TYPE
          </button>
        </div>
      </div>
    </div>
  );
}
