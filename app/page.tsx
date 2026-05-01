'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCatering } from '@/context/CateringContext';
import { useEnabledEventTypes } from '@/lib/hooks/useEnabledEventTypes';

export default function HomePage() {
  const router = useRouter();
  const { dispatch } = useCatering();
  const { eventTypes: EVENT_TYPES } = useEnabledEventTypes();

  const eventImages: Record<string, string> = {
    lunch: '/images/cornbread.jpg',
    alacarte: '/images/sliders-board.png',
  };

  const handleCardClick = (eventTypeId: string) => {
    if (eventTypeId === 'lunch') {
      // Event planner flow — navigate to the planner page
      dispatch({ type: 'SET_EVENT_TYPE', payload: 'lunch' });
      dispatch({ type: 'SET_ORDER_MODE', payload: 'wizard' });
      router.push('/plan');
    } else if (eventTypeId === 'alacarte') {
      // A la carte — go straight to products
      dispatch({ type: 'SET_EVENT_TYPE', payload: 'alacarte' });
      dispatch({ type: 'SET_ORDER_MODE', payload: 'alacarte' });
      dispatch({ type: 'SET_HEADCOUNT', payload: 10 });
      dispatch({ type: 'SET_ORDER_TYPE', payload: 'build-your-own' });
      router.push('/products');
    } else if (eventTypeId === 'packages') {
      // Packages flow
      dispatch({ type: 'SET_EVENT_TYPE', payload: 'lunch' });
      dispatch({ type: 'SET_ORDER_MODE', payload: 'wizard' });
      dispatch({ type: 'SET_HEADCOUNT', payload: 10 });
      dispatch({ type: 'SET_ORDER_TYPE', payload: 'packages' });
      router.push('/packages');
    } else if (eventTypeId === 'food-truck') {
      router.push('/food-truck');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EDE0]">
      {/* Hero Section */}
      <section className="bg-[#1A1A1A] py-8 sm:py-16 text-center">
        <div className="container mx-auto px-4">
          <h1 className="font-oswald text-2xl sm:text-4xl md:text-6xl font-bold text-white tracking-wider mb-2 sm:mb-4">
            CATERING FOR EVERY OCCASION
          </h1>
          <p className="font-oswald text-base sm:text-xl text-[#E8621A] tracking-widest font-bold">
            Plan. Order. Enjoy.
          </p>
        </div>
      </section>

      {/* Selection Cards */}
      <section id="order" className="bg-[#F5EDE0] py-4 sm:py-16 scroll-mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-4 sm:mb-10">
            <h2 className="font-oswald text-xl sm:text-3xl md:text-5xl font-bold text-[#1A1A1A] tracking-wider mb-2 sm:mb-4">
              ORDER WHAT YOUR EVENT NEEDS
            </h2>
            <p className="text-gray-600 text-sm sm:text-lg max-w-2xl mx-auto">
              Tell us what you&apos;re planning — we&apos;ll make sure the food handles itself.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 max-w-4xl mx-auto">
            {EVENT_TYPES.map((eventType, index) => (
              <div
                key={eventType.id}
                className="animate-scale-in w-full sm:w-[calc(50%-0.75rem)] max-w-[400px]"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  onClick={() => handleCardClick(eventType.id)}
                  className="relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 shadow-md h-[140px] sm:h-[220px] md:h-[280px] hover:scale-105"
                >
                  {eventImages[eventType.id] && (
                    <Image
                      src={eventImages[eventType.id]}
                      alt={eventType.name}
                      fill
                      className="object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-end p-3 sm:p-6 text-center">
                    <h3 className="font-oswald text-lg sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 tracking-wide drop-shadow-lg">
                      {eventType.name.toUpperCase()}
                    </h3>
                    <p className="text-white/90 text-xs sm:text-sm drop-shadow hidden sm:block">
                      {eventType.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Order From Our Menu Packages card */}
            <div
              className="animate-scale-in w-full sm:w-[calc(50%-0.75rem)] max-w-[400px]"
              style={{ animationDelay: `${EVENT_TYPES.length * 0.1}s` }}
            >
              <div
                onClick={() => handleCardClick('packages')}
                className="relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 shadow-md h-[140px] sm:h-[220px] md:h-[280px] hover:scale-105"
              >
                <Image
                  src="/images/brisket-board.png"
                  alt="Order from our menu packages"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-3 sm:p-6 text-center">
                  <h3 className="font-oswald text-lg sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 tracking-wide drop-shadow-lg">
                    EXECUTIVE & CORPORATE BOX LUNCHES
                  </h3>
                  <p className="text-white/90 text-xs sm:text-sm drop-shadow hidden sm:block">
                    Pre-built menus ready to order
                  </p>
                </div>
              </div>
            </div>

            {/* Betty Food Truck card */}
            <div
              className="animate-scale-in w-full sm:w-[calc(50%-0.75rem)] max-w-[400px]"
              style={{ animationDelay: `${(EVENT_TYPES.length + 1) * 0.1}s` }}
            >
              <div
                onClick={() => handleCardClick('food-truck')}
                className="relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 shadow-md h-[140px] sm:h-[220px] md:h-[280px] hover:scale-105"
              >
                <Image
                  src="/images/food-truck-hero.webp"
                  alt="Betty Food Truck"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-3 sm:p-6 text-center">
                  <h3 className="font-oswald text-lg sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 tracking-wide drop-shadow-lg">
                    RESERVE OUR FOOD TRUCK
                  </h3>
                  <p className="text-white/90 text-xs sm:text-sm drop-shadow hidden sm:block">
                    For your next event — min. 40 guests
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurant Menu Link */}
      <section className="relative bg-[#1A1A1A] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/brisket-board.png"
            alt="Smoked brisket and ribs on cutting board"
            fill
            className="object-cover opacity-30"
          />
        </div>
        <div className="relative container mx-auto px-4 py-16 sm:py-24 text-center">
          <h3 className="font-oswald text-2xl sm:text-3xl font-bold text-[#F5EDE0] mb-3 tracking-wide">
            VISIT OUR RESTAURANT
          </h3>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">
            756 E. 111th St, Chicago IL 60628 — Dine in, carry out, or order for delivery.
          </p>
          <a
            href="https://www.lexingtonbetty.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#E8621A] text-white font-oswald font-bold px-8 py-3 rounded-lg hover:opacity-90 transition-all group"
          >
            <span>Restaurant Menu</span>
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}
