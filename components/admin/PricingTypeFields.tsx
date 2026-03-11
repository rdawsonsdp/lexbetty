'use client';

import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { ProductFormData } from '@/lib/product-schema';

interface PricingTypeFieldsProps {
  register: UseFormRegister<ProductFormData>;
  setValue: UseFormSetValue<ProductFormData>;
  watch: UseFormWatch<ProductFormData>;
}

const PRICING_TYPES = [
  { value: 'tray', label: 'Tray (S/M/L)' },
  { value: 'pan', label: 'Pan (Half/Full)' },
  { value: 'per-person', label: 'Per Person' },
  { value: 'per-dozen', label: 'Per Dozen' },
  { value: 'per-each', label: 'Per Each' },
  { value: 'per-container', label: 'Per Container' },
] as const;

const DEFAULT_TRAY_SIZES = [
  { size: 'small' as const, price: 0, servesMin: 10, servesMax: 15 },
  { size: 'medium' as const, price: 0, servesMin: 15, servesMax: 24 },
  { size: 'large' as const, price: 0, servesMin: 25, servesMax: 40 },
];

const DEFAULT_PAN_SIZES = [
  { size: 'half' as const, price: 0, servesMin: 10, servesMax: 15 },
  { size: 'full' as const, price: 0, servesMin: 20, servesMax: 25 },
];

export default function PricingTypeFields({ register, setValue, watch }: PricingTypeFieldsProps) {
  const pricingType = watch('pricing.type');
  const pricing = watch('pricing');

  const handleTypeChange = (type: string) => {
    switch (type) {
      case 'tray':
        setValue('pricing', { type: 'tray', sizes: DEFAULT_TRAY_SIZES });
        break;
      case 'pan':
        setValue('pricing', { type: 'pan', sizes: DEFAULT_PAN_SIZES });
        break;
      case 'per-person':
        setValue('pricing', { type: 'per-person', pricePerPerson: 0 });
        break;
      case 'per-dozen':
        setValue('pricing', { type: 'per-dozen', pricePerDozen: 0, servesPerDozen: 12 });
        break;
      case 'per-each':
        setValue('pricing', { type: 'per-each', priceEach: 0 });
        break;
      case 'per-container':
        setValue('pricing', { type: 'per-container', pricePerContainer: 0, servesPerContainer: 1 });
        break;
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Pricing Type</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PRICING_TYPES.map(pt => (
          <button
            key={pt.value}
            type="button"
            onClick={() => handleTypeChange(pt.value)}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
              pricingType === pt.value
                ? 'border-[#E8621A] bg-[#E8621A]/10 text-gray-900 font-medium'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {pt.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {pricingType === 'tray' && pricing.type === 'tray' && (
          <div className="space-y-2">
            {['small', 'medium', 'large'].map((size, i) => (
              <div key={size} className="grid grid-cols-4 gap-2 items-center">
                <span className="text-sm font-medium text-gray-600 capitalize">{size}</span>
                <div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    {...register(`pricing.sizes.${i}.price` as const, { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Min"
                    {...register(`pricing.sizes.${i}.servesMin` as const, { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Max"
                    {...register(`pricing.sizes.${i}.servesMax` as const, { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
                  />
                </div>
              </div>
            ))}
            <div className="grid grid-cols-4 gap-2 text-xs text-gray-400">
              <span>Size</span><span>Price ($)</span><span>Serves Min</span><span>Serves Max</span>
            </div>
          </div>
        )}

        {pricingType === 'pan' && pricing.type === 'pan' && (
          <div className="space-y-2">
            {['half', 'full'].map((size, i) => (
              <div key={size} className="grid grid-cols-4 gap-2 items-center">
                <span className="text-sm font-medium text-gray-600 capitalize">{size}</span>
                <div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    {...register(`pricing.sizes.${i}.price` as const, { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Min"
                    {...register(`pricing.sizes.${i}.servesMin` as const, { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Max"
                    {...register(`pricing.sizes.${i}.servesMax` as const, { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
                  />
                </div>
              </div>
            ))}
            <div className="grid grid-cols-4 gap-2 text-xs text-gray-400">
              <span>Size</span><span>Price ($)</span><span>Serves Min</span><span>Serves Max</span>
            </div>
          </div>
        )}

        {pricingType === 'per-person' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Price Per Person ($)</label>
              <input
                type="number"
                step="0.01"
                {...register('pricing.pricePerPerson' as const, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min Order (optional)</label>
              <input
                type="number"
                {...register('pricing.minOrder' as const, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>
          </div>
        )}

        {pricingType === 'per-dozen' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Price Per Dozen ($)</label>
              <input
                type="number"
                step="0.01"
                {...register('pricing.pricePerDozen' as const, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Serves Per Dozen</label>
              <input
                type="number"
                {...register('pricing.servesPerDozen' as const, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>
          </div>
        )}

        {pricingType === 'per-each' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Price Each ($)</label>
              <input
                type="number"
                step="0.01"
                {...register('pricing.priceEach' as const, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min Order (optional)</label>
              <input
                type="number"
                {...register('pricing.minOrder' as const, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>
          </div>
        )}

        {pricingType === 'per-container' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Price Per Container ($)</label>
              <input
                type="number"
                step="0.01"
                {...register('pricing.pricePerContainer' as const, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Serves Per Container</label>
              <input
                type="number"
                {...register('pricing.servesPerContainer' as const, { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
