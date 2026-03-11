'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCatering } from '@/context/CateringContext';
import { useEnabledEventTypes } from '@/lib/hooks/useEnabledEventTypes';
import StepIndicator from '@/components/catering/StepIndicator';
import HeadcountBudgetStep from '@/components/catering/HeadcountBudgetStep';
import OrderTypeStep from '@/components/catering/OrderTypeStep';
import ProductSelectionStep from '@/components/catering/ProductSelectionStep';
import PackageSelectionStep from '@/components/catering/PackageSelectionStep';
import EquipmentStep from '@/components/catering/EquipmentStep';
import ValueProposition from '@/components/marketing/ValueProposition';
import TrustSignals from '@/components/marketing/TrustSignals';
import ClientLogos from '@/components/marketing/ClientLogos';
import TestimonialsSection from '@/components/marketing/TestimonialsSection';
import DietaryFilterBar from '@/components/catering/DietaryFilterBar';
import RecommendedItems from '@/components/catering/RecommendedItems';

export default function HomePage() {
  const { state, dispatch } = useCatering();
  const { eventTypes: EVENT_TYPES } = useEnabledEventTypes();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleSelectEventType = (eventTypeId: string) => {
    dispatch({
      type: 'SET_EVENT_TYPE',
      payload: eventTypeId as 'breakfast' | 'lunch' | 'dessert',
    });
  };

  const eventImages: Record<string, string> = {
    lunch: '/images/brisket-sauce-pour.jpg',
    dessert: '/images/BSB Chocolate Chip Cookies Hi Res Shot.png',
  };

  const handleToggleFilter = (tag: string) => {
    setActiveFilters(prev =>
      prev.includes(tag)
        ? prev.filter(f => f !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Hero Section */}
      <section>
        {/* Mobile: Single full-width hero */}
        <div className="md:hidden relative aspect-[4/5] overflow-hidden bg-black">
          <Image
            src="/images/chef-dominique-hero.png"
            alt="Celebrity Chef Dominique Leach - Lexington Betty Smokehouse"
            fill
            className="object-cover object-top"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-start justify-end p-6">
            <h1 className="font-oswald text-4xl font-bold text-white tracking-wider leading-[0.95] mb-2 drop-shadow-lg">
              BEST BBQ<br />IN CHICAGO
            </h1>
            <p className="font-oswald text-sm text-[#E8621A] tracking-widest font-bold drop-shadow">
              CHEF DOMINIQUE LEACH
            </p>
          </div>
        </div>

        {/* Desktop: Two-up grid */}
        <div className="hidden md:block bg-white pt-6 pb-2">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
              {/* Left: Brisket Hero */}
              <div>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-black">
                  <Image
                    src="/images/brisket-knife-hero.png"
                    alt="Best Brisket in Chicago - Lexington Betty Smokehouse"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <h2 className="font-oswald text-xl md:text-2xl font-bold text-[#383838] tracking-wide mt-3">
                  Best Brisket in Chicago
                </h2>
                <p className="font-oswald text-sm text-[#E8621A] tracking-wide">
                  Smoked Low & Slow
                </p>
              </div>

              {/* Right: Chef Dominique */}
              <div>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-black">
                  <Image
                    src="/images/chef-dominique-hero.png"
                    alt="Celebrity Chef Dominique Leach"
                    fill
                    className="object-cover object-top"
                    priority
                  />
                </div>
                <h2 className="font-oswald text-xl md:text-2xl font-bold text-[#383838] tracking-wide mt-3">
                  Chef Dominique Leach
                </h2>
                <p className="font-oswald text-sm text-[#E8621A] tracking-wide">
                  Celebrity Chef
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Accent Bar */}
        <div className="bg-[#E8621A] py-3 text-center md:mt-6">
          <p className="font-oswald text-sm sm:text-base tracking-widest text-white font-bold uppercase">
            Catering for Every Occasion
          </p>
        </div>
      </section>

      {/* Value Proposition */}
      <ValueProposition />

      {/* How It Works */}
      <TrustSignals />

      {/* Client Logos */}
      <ClientLogos />

      {/* Step Indicator */}
      <section id="catering" className="bg-[#FAFAFA] pt-12 sm:pt-16">
        <div className="container mx-auto px-4">
          <StepIndicator currentStep={state.currentStep} />
        </div>
      </section>

      {/* Step 1: Event Type Selection */}
      <section className="bg-[#FAFAFA] pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-[#383838] tracking-wider mb-4">
              WHAT ARE YOU PLANNING?
            </h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
              No wrong choices here — pick what fits and we&apos;ll show you the best options.
            </p>
          </div>

              <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
                {EVENT_TYPES.map((eventType, index) => {
                  const isSelected = state.eventType === eventType.id;
                  const isUnselected = state.eventType && state.eventType !== eventType.id;

                  return (
                    <div
                      key={eventType.id}
                      className="animate-scale-in w-full sm:w-[calc(50%-0.75rem)] max-w-[400px]"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div
                        onClick={() => handleSelectEventType(eventType.id)}
                        className={`
                          relative overflow-hidden rounded-xl cursor-pointer
                          transition-all duration-300 shadow-md
                          h-[180px] sm:h-[240px] md:h-[320px]
                          ${isSelected
                            ? 'ring-4 ring-[#E8621A] scale-[1.02]'
                            : 'hover:scale-105'
                          }
                          ${isUnselected ? 'opacity-50 grayscale' : ''}
                        `}
                      >
                        <Image
                          src={eventImages[eventType.id] || '/images/Yogurt Parfait Shot High Res.png'}
                          alt={eventType.name}
                          fill
                          className="object-cover"
                        />
                        <div className={`absolute inset-0 ${isSelected ? 'bg-gradient-to-t from-black/70 via-black/30 to-transparent' : 'bg-gradient-to-t from-black/80 via-black/40 to-transparent'}`} />
                        <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-center">
                          <h3 className="font-oswald text-2xl sm:text-3xl font-bold text-white mb-2 tracking-wide drop-shadow-lg">
                            {eventType.name.toUpperCase()}
                          </h3>
                          <p className="text-white/90 text-sm sm:text-base drop-shadow">
                            {eventType.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

      {/* Step 2: Headcount & Budget */}
      {state.currentStep >= 2 && (
        <HeadcountBudgetStep />
      )}

      {/* Step 3: Order Type */}
      {state.currentStep >= 3 && (
        <OrderTypeStep />
      )}

      {/* Step 4: Product or Package Selection */}
      {state.currentStep >= 4 && (
        state.orderType === 'packages' ? (
          <PackageSelectionStep />
        ) : (
          <ProductSelectionStep
            activeFilters={activeFilters}
            onToggleFilter={handleToggleFilter}
            filterBar={
              <DietaryFilterBar
                activeTags={activeFilters}
                onToggleTag={handleToggleFilter}
              />
            }
            recommendedSection={
              <RecommendedItems />
            }
          />
        )
      )}

      {/* Step 5: Equipment & Extras (build-your-own only) */}
      {state.currentStep >= 5 && state.orderType === 'build-your-own' && (
        <EquipmentStep />
      )}

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Browse Full Menu Link */}
      <section className="bg-[#383838] py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="font-oswald text-2xl sm:text-3xl font-bold text-[#FAFAFA] mb-3 tracking-wide">
            LOOKING FOR SOMETHING ELSE?
          </h3>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">
            Browse our complete menu with over 90 items including breakfast, lunch, dinner, desserts, and beverages.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-[#E8621A] text-white font-oswald font-bold px-8 py-3 rounded-lg hover:opacity-90 transition-all group"
          >
            <span>Browse Full Menu</span>
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
