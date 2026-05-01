'use client';

import { useState } from 'react';
import { useCatering } from '@/context/CateringContext';
import { useActivePackages } from '@/lib/hooks/useActivePackages';
import { formatCurrency } from '@/lib/pricing';
import { CateringPackage } from '@/lib/types';

export default function LunchSpecialsCallout() {
  const { state, dispatch } = useCatering();
  const { packages } = useActivePackages();
  const [headcounts, setHeadcounts] = useState<Record<string, number>>({});

  const partyDeals = packages.filter((p) => p.id.startsWith('betty-party-deal-'));
  if (partyDeals.length === 0) return null;

  const getHeadcount = (pkg: CateringPackage) =>
    headcounts[pkg.id] || pkg.minHeadcount || 10;

  const setHeadcount = (pkg: CateringPackage, value: number) => {
    const min = pkg.minHeadcount || 10;
    setHeadcounts((prev) => ({ ...prev, [pkg.id]: Math.max(min, value) }));
  };

  const isInCart = (id: string) =>
    state.selectedItems.some((i) => i.product.id === id);

  const handleAdd = (pkg: CateringPackage) => {
    const headcount = getHeadcount(pkg);
    const total = headcount * pkg.pricePerPerson;
    const product = {
      id: pkg.id,
      title: pkg.title,
      description: `${headcount} guests x ${formatCurrency(pkg.pricePerPerson)}/person\n${pkg.items.join('\n')}`,
      image: pkg.image || '',
      categories: pkg.categories,
      pricing: { type: 'flat' as const, flatPrice: total },
      tags: ['package'],
      featured: false,
      isActive: true,
      sortPosition: 0,
    };
    if (isInCart(pkg.id)) dispatch({ type: 'REMOVE_ITEM', payload: pkg.id });
    dispatch({ type: 'ADD_ITEM', payload: product });
    dispatch({ type: 'SET_HEADCOUNT', payload: headcount });
  };

  return (
    <div className="my-12 relative">
      <span className="absolute -top-3 left-6 z-10 bg-[#E8621A] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
        Featured
      </span>
      <div className="bg-gradient-to-br from-[#1A1A1A] via-[#262120] to-[#1A1A1A] rounded-2xl p-5 sm:p-7 border-2 border-[#E8621A]/30 shadow-lg">
        <div className="text-center mb-5">
          <h3 className="font-oswald text-2xl sm:text-3xl font-bold text-white tracking-wider">
            LUNCH SPECIALS
          </h3>
          <div className="w-12 h-1 bg-[#E8621A] mx-auto mt-2 mb-3" />
          <p className="text-white/70 text-sm max-w-xl mx-auto">
            All-in-one party spreads — perfect for office lunches and team events.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {partyDeals.map((pkg) => {
            const headcount = getHeadcount(pkg);
            const total = headcount * pkg.pricePerPerson;
            const inCart = isInCart(pkg.id);
            return (
              <div
                key={pkg.id}
                className={`bg-white rounded-xl p-4 sm:p-5 transition-all ${
                  inCart ? 'ring-2 ring-[#E8621A]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-oswald font-bold text-[#1A1A1A] text-base sm:text-lg leading-tight">
                    {pkg.title.replace('Betty Party Deal — ', '')}
                  </h4>
                  <span className="font-oswald font-bold text-[#E8621A] text-xl sm:text-2xl whitespace-nowrap">
                    {formatCurrency(pkg.pricePerPerson)}
                    <span className="text-xs text-gray-500 font-normal">/pp</span>
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{pkg.description}</p>

                <div className="flex items-center gap-2 mb-3">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex-shrink-0">
                    Guests
                  </label>
                  <button
                    onClick={() => setHeadcount(pkg, headcount - 5)}
                    className="w-7 h-7 rounded-full bg-[#F5EDE0] hover:bg-[#E8621A] hover:text-white text-[#1A1A1A] font-bold text-sm transition-colors flex items-center justify-center"
                    aria-label="Decrease guests"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={headcount}
                    onChange={(e) =>
                      setHeadcount(pkg, parseInt(e.target.value) || pkg.minHeadcount || 10)
                    }
                    min={pkg.minHeadcount || 10}
                    className="w-14 h-8 text-center text-sm font-bold border border-gray-300 rounded-md focus:ring-1 focus:ring-[#E8621A] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => setHeadcount(pkg, headcount + 5)}
                    className="w-7 h-7 rounded-full bg-[#F5EDE0] hover:bg-[#E8621A] hover:text-white text-[#1A1A1A] font-bold text-sm transition-colors flex items-center justify-center"
                    aria-label="Increase guests"
                  >
                    +
                  </button>
                  <span className="ml-auto font-oswald font-bold text-[#1A1A1A] text-sm">
                    = {formatCurrency(total)}
                  </span>
                </div>

                <button
                  onClick={() => handleAdd(pkg)}
                  className={`w-full py-2 rounded-lg font-oswald font-bold tracking-wide text-sm transition-colors ${
                    inCart
                      ? 'bg-[#1A1A1A] text-white hover:bg-[#4a4646]'
                      : 'bg-[#E8621A] text-white hover:bg-[#c8531a]'
                  }`}
                >
                  {inCart ? 'Update Cart' : 'Add to Order'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
