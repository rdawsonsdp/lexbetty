'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProductImagePlaceholder from '@/components/ui/ProductImagePlaceholder';
import { CateringProduct } from '@/lib/types';
import { getDisplayPrice, getPricingTypeLabel } from '@/lib/pricing';
import DietaryFilterBar from '@/components/catering/DietaryFilterBar';
import { useActiveProducts } from '@/lib/hooks/useActiveProducts';
import { useActivePackages } from '@/lib/hooks/useActivePackages';

// --- Menu Sections matching LB Catering Menu ---

const MENU_SECTIONS = [
  {
    id: 'packages',
    title: 'CATERING PACKS',
    subtitle: 'Betty Party Deals, Betty Boxes & Food Truck',
    image: '/images/chef-dominique-ribs.jpg',
  },
  {
    id: 'meats',
    title: 'BETTY MEATS',
    subtitle: 'Smoked Low & Slow — By the Pan or Pound',
    image: '/images/brisket-sauce-pour.jpg',
    subsections: [
      { id: 'meats-pork', title: 'Pork', filter: (p: CateringProduct) => p.tags?.includes('pork') && !p.tags?.includes('sliders') },
      { id: 'meats-poultry', title: 'Poultry', filter: (p: CateringProduct) => p.tags?.includes('poultry') && !p.tags?.includes('sliders') },
      { id: 'meats-beef', title: 'Beef', filter: (p: CateringProduct) => p.tags?.includes('beef') && !p.tags?.includes('sliders') },
    ],
  },
  {
    id: 'sliders',
    title: 'SLIDERS',
    subtitle: 'Smoked to Perfection on Brioche Buns (24 ct)',
    image: '/images/Stacked Sandwiches Hi Res Shot.png',
  },
  {
    id: 'sides',
    title: 'BETTY SOULFUL SIDES',
    subtitle: 'Comfort Food Done Right',
    image: '/images/Macaroni and Cheese Shot Hi Res.png',
  },
  {
    id: 'desserts',
    title: 'BETTY DESSERTS',
    subtitle: 'Sweet Endings',
    image: '/images/BSB Caramel Cake Slices Hi Res Shot.png',
  },
  {
    id: 'drinks',
    title: 'BETTY DRINKS',
    subtitle: 'Refreshments for Every Occasion',
    image: '/images/Cold Brew Hi Res Shot.png',
  },
  {
    id: 'equipment',
    title: 'EQUIPMENT & EXTRAS',
    subtitle: 'Catering Supplies',
    image: '/images/bbq_brisket.jpg',
  },
];

function filterByDietary(products: CateringProduct[], filters: string[]): CateringProduct[] {
  if (filters.length === 0) return products;
  return products.filter(p => filters.every(f => p.tags?.includes(f)));
}

// --- Components ---

function MenuItemCard({ product }: { product: CateringProduct }) {
  const isFeatured = product.featured;
  const isPopular = product.tags?.includes('popular');

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-32 sm:h-40">
        <ProductImagePlaceholder title={product.title} />
        {isFeatured && (
          <div className="absolute top-2 left-2 bg-[#E8621A] text-white px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide z-10">
            FEATURED
          </div>
        )}
        {!isFeatured && isPopular && (
          <div className="absolute top-2 left-2 bg-[#1A1A1A] text-white px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide z-10">
            POPULAR
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-oswald font-bold text-[#1A1A1A] text-sm sm:text-base mb-1 line-clamp-1">
          {product.title}
        </h4>
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center gap-2">
          <span className="font-oswald font-bold text-[#E8621A]">
            {getDisplayPrice(product)}
          </span>
          <span className="text-sm text-gray-400">
            {getPricingTypeLabel(product)}
          </span>
        </div>
      </div>
    </div>
  );
}

function PackageCard({ pkg }: { pkg: { id: string; title: string; description: string; pricePerPerson: number; image: string; items: string[]; minHeadcount?: number } }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      <div className="relative h-40 sm:h-48">
        <ProductImagePlaceholder title={pkg.title} />
        <div className="absolute bottom-3 left-3 z-10">
          <span className="bg-[#E8621A] text-white font-oswald font-bold px-3 py-1 rounded text-sm">
            ${pkg.pricePerPerson}/PP
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-oswald text-lg sm:text-xl font-bold text-[#1A1A1A] mb-2 tracking-wide">
          {pkg.title}
        </h3>
        <p className="text-sm text-gray-500 mb-3">{pkg.description}</p>
        <ul className="space-y-1.5">
          {pkg.items.map((item, i) => (
            <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
              <span className="text-[#E8621A] mt-0.5 flex-shrink-0">&#8226;</span>
              {item}
            </li>
          ))}
        </ul>
        {pkg.minHeadcount && (
          <p className="text-[10px] text-gray-400 mt-3 uppercase tracking-wide">
            Min {pkg.minHeadcount} guests
          </p>
        )}
      </div>
    </div>
  );
}

// --- Page ---

export default function MenusPage() {
  const [activeSection, setActiveSection] = useState<string>('packages');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const { activeProducts } = useActiveProducts();
  const { packages } = useActivePackages();

  const handleToggleFilter = (tag: string) => {
    setActiveFilters(prev =>
      prev.includes(tag)
        ? prev.filter(f => f !== tag)
        : [...prev, tag]
    );
  };

  // Products by section
  const sectionProducts = useMemo(() => {
    const sliders = activeProducts.filter(p => p.tags?.includes('sliders'));
    const sides = activeProducts.filter(p => p.tags?.includes('sides') && !p.tags?.includes('condiments'));
    const desserts = activeProducts.filter(p => p.tags?.includes('dessert'));
    const drinks = activeProducts.filter(p => p.tags?.includes('beverage'));
    const equipment = activeProducts.filter(p => p.tags?.includes('equipment') || p.tags?.includes('cutlery') || p.tags?.includes('condiments'));
    return { sliders, sides, desserts, drinks, equipment };
  }, [activeProducts]);

  // Track scroll position to update active nav tab
  useEffect(() => {
    const handleScroll = () => {
      for (const section of MENU_SECTIONS) {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
      setActiveSection(sectionId);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EDE0]">
      {/* Hero Header */}
      <div className="bg-[#1A1A1A] py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <Image src="/images/lb-pattern-charcoal.png" alt="" fill className="object-cover" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h1 className="font-oswald text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-wider mb-4">
              CATERING MENU
            </h1>
            <p className="text-[#E8621A] text-lg sm:text-xl max-w-2xl mx-auto font-oswald tracking-wide">
              SMOKED LOW &amp; SLOW. SERVED WITH SOUL.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-2 py-4 scrollbar-hide">
            {MENU_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`px-4 py-2 rounded-full font-oswald font-semibold text-sm whitespace-nowrap transition-all ${
                  activeSection === section.id
                    ? 'bg-[#1A1A1A] text-white'
                    : 'bg-gray-100 text-[#1A1A1A] hover:bg-[#E8621A]/20'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
          <div className="pb-3">
            <DietaryFilterBar activeTags={activeFilters} onToggleTag={handleToggleFilter} />
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="container mx-auto px-4 py-8 sm:py-12">

        {/* === CATERING PACKS (Packages) === */}
        <section id="packages" className="mb-16 sm:mb-20 scroll-mt-20">
          <div className="relative mb-8 sm:mb-12 rounded-2xl overflow-hidden">
            <div className="relative h-48 sm:h-64">
              <Image src="/images/chef-dominique-ribs.jpg" alt="Catering Packs" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/90 via-[#1A1A1A]/70 to-transparent" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
              <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-wider mb-2">
                CATERING PACKS
              </h2>
              <p className="text-[#E8621A] text-base sm:text-lg font-oswald tracking-wide">
                Betty Party Deals &bull; Betty Boxes &bull; Food Truck
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </section>

        {/* === BETTY MEATS === */}
        <section id="meats" className="mb-16 sm:mb-20 scroll-mt-20">
          <div className="relative mb-8 sm:mb-12 rounded-2xl overflow-hidden">
            <div className="relative h-48 sm:h-64">
              <Image src="/images/brisket-sauce-pour.jpg" alt="Betty Meats" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/90 via-[#1A1A1A]/70 to-transparent" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
              <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-wider mb-2">
                BETTY MEATS
              </h2>
              <p className="text-[#E8621A] text-base sm:text-lg">
                Smoked Low &amp; Slow — By the Pan or Pound
              </p>
            </div>
          </div>

          <div className="space-y-12">
            {/* Pork */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <h3 className="font-oswald text-xl sm:text-2xl font-bold text-[#1A1A1A]">Pork</h3>
                <div className="flex-1 h-px bg-[#E8621A]/50" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filterByDietary(activeProducts.filter(p => p.tags?.includes('pork') && !p.tags?.includes('sliders')), activeFilters).map(p => (
                  <MenuItemCard key={p.id} product={p} />
                ))}
              </div>
            </div>

            {/* Poultry */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <h3 className="font-oswald text-xl sm:text-2xl font-bold text-[#1A1A1A]">Poultry</h3>
                <div className="flex-1 h-px bg-[#E8621A]/50" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filterByDietary(activeProducts.filter(p => p.tags?.includes('poultry') && !p.tags?.includes('sliders')), activeFilters).map(p => (
                  <MenuItemCard key={p.id} product={p} />
                ))}
              </div>
            </div>

            {/* Beef */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <h3 className="font-oswald text-xl sm:text-2xl font-bold text-[#1A1A1A]">Beef</h3>
                <div className="flex-1 h-px bg-[#E8621A]/50" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filterByDietary(activeProducts.filter(p => p.tags?.includes('beef') && !p.tags?.includes('sliders')), activeFilters).map(p => (
                  <MenuItemCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* === SLIDERS === */}
        <section id="sliders" className="mb-16 sm:mb-20 scroll-mt-20">
          <div className="relative mb-8 sm:mb-12 rounded-2xl overflow-hidden">
            <div className="relative h-48 sm:h-64">
              <Image src="/images/Stacked Sandwiches Hi Res Shot.png" alt="Sliders" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/90 via-[#1A1A1A]/70 to-transparent" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
              <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-wider mb-2">
                SLIDERS
              </h2>
              <p className="text-[#E8621A] text-base sm:text-lg">
                24 per order — Brioche buns, pickles &amp; coleslaw
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filterByDietary(sectionProducts.sliders, activeFilters).map(p => (
              <MenuItemCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* === BETTY SOULFUL SIDES === */}
        <section id="sides" className="mb-16 sm:mb-20 scroll-mt-20">
          <div className="relative mb-8 sm:mb-12 rounded-2xl overflow-hidden">
            <div className="relative h-48 sm:h-64">
              <Image src="/images/Macaroni and Cheese Shot Hi Res.png" alt="Soulful Sides" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/90 via-[#1A1A1A]/70 to-transparent" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
              <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-wider mb-2">
                BETTY SOULFUL SIDES
              </h2>
              <p className="text-[#E8621A] text-base sm:text-lg">
                Comfort Food Done Right
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filterByDietary(sectionProducts.sides, activeFilters).map(p => (
              <MenuItemCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* === BETTY DESSERTS === */}
        <section id="desserts" className="mb-16 sm:mb-20 scroll-mt-20">
          <div className="relative mb-8 sm:mb-12 rounded-2xl overflow-hidden">
            <div className="relative h-48 sm:h-64">
              <Image src="/images/BSB Caramel Cake Slices Hi Res Shot.png" alt="Desserts" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/90 via-[#1A1A1A]/70 to-transparent" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
              <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-wider mb-2">
                BETTY DESSERTS
              </h2>
              <p className="text-[#E8621A] text-base sm:text-lg">
                Sweet Endings
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filterByDietary(sectionProducts.desserts, activeFilters).map(p => (
              <MenuItemCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* === BETTY DRINKS === */}
        <section id="drinks" className="mb-16 sm:mb-20 scroll-mt-20">
          <div className="relative mb-8 sm:mb-12 rounded-2xl overflow-hidden">
            <div className="relative h-48 sm:h-64">
              <Image src="/images/Cold Brew Hi Res Shot.png" alt="Drinks" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/90 via-[#1A1A1A]/70 to-transparent" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
              <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-wider mb-2">
                BETTY DRINKS
              </h2>
              <p className="text-[#E8621A] text-base sm:text-lg">
                Refreshments for Every Occasion
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filterByDietary(sectionProducts.drinks, activeFilters).map(p => (
              <MenuItemCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* === EQUIPMENT & EXTRAS === */}
        <section id="equipment" className="mb-16 sm:mb-20 scroll-mt-20">
          <div className="mb-8">
            <h2 className="font-oswald text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-wider mb-2">
              EQUIPMENT &amp; EXTRAS
            </h2>
            <p className="text-gray-500">Catering supplies and add-ons</p>
            <div className="h-1 w-16 bg-[#E8621A] mt-4" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sectionProducts.equipment.map(p => (
              <MenuItemCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </div>

      {/* CTA Section */}
      <div className="bg-[#1A1A1A] py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="font-oswald text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 tracking-wide">
            READY TO ORDER?
          </h3>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">
            Build your custom catering order or choose one of our Betty Party Deals.
            Delivery minimum $500. Orders must be placed 72 hours in advance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/#catering"
              className="inline-flex items-center gap-2 bg-[#E8621A] text-white font-oswald font-bold px-8 py-3 rounded-lg hover:opacity-90 transition-all"
            >
              <span>Start Your Order</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a
              href="mailto:info@lexingtonbetty.com"
              className="inline-flex items-center gap-2 border-2 border-white text-white font-oswald font-bold px-8 py-3 rounded-lg hover:bg-white hover:text-[#1A1A1A] transition-all"
            >
              <span>Email Us</span>
            </a>
          </div>
        </div>
      </div>

      {/* Smokin' Good Things to Know */}
      <div className="bg-[#F5EDE0] py-10 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h4 className="font-oswald text-xl font-bold text-[#1A1A1A] mb-4 tracking-wider">
              SMOKIN&apos; GOOD THINGS TO KNOW
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>&#8226; We can accommodate most dietary restrictions — just let us know.</li>
              <li>&#8226; A la carte / Party Deals / Betty Box orders must be placed <strong>72 hours in advance</strong>.</li>
              <li>&#8226; Food truck rentals need to be reserved <strong>14 days in advance</strong>.</li>
              <li>&#8226; All orders must be paid in full <strong>48 hours in advance</strong>.</li>
              <li>&#8226; Payments accepted: all major credit cards. No checks.</li>
              <li>&#8226; Delivery minimum: <strong>$500</strong>.</li>
              <li>&#8226; Delivery fees: $500–$1,000 = $100 | $1,001–$2,000 = $150 | $2,001+ = $250.</li>
            </ul>
            <p className="text-sm text-[#E8621A] font-bold mt-4">
              Place orders at info@lexingtonbetty.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
