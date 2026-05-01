'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCatering } from '@/context/CateringContext';
import { BUDGET_RANGES } from '@/lib/budgets';
import { OrderType } from '@/lib/types';
import BudgetCard from './BudgetCard';

export default function EventInfoStep() {
  const router = useRouter();
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
    dispatch({ type: 'SET_ORDER_TYPE', payload: 'build-your-own' });
    router.push('/products');
  };

  const handleSelectOrderType = (orderType: OrderType) => {
    dispatch({ type: 'SET_ORDER_TYPE', payload: orderType });
  };

  const handleStartOver = () => {
    dispatch({ type: 'RESET' });
  };

  // Auto-set order type to build-your-own for the event planner flow
  useEffect(() => {
    if (state.currentStep >= 2 && !state.orderType) {
      handleSelectOrderType('build-your-own');
    }
  }, [state.currentStep]);

  return (
    <div ref={sectionRef} className="bg-white py-6 sm:py-12 scroll-mt-4">
      <div className="container mx-auto px-4">
        {/* Corporate intro */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <h1 className="font-oswald text-2xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] tracking-wider mb-3 sm:mb-4">
            PLAN YOUR NEXT CORPORATE EVENT
          </h1>
          <p className="text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed mb-5">
            Let us cater your next boardroom lunch, client meeting, conference, or all-hands.
            Tell us your guest count and budget — our team will work with your organization to
            curate a <span className="font-semibold text-[#1A1A1A]">chef-crafted menu</span> that&apos;s on-brand,
            on-budget, and on-time.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5EDE0] rounded-full text-xs sm:text-sm font-semibold text-[#1A1A1A]">
              <span className="text-[#E8621A]">●</span> Tailored to your team
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5EDE0] rounded-full text-xs sm:text-sm font-semibold text-[#1A1A1A]">
              <span className="text-[#E8621A]">●</span> Concierge planning
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5EDE0] rounded-full text-xs sm:text-sm font-semibold text-[#1A1A1A]">
              <span className="text-[#E8621A]">●</span> Delivered &amp; ready to serve
            </span>
          </div>
        </div>

        {/* Headcount — compact on mobile */}
        <div className="text-center mb-6 sm:mb-12">
          <h2 className="font-oswald text-xl sm:text-3xl md:text-4xl font-bold text-[#1A1A1A] tracking-wider mb-1 sm:mb-3">
            HOW MANY GUESTS?
          </h2>
          <p className="text-gray-600 text-xs sm:text-base max-w-2xl mx-auto mb-4 sm:mb-6">
            This helps us get your portions just right.
          </p>

          {/* Headcount Input */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={() => handleHeadcountChange(state.headcount - 5)}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-[#F5EDE0] hover:bg-[#E8621A] text-[#1A1A1A] font-bold text-xl sm:text-2xl transition-colors flex items-center justify-center"
              aria-label="Decrease guests by 5"
            >
              -
            </button>
            <input
              type="number"
              value={state.headcount}
              onChange={(e) => handleHeadcountChange(parseInt(e.target.value) || 10)}
              className="w-20 h-10 sm:w-28 sm:h-14 text-center text-2xl sm:text-3xl font-oswald font-bold border-2 border-[#1A1A1A] rounded-lg focus:ring-2 focus:ring-[#E8621A]/50 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min="1"
            />
            <button
              onClick={() => handleHeadcountChange(state.headcount + 5)}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-[#F5EDE0] hover:bg-[#E8621A] text-[#1A1A1A] font-bold text-xl sm:text-2xl transition-colors flex items-center justify-center"
              aria-label="Increase guests by 5"
            >
              +
            </button>
          </div>

          {/* Quick-select pills — inline scroll on mobile */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {quickHeadcounts.map((n) => {
              const isSelected = state.headcount === n;
              return (
                <button
                  key={n}
                  onClick={() => handleHeadcountChange(n)}
                  className={`px-3 py-1.5 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all border-2 ${
                    isSelected
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                      : 'bg-[#F5EDE0] text-gray-600 border-transparent hover:bg-[#E8621A]/20'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget Section — compact on mobile */}
        <div className="text-center mb-6 sm:mb-12">
          <h3 className="font-oswald text-lg sm:text-2xl font-bold text-[#1A1A1A] tracking-wider mb-1 sm:mb-3">
            PER-PERSON BUDGET?
          </h3>
          <p className="text-gray-600 text-xs sm:text-base max-w-2xl mx-auto mb-4 sm:mb-6">
            Optional — helps us highlight the best value.
          </p>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto">
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

          <button
            onClick={() => {
              dispatch({ type: 'SET_ORDER_TYPE', payload: 'build-your-own' });
              router.push('/products');
            }}
            className="mt-5 inline-flex items-center gap-2 bg-[#E8621A] text-white font-oswald font-bold tracking-wider px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm sm:text-base"
          >
            SEE MENU RECOMMENDATIONS
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>

        {/* Back */}
        <div className="mt-6 sm:mt-10 text-center">
          <button
            onClick={handleStartOver}
            className="font-oswald text-sm text-gray-500 hover:text-red-500 transition-colors tracking-wide"
          >
            START OVER
          </button>
        </div>
      </div>
    </div>
  );
}
