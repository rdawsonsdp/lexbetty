'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCatering } from '@/context/CateringContext';
import ProductImagePlaceholder from '@/components/ui/ProductImagePlaceholder';
import { getPackagesByBudget } from '@/lib/packages';
import { useActivePackages } from '@/lib/hooks/useActivePackages';
import { formatCurrency } from '@/lib/pricing';
import { CateringPackage } from '@/lib/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function PackageSelectionStep() {
  const router = useRouter();
  const { state, dispatch } = useCatering();
  const { packages: allFetchedPackages } = useActivePackages();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const allPackages = state.eventType
    ? allFetchedPackages.filter(pkg => pkg.categories.includes(state.eventType!))
    : [];

  const withinBudget = state.budgetRange
    ? getPackagesByBudget(allPackages, state.budgetRange.min, state.budgetRange.max)
    : [];

  const isWithinBudget = (pkg: CateringPackage) => {
    if (!state.budgetRange) return false;
    return pkg.pricePerPerson >= state.budgetRange.min && pkg.pricePerPerson <= state.budgetRange.max;
  };

  const handleSelectPackage = (pkg: CateringPackage) => {
    dispatch({ type: 'SELECT_PACKAGE', payload: pkg });
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 4 });
  };

  const meetsMinHeadcount = (pkg: CateringPackage) => {
    return !pkg.minHeadcount || state.headcount >= pkg.minHeadcount;
  };

  return (
    <div ref={sectionRef} className="bg-white py-12 sm:py-16 scroll-mt-4">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-[#383838] tracking-wider mb-4">
            CHOOSE A PACKAGE
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Pre-built menus designed for {state.headcount} guests
            {state.budgetRange && (
              <span className="text-[#E8621A] font-semibold"> within your {state.budgetRange.label}/person budget</span>
            )}
          </p>
        </div>

        {allPackages.length === 0 ? (
          <Card className="text-center py-12 max-w-md mx-auto">
            <p className="text-gray-500">No packages available for this event type.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {allPackages.map((pkg, index) => {
              const isSelected = state.selectedPackage?.id === pkg.id;
              const inBudget = isWithinBudget(pkg);
              const meetsMin = meetsMinHeadcount(pkg);

              return (
                <div
                  key={pkg.id}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Card
                    className={`relative flex flex-col h-full transition-all duration-300 ${
                      isSelected
                        ? 'ring-4 ring-[#E8621A] bg-[#E8621A]/10'
                        : inBudget && state.budgetRange
                        ? 'ring-2 ring-green-400/50'
                        : ''
                    } ${!meetsMin ? 'opacity-60' : 'hover:scale-[1.02]'}`}
                    hover={meetsMin}
                  >
                    {/* Budget match badge */}
                    {state.budgetRange && inBudget && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                        Within Budget
                      </div>
                    )}

                    {/* Package Image */}
                    <div className="relative h-40 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 mb-4 rounded-t-xl overflow-hidden">
                      <ProductImagePlaceholder title={pkg.title} />
                    </div>

                    {/* Title & Price */}
                    <h3 className="font-oswald text-xl sm:text-2xl font-bold text-[#383838] mb-1 tracking-wide">
                      {pkg.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>

                    {/* Price */}
                    <div className="mb-4 p-3 bg-[#FAFAFA] rounded-lg">
                      <div className="flex items-baseline gap-1">
                        <span className="font-oswald text-3xl font-bold text-[#383838]">
                          {formatCurrency(pkg.pricePerPerson)}
                        </span>
                        <span className="text-sm text-gray-500">/person</span>
                      </div>
                      <p className="text-sm text-[#383838] font-semibold mt-1">
                        {state.headcount} guests = {formatCurrency(pkg.pricePerPerson * state.headcount)} total
                      </p>
                    </div>

                    {/* Items List */}
                    <div className="flex-grow mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Includes:</p>
                      <ul className="space-y-1.5">
                        {pkg.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Min headcount notice */}
                    {!meetsMin && (
                      <p className="text-xs text-red-500 mb-3">
                        Minimum {pkg.minHeadcount} guests required (you have {state.headcount})
                      </p>
                    )}

                    {/* Select Button */}
                    <Button
                      onClick={() => handleSelectPackage(pkg)}
                      variant={isSelected ? 'secondary' : 'primary'}
                      disabled={!meetsMin}
                      className="w-full"
                    >
                      {isSelected ? 'Selected' : 'Select Package'}
                    </Button>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {/* Checkout Button */}
        {state.selectedPackage && (
          <div className="mt-10 text-center animate-scale-in">
            <div className="inline-block bg-[#FAFAFA] rounded-xl p-6 border-2 border-[#E8621A]">
              <p className="text-sm text-gray-600 mb-2">Selected: <strong>{state.selectedPackage.title}</strong></p>
              <p className="font-oswald text-2xl font-bold text-[#383838] mb-4">
                {formatCurrency(state.selectedPackage.pricePerPerson * state.headcount)} for {state.headcount} guests
              </p>
              <Button onClick={handleCheckout} className="px-10">
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}

        {/* Back button */}
        <div className="mt-10 text-center">
          <button
            onClick={handleBack}
            className="font-oswald text-gray-500 hover:text-[#383838] transition-colors tracking-wide"
          >
            ← BACK TO ORDER TYPE
          </button>
        </div>
      </div>
    </div>
  );
}
