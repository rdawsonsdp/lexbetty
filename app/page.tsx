'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCatering } from '@/context/CateringContext';
import { EVENT_TYPES } from '@/lib/event-types';
import StepIndicator from '@/components/catering/StepIndicator';
import HeadcountBudgetStep from '@/components/catering/HeadcountBudgetStep';
import OrderTypeStep from '@/components/catering/OrderTypeStep';
import ProductSelectionStep from '@/components/catering/ProductSelectionStep';
import PackageSelectionStep from '@/components/catering/PackageSelectionStep';
import ValueProposition from '@/components/marketing/ValueProposition';
import TrustSignals from '@/components/marketing/TrustSignals';
import ClientLogos from '@/components/marketing/ClientLogos';
import TestimonialsSection from '@/components/marketing/TestimonialsSection';
import DietaryFilterBar from '@/components/catering/DietaryFilterBar';
import RecommendedItems from '@/components/catering/RecommendedItems';

export default function HomePage() {
  const { state, dispatch } = useCatering();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleSelectEventType = (eventTypeId: string) => {
    dispatch({
      type: 'SET_EVENT_TYPE',
      payload: eventTypeId as 'breakfast' | 'lunch' | 'dessert',
    });
  };

  const eventImages: Record<string, string> = {
    breakfast: '/images/Shrimp and Grits Shot High Res.png',
    lunch: '/images/Stacked Sandwiches Hi Res Shot.png',
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
    <div className="min-h-screen bg-[#f7efd7]">
      {/* Hero Section */}
      <section className="relative">
        {/* Two-Image Hero */}
        <div className="grid grid-cols-2 md:grid-cols-2">
          <div className="relative h-[120px] sm:h-[200px] md:h-[350px] lg:h-[450px] overflow-hidden">
            <Image
              src="/images/bbq_brisket.jpg"
              alt="BBQ Brisket"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="relative h-[120px] sm:h-[200px] md:h-[350px] lg:h-[450px] overflow-hidden">
            <Image
              src="/images/Stacked Sandwiches Hi Res Shot.png"
              alt="Gourmet Sandwiches"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Title Banner */}
        <div className="bg-[#363333] py-8 sm:py-10 text-center">
          <h1 className="font-oswald text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#f7efd7] tracking-wider mb-2">
            URBAN BISTRO
          </h1>
          <p className="font-oswald text-base sm:text-xl md:text-[2.5rem] font-bold text-[#dabb64] tracking-wider whitespace-nowrap">
            THE RIGHT FOOD. THE RIGHT AMOUNT. EVERY EVENT.
          </p>
        </div>

        <div className="bg-[#dabb64] py-4 text-center">
          <p className="font-oswald text-sm sm:text-base tracking-wide text-[#363333]">
            Plan your next remarkable event!
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
      <section id="catering" className="bg-[#f7efd7] pt-12 sm:pt-16">
        <div className="container mx-auto px-4">
          <StepIndicator currentStep={state.currentStep} />
        </div>
      </section>

      {/* Step 1: Event Type Selection */}
      <section className="bg-[#f7efd7] pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-[#363333] tracking-wider mb-4">
              WHAT ARE YOU PLANNING?
            </h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
              Select your event type to see our curated menu options
            </p>
          </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {EVENT_TYPES.map((eventType, index) => {
                  const isSelected = state.eventType === eventType.id;
                  const isUnselected = state.eventType && state.eventType !== eventType.id;

                  return (
                    <div
                      key={eventType.id}
                      className="animate-scale-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div
                        onClick={() => handleSelectEventType(eventType.id)}
                        className={`
                          relative overflow-hidden rounded-xl cursor-pointer
                          transition-all duration-300 shadow-md
                          h-[180px] sm:h-[240px] md:h-[320px]
                          ${isSelected
                            ? 'ring-4 ring-[#dabb64] scale-[1.02]'
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

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Browse Full Menu Link */}
      <section className="bg-[#363333] py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="font-oswald text-2xl sm:text-3xl font-bold text-[#f7efd7] mb-3 tracking-wide">
            LOOKING FOR SOMETHING ELSE?
          </h3>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">
            Browse our complete menu with over 90 items including breakfast, lunch, dinner, desserts, and beverages.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-[#dabb64] text-[#363333] font-oswald font-bold px-8 py-3 rounded-lg hover:bg-[#f7efd7] transition-all group"
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
