'use client';

import { useEffect, useRef } from 'react';
import { useCatering } from '@/context/CateringContext';
import { OrderType } from '@/lib/types';
import { useActivePackages } from '@/lib/hooks/useActivePackages';
import { formatCurrency } from '@/lib/pricing';

export default function OrderTypeStep() {
  const { state, dispatch } = useCatering();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleSelect = (orderType: OrderType) => {
    dispatch({ type: 'SET_ORDER_TYPE', payload: orderType });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 3 });
  };

  // Get package price range for preview
  const { packages: allPackages } = useActivePackages();
  const packages = state.eventType ? allPackages.filter(pkg => pkg.categories.includes(state.eventType!)) : [];
  const minPrice = packages.length > 0 ? Math.min(...packages.map(p => p.pricePerPerson)) : 0;
  const maxPrice = packages.length > 0 ? Math.max(...packages.map(p => p.pricePerPerson)) : 0;

  const options = [
    {
      id: 'build-your-own' as OrderType,
      icon: '🛠️',
      title: 'BUILD YOUR OWN',
      description: 'Customize your menu with individual items',
      detail: 'Choose exactly what you want, item by item',
    },
    {
      id: 'packages' as OrderType,
      icon: '📦',
      title: 'CHOOSE A PACKAGE',
      description: 'Pre-built menus ready to order',
      detail: packages.length > 0
        ? `Packages from ${formatCurrency(minPrice)}-${formatCurrency(maxPrice)}/person for ${state.headcount} guests`
        : 'Curated menu packages',
    },
  ];

  return (
    <div ref={sectionRef} className="bg-[#FAFAFA] py-12 sm:py-16 scroll-mt-4">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-[#383838] tracking-wider mb-4">
            HOW WOULD YOU LIKE TO ORDER?
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            However you like to plan — we&apos;ve got you covered either way.
          </p>
        </div>

        {/* Order Type Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {options.map((option, index) => (
            <div
              key={option.id}
              className="animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                onClick={() => handleSelect(option.id)}
                className={`
                  bg-white border-2 rounded-xl p-8 sm:p-10 text-center cursor-pointer
                  transition-all duration-300 hover:scale-105 shadow-md
                  ${state.orderType === option.id
                    ? 'border-[#383838] bg-[#E8621A]/20'
                    : 'border-gray-200 hover:border-[#E8621A]'
                  }
                `}
              >
                <div className="text-6xl sm:text-7xl mb-4">{option.icon}</div>
                <h3 className="font-oswald text-2xl sm:text-3xl font-bold text-[#383838] mb-3 tracking-wide">
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

        {/* Back button */}
        <div className="mt-10 text-center">
          <button
            onClick={handleBack}
            className="font-oswald text-gray-500 hover:text-[#383838] transition-colors tracking-wide"
          >
            ← BACK TO GUESTS & BUDGET
          </button>
        </div>
      </div>
    </div>
  );
}
