'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useActiveProducts } from '@/lib/hooks/useActiveProducts';
import { useActivePackages } from '@/lib/hooks/useActivePackages';
import { formatCurrency } from '@/lib/pricing';
import MenuItemRow from '@/components/catering/MenuItemRow';
import ProductImagePlaceholder from '@/components/ui/ProductImagePlaceholder';

// Same sections as the ordering page
const MENU_SECTIONS = [
  { id: 'packages', label: 'Catering Packs', tag: 'packages', image: '/images/chef-dominique-ribs.jpg' },
  { id: 'meats', label: 'Meats', tag: 'meats', image: '/images/meats-hero.webp' },
  { id: 'sliders', label: 'Sliders', tag: 'sliders', image: '/images/sliders-hero.webp' },
  { id: 'sides', label: 'Sides', tag: 'sides', image: '/images/sides-hero.webp' },
  { id: 'dessert', label: 'Desserts', tag: 'dessert', image: '' },
  { id: 'beverage', label: 'Drinks', tag: 'beverage', image: '' },
  { id: 'equipment', label: 'Equipment & Extras', tag: 'equipment', image: '' },
];

export default function MenusPage() {
  const [activeSection, setActiveSection] = useState<string>('packages');
  const [searchTerm, setSearchTerm] = useState('');
  const { activeProducts } = useActiveProducts();
  const { packages } = useActivePackages();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Filter products excluding equipment for food sections
  const allFood = useMemo(() =>
    activeProducts.filter(p => !p.tags?.includes('service')),
    [activeProducts]
  );

  // Group into sections
  const groupedSections = useMemo(() => {
    const filtered = searchTerm
      ? allFood.filter(p =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : allFood;

    return MENU_SECTIONS
      .filter(s => s.id !== 'packages') // packages handled separately
      .map(section => ({
        ...section,
        products: filtered
          .filter(p => {
            if (section.tag === 'equipment') {
              return p.tags?.includes('equipment') || p.tags?.includes('cutlery') || p.tags?.includes('condiments');
            }
            return p.tags?.includes(section.tag);
          })
          .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)),
      }))
      .filter(section => section.products.length > 0);
  }, [allFood, searchTerm]);

  // Scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const allSections = ['packages', ...groupedSections.map(s => s.id)];
      for (const id of allSections) {
        const el = sectionRefs.current[id];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [groupedSections]);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

      {/* Sticky Nav + Search */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-2 py-4 scrollbar-hide">
            <button
              onClick={() => scrollToSection('packages')}
              className={`px-4 py-2 rounded-full font-oswald font-semibold text-sm whitespace-nowrap transition-all ${
                activeSection === 'packages'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-gray-100 text-[#1A1A1A] hover:bg-[#E8621A]/20'
              }`}
            >
              Catering Packs
            </button>
            {groupedSections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`px-4 py-2 rounded-full font-oswald font-semibold text-sm whitespace-nowrap transition-all ${
                  activeSection === section.id
                    ? 'bg-[#1A1A1A] text-white'
                    : 'bg-gray-100 text-[#1A1A1A] hover:bg-[#E8621A]/20'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
          <div className="pb-3">
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg focus:border-[#E8621A] focus:outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="container mx-auto px-4 py-8 sm:py-12">

        {/* Packages Section */}
        <div
          ref={(el) => { sectionRefs.current['packages'] = el; }}
          className="mb-12 scroll-mt-36"
        >
          <div className="mb-5">
            <h3 className="font-oswald text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-wide uppercase">
              Catering Packs
            </h3>
            <div className="w-12 h-1 bg-[#E8621A] mt-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Hero image */}
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
              <Image
                src="/images/chef-dominique-ribs.jpg"
                alt="Catering Packs"
                fill
                className="object-cover"
              />
            </div>

            {/* Right: Package list */}
            <div>
              {packages.map((pkg) => (
                <div key={pkg.id} className="py-4 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-oswald font-semibold text-[#1A1A1A] text-sm sm:text-base tracking-wide">
                        {pkg.title}
                      </h4>
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{pkg.description}</p>
                      <ul className="mt-1.5 space-y-0.5">
                        {pkg.items.map((item, i) => (
                          <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                            <span className="text-[#E8621A] mt-0.5 flex-shrink-0">&#8226;</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                      {pkg.minHeadcount && (
                        <p className="text-[10px] text-gray-400 mt-1.5 uppercase tracking-wide">
                          Min {pkg.minHeadcount} guests
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <span className="font-oswald font-bold text-[#E8621A] text-base">
                        {formatCurrency(pkg.pricePerPerson)}/pp
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Food Sections — same layout as ordering page */}
        {groupedSections.map((section) => (
          <div
            key={section.id}
            ref={(el) => { sectionRefs.current[section.id] = el; }}
            className="mb-12 scroll-mt-36"
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
              {section.image && (
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
                  <Image
                    src={section.image}
                    alt={section.label}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className={section.image ? '' : 'md:col-span-2'}>
                {section.products.map((product) => (
                  <MenuItemRow key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        ))}
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
              <li>&#8226; Most dietary restrictions can be accommodated — just tell us what you need.</li>
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
