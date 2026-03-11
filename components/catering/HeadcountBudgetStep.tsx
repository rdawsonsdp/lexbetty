'use client';

import { useEffect, useRef } from 'react';
import { useCatering } from '@/context/CateringContext';
import { BUDGET_RANGES } from '@/lib/budgets';
import BudgetCard from './BudgetCard';

export default function HeadcountBudgetStep() {
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

  const handleContinue = () => {
    dispatch({ type: 'SET_STEP', payload: 3 });
  };

  const handleSkipBudget = () => {
    dispatch({ type: 'SET_STEP', payload: 3 });
  };

  const handleBack = () => {
    dispatch({ type: 'GO_BACK' });
  };

  return (
    <div ref={sectionRef} className="bg-white py-12 sm:py-16 scroll-mt-4">
      <div className="container mx-auto px-4">
        {/* Headcount Section */}
        <div className="text-center mb-12">
          <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-[#383838] tracking-wider mb-4">
            HOW MANY GUESTS?
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            The more we know, the better we serve. This helps us get your portions just right.
          </p>

          {/* Large Headcount Input */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => handleHeadcountChange(state.headcount - 5)}
              className="w-14 h-14 rounded-full bg-[#FAFAFA] hover:bg-[#E8621A] text-[#383838] font-bold text-2xl transition-colors flex items-center justify-center"
              aria-label="Decrease guests by 5"
            >
              -
            </button>
            <input
              type="number"
              value={state.headcount}
              onChange={(e) => handleHeadcountChange(parseInt(e.target.value) || 10)}
              className="w-28 h-14 text-center text-3xl font-oswald font-bold border-2 border-[#383838] rounded-lg focus:ring-2 focus:ring-[#E8621A]/50 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min="1"
            />
            <button
              onClick={() => handleHeadcountChange(state.headcount + 5)}
              className="w-14 h-14 rounded-full bg-[#FAFAFA] hover:bg-[#E8621A] text-[#383838] font-bold text-2xl transition-colors flex items-center justify-center"
              aria-label="Increase guests by 5"
            >
              +
            </button>
          </div>

          {/* Quick-select pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {quickHeadcounts.map((n) => {
              const isSelected = state.headcount === n;
              const isUnselected = !isSelected;

              return (
                <button
                  key={n}
                  onClick={() => handleHeadcountChange(n)}
                  className={`px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 border-2 ${
                    isSelected
                      ? 'bg-[#383838] text-white border-[#383838] scale-[1.02] shadow-md'
                      : isUnselected
                        ? 'bg-[#FAFAFA] text-gray-600 border-transparent opacity-50 grayscale hover:opacity-100 hover:grayscale-0 hover:bg-[#E8621A]/30 hover:text-[#383838]'
                        : 'bg-[#FAFAFA] text-gray-600 border-transparent hover:bg-[#E8621A]/30 hover:text-[#383838]'
                  }`}
                >
                  {n} guests
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget Section */}
        <div className="text-center mb-8">
          <h3 className="font-oswald text-2xl sm:text-3xl font-bold text-[#383838] tracking-wider mb-3">
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

        {/* Actions */}
        <div className="flex flex-col items-center gap-4 mt-10">
          <button
            onClick={handleContinue}
            className="bg-[#383838] text-white font-oswald font-bold px-10 py-4 rounded-lg hover:bg-gray-800 transition-colors text-lg tracking-wide shadow-md"
          >
            CONTINUE
          </button>
          <button
            onClick={handleSkipBudget}
            className="text-gray-500 hover:text-[#383838] text-sm transition-colors"
          >
            Skip budget selection
          </button>
          <button
            onClick={handleBack}
            className="font-oswald text-gray-500 hover:text-[#383838] transition-colors tracking-wide mt-2"
          >
            ← BACK TO EVENT TYPE
          </button>
        </div>
      </div>
    </div>
  );
}
