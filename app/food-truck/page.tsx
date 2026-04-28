'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCatering } from '@/context/CateringContext';
import { CATERING_PACKAGES } from '@/lib/packages';
import { formatCurrency } from '@/lib/pricing';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StepIndicator from '@/components/catering/StepIndicator';

const foodTruckPkg = CATERING_PACKAGES.find(p => p.id === 'betty-food-truck')!;

export default function FoodTruckPage() {
  const router = useRouter();
  const { state, dispatch } = useCatering();
  const [headcount, setHeadcountLocal] = useState(foodTruckPkg.minHeadcount || 40);

  const isInCart = state.selectedItems.some(item => item.product.id === foodTruckPkg.id);

  const total = headcount * foodTruckPkg.pricePerPerson;

  const setHeadcount = (value: number) => {
    setHeadcountLocal(Math.max(foodTruckPkg.minHeadcount || 40, value));
  };

  const handleAddToCart = () => {
    const productFromPackage = {
      id: foodTruckPkg.id,
      title: foodTruckPkg.title,
      description: `${headcount} guests x ${formatCurrency(foodTruckPkg.pricePerPerson)}/person\n${foodTruckPkg.items.join('\n')}`,
      image: foodTruckPkg.image || '',
      categories: foodTruckPkg.categories,
      pricing: {
        type: 'flat' as const,
        flatPrice: total,
      },
      tags: ['package', 'food-truck'],
      featured: false,
      isActive: true,
      sortPosition: 0,
    };

    if (isInCart) {
      dispatch({ type: 'REMOVE_ITEM', payload: foodTruckPkg.id });
    }

    dispatch({ type: 'ADD_ITEM', payload: productFromPackage });
    dispatch({ type: 'SET_HEADCOUNT', payload: headcount });
  };

  return (
    <div className="min-h-screen bg-[#F5EDE0]">
      <StepIndicator />

      {/* Hero */}
      <section className="relative h-[160px] sm:h-[250px] md:h-[350px] bg-black overflow-hidden">
        <Image
          src="/images/chef-dominique-ribs.jpg"
          alt="Betty Food Truck"
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="font-oswald text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-wider drop-shadow-lg">
            BETTY FOOD TRUCK
          </h1>
        </div>
      </section>

      {/* Package Card */}
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-2xl">
        <Card className="flex flex-col">
          {/* Image */}
          <div className="relative h-32 sm:h-48 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 mb-6 rounded-t-xl overflow-hidden bg-black">
            <Image
              src="/images/chef-dominique-ribs.jpg"
              alt="Betty Food Truck"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <h2 className="font-oswald text-xl text-[#E8621A] font-bold tracking-wide">
                BETTY FOOD TRUCK
              </h2>
            </div>
          </div>

          {/* Title & Description */}
          <h3 className="font-oswald text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-2 tracking-wide">
            {foodTruckPkg.title}
          </h3>
          <p className="text-gray-600 mb-6">{foodTruckPkg.description}</p>

          {/* Price */}
          <div className="mb-6 p-4 bg-[#F5EDE0] rounded-lg">
            <div className="flex items-baseline gap-1">
              <span className="font-oswald text-4xl font-bold text-[#1A1A1A]">
                {formatCurrency(foodTruckPkg.pricePerPerson)}
              </span>
              <span className="text-gray-500">/person</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Minimum {foodTruckPkg.minHeadcount} guests
            </p>
          </div>

          {/* Items List */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Includes:</p>
            <ul className="space-y-3">
              {foodTruckPkg.items.map((item, i) => (
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
                onClick={() => setHeadcount(headcount - 5)}
                className="w-10 h-10 rounded-full bg-[#F5EDE0] hover:bg-[#E8621A] hover:text-white text-[#1A1A1A] font-bold text-lg transition-colors flex items-center justify-center"
              >
                -
              </button>
              <input
                type="number"
                value={headcount}
                onChange={(e) => setHeadcount(parseInt(e.target.value) || foodTruckPkg.minHeadcount || 40)}
                className="w-20 h-10 text-center text-xl font-oswald font-bold border-2 border-[#1A1A1A] rounded-lg focus:ring-2 focus:ring-[#E8621A]/50 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min={foodTruckPkg.minHeadcount || 40}
              />
              <button
                onClick={() => setHeadcount(headcount + 5)}
                className="w-10 h-10 rounded-full bg-[#F5EDE0] hover:bg-[#E8621A] hover:text-white text-[#1A1A1A] font-bold text-lg transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Calculated Total */}
          <div className="mb-4 p-3 bg-[#1A1A1A] rounded-lg text-center">
            <p className="text-white text-sm">
              {headcount} people x {formatCurrency(foodTruckPkg.pricePerPerson)} =
            </p>
            <p className="font-oswald text-2xl font-bold text-[#E8621A]">
              {formatCurrency(total)}
            </p>
          </div>

          {/* Add to Cart */}
          <Button
            onClick={handleAddToCart}
            variant={isInCart ? 'secondary' : 'primary'}
            className="w-full"
          >
            {isInCart ? 'Update Cart' : 'Add to Cart'}
          </Button>

          {isInCart && (
            <p className="text-center text-sm text-[#E8621A] font-semibold mt-3">
              In cart
            </p>
          )}
        </Card>

        {/* Upsell CTAs */}
        <div className="mt-10 border-t border-gray-200 pt-8">
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
