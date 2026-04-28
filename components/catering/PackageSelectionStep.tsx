'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCatering } from '@/context/CateringContext';
import ProductImagePlaceholder from '@/components/ui/ProductImagePlaceholder';
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
  const [headcounts, setHeadcounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const timer = setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Show all packages except food truck (it has its own page)
  const allPackages = allFetchedPackages.filter(pkg => pkg.id !== 'betty-food-truck');

  const getHeadcount = (pkgId: string, minHeadcount?: number) =>
    headcounts[pkgId] || minHeadcount || 10;

  const setHeadcount = (pkgId: string, value: number, minHeadcount?: number) => {
    const min = minHeadcount || 10;
    setHeadcounts(prev => ({ ...prev, [pkgId]: Math.max(min, value) }));
  };

  const isInCart = (pkgId: string) =>
    state.selectedItems.some(item => item.product.id === pkgId);

  const handleAddToCart = (pkg: CateringPackage) => {
    const headcount = getHeadcount(pkg.id, pkg.minHeadcount);
    const total = headcount * pkg.pricePerPerson;

    const productFromPackage = {
      id: pkg.id,
      title: pkg.title,
      description: `${headcount} guests x ${formatCurrency(pkg.pricePerPerson)}/person\n${pkg.items.join('\n')}`,
      image: pkg.image || '',
      categories: pkg.categories,
      pricing: {
        type: 'flat' as const,
        flatPrice: total,
      },
      tags: ['package'],
      featured: false,
      isActive: true,
      sortPosition: 0,
    };

    // Remove existing if updating
    if (isInCart(pkg.id)) {
      dispatch({ type: 'REMOVE_ITEM', payload: pkg.id });
    }

    dispatch({ type: 'ADD_ITEM', payload: productFromPackage });
    dispatch({ type: 'SET_HEADCOUNT', payload: headcount });
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  return (
    <div ref={sectionRef} className="bg-white py-12 sm:py-16 scroll-mt-4">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] tracking-wider mb-4">
            OUR MENU PACKAGES
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Pre-built menus designed for your event. Select your guest count and add to cart.
          </p>

          <p className="font-oswald text-sm text-[#9B9189] tracking-wider uppercase mb-4">Jump to a package</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto text-left">
            {allPackages.map((pkg) => (
              <a
                key={pkg.id}
                href={`#${pkg.id}`}
                className="group flex items-start gap-4 p-4 bg-[#1A1A1A] rounded-xl hover:bg-[#E8621A] transition-colors"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="font-oswald font-bold text-[#E8621A] group-hover:text-white text-lg">
                    {formatCurrency(pkg.pricePerPerson)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-oswald font-bold text-white text-base tracking-wide mb-0.5">
                    {pkg.title}
                  </h4>
                  <p className="text-xs text-white/60 leading-relaxed line-clamp-2">
                    {pkg.description}
                  </p>
                  <p className="text-xs text-[#E8621A] group-hover:text-white/80 font-bold mt-1">
                    per person — min {pkg.minHeadcount || 10} guests
                  </p>
                </div>
                <svg className="w-5 h-5 text-white/40 group-hover:text-white flex-shrink-0 mt-1 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {allPackages.length === 0 ? (
          <Card className="text-center py-12 max-w-md mx-auto">
            <p className="text-gray-500">No packages available.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {allPackages.map((pkg, index) => {
              const inCart = isInCart(pkg.id);
              const headcount = getHeadcount(pkg.id, pkg.minHeadcount);
              const total = headcount * pkg.pricePerPerson;

              return (
                <div
                  key={pkg.id}
                  id={pkg.id}
                  className="animate-scale-in scroll-mt-24"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Card
                    className={`relative flex flex-col h-full transition-all duration-300 ${
                      inCart
                        ? 'ring-4 ring-[#E8621A] bg-[#E8621A]/5'
                        : 'hover:scale-[1.02]'
                    }`}
                    hover={true}
                  >
                    {/* In cart badge */}
                    {inCart && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E8621A] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap z-10">
                        In Cart
                      </div>
                    )}

                    {/* Package Image */}
                    <div className="relative h-28 sm:h-40 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 mb-4 rounded-t-xl overflow-hidden">
                      <ProductImagePlaceholder title={pkg.title} />
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-oswald text-xl sm:text-2xl font-bold text-[#1A1A1A] mb-1 tracking-wide">
                      {pkg.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>

                    {/* Price per person */}
                    <div className="mb-4 p-3 bg-[#F5EDE0] rounded-lg">
                      <div className="flex items-baseline gap-1">
                        <span className="font-oswald text-3xl font-bold text-[#1A1A1A]">
                          {formatCurrency(pkg.pricePerPerson)}
                        </span>
                        <span className="text-sm text-gray-500">/person</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum {pkg.minHeadcount || 10} guests
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

                    {/* People Selector */}
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 text-center">
                        How many guests?
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setHeadcount(pkg.id, headcount - 5, pkg.minHeadcount)}
                          className="w-10 h-10 rounded-full bg-[#F5EDE0] hover:bg-[#E8621A] hover:text-white text-[#1A1A1A] font-bold text-lg transition-colors flex items-center justify-center"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={headcount}
                          onChange={(e) => setHeadcount(pkg.id, parseInt(e.target.value) || pkg.minHeadcount || 10, pkg.minHeadcount)}
                          className="w-20 h-10 text-center text-xl font-oswald font-bold border-2 border-[#1A1A1A] rounded-lg focus:ring-2 focus:ring-[#E8621A]/50 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min={pkg.minHeadcount || 10}
                        />
                        <button
                          onClick={() => setHeadcount(pkg.id, headcount + 5, pkg.minHeadcount)}
                          className="w-10 h-10 rounded-full bg-[#F5EDE0] hover:bg-[#E8621A] hover:text-white text-[#1A1A1A] font-bold text-lg transition-colors flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Calculated Total */}
                    <div className="mb-4 p-3 bg-[#1A1A1A] rounded-lg text-center">
                      <p className="text-white text-sm">
                        {headcount} people x {formatCurrency(pkg.pricePerPerson)} =
                      </p>
                      <p className="font-oswald text-2xl font-bold text-[#E8621A]">
                        {formatCurrency(total)}
                      </p>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                      onClick={() => handleAddToCart(pkg)}
                      variant={inCart ? 'secondary' : 'primary'}
                      className="w-full"
                    >
                      {inCart ? 'Update Cart' : 'Add to Cart'}
                    </Button>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {/* Checkout Button */}
        {state.selectedItems.length > 0 && (
          <div className="mt-10 text-center animate-scale-in">
            <Button onClick={handleCheckout} className="px-10 text-lg">
              Proceed to Checkout
            </Button>
          </div>
        )}

        {/* Upsell CTAs */}
        <div className="mt-12 border-t border-gray-200 pt-10">
          <h3 className="font-oswald text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-wider text-center mb-6">
            MAKE IT A FEAST
          </h3>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {[
              { label: 'Add Desserts', emoji: '🍪' },
              { label: 'Add Cornbread Muffins', emoji: '🧁' },
              { label: 'Add Drinks', emoji: '🥤' },
              { label: 'Add Sides', emoji: '🥗' },
            ].map((cta) => (
              <button
                key={cta.label}
                onClick={() => router.push('/products')}
                className="flex items-center gap-2 bg-white border-2 border-[#E8621A] text-[#E8621A] font-oswald font-bold tracking-wide px-5 py-3 rounded-lg hover:bg-[#E8621A] hover:text-white transition-colors text-sm sm:text-base"
              >
                <span>{cta.emoji}</span>
                {cta.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
