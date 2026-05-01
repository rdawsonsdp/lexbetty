'use client';

import { useEffect, useMemo, useState } from 'react';
import { CateringProduct } from '@/lib/types';
import { formatCurrency, getDisplayPrice } from '@/lib/pricing';

interface OrderItem {
  productId: string;
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedSize: string;
  displayText: string;
  servesMin?: number;
  servesMax?: number;
}

interface MenuPickerProps {
  onAdd: (item: OrderItem) => void;
  existingProductIds?: string[];
}

const CATEGORIES = [
  { id: 'all', label: 'All', tag: null as string | null },
  { id: 'meats', label: 'Meats', tag: 'meats' },
  { id: 'sliders', label: 'Sliders', tag: 'sliders' },
  { id: 'sides', label: 'Sides', tag: 'sides' },
  { id: 'dessert', label: 'Desserts', tag: 'dessert' },
  { id: 'beverage', label: 'Drinks', tag: 'beverage' },
  { id: 'condiments', label: 'Extras', tag: 'condiments' },
];

const EXCLUDED_TAGS = ['equipment', 'cutlery', 'service'];

function buildOrderItem(
  product: CateringProduct,
  size?: 'small' | 'medium' | 'large' | 'half' | 'full'
): OrderItem | null {
  const pricing = product.pricing;
  const base = {
    productId: product.id,
    title: product.title,
    description: product.description,
    quantity: 1,
  };

  switch (pricing.type) {
    case 'tray': {
      const opt = pricing.sizes.find((s) => s.size === size);
      if (!opt) return null;
      const label = opt.size.charAt(0).toUpperCase() + opt.size.slice(1);
      return {
        ...base,
        unitPrice: opt.price,
        totalPrice: opt.price,
        selectedSize: opt.size,
        displayText: `${label} Tray (serves ${opt.servesMin}-${opt.servesMax})`,
        servesMin: opt.servesMin,
        servesMax: opt.servesMax,
      };
    }
    case 'pan': {
      const opt = pricing.sizes.find((s) => s.size === size);
      if (!opt) return null;
      const label = opt.size === 'half' ? 'Half Pan' : 'Full Pan';
      return {
        ...base,
        unitPrice: opt.price,
        totalPrice: opt.price,
        selectedSize: opt.size,
        displayText: `${label} (serves ${opt.servesMin}-${opt.servesMax})`,
        servesMin: opt.servesMin,
        servesMax: opt.servesMax,
      };
    }
    case 'per-person':
      return {
        ...base,
        unitPrice: pricing.pricePerPerson,
        totalPrice: pricing.pricePerPerson,
        selectedSize: '',
        displayText: `${formatCurrency(pricing.pricePerPerson)} per person`,
      };
    case 'per-dozen':
      return {
        ...base,
        unitPrice: pricing.pricePerDozen,
        totalPrice: pricing.pricePerDozen,
        selectedSize: '',
        displayText: `1 dozen (serves ${pricing.servesPerDozen})`,
        servesMin: pricing.servesPerDozen,
        servesMax: pricing.servesPerDozen,
      };
    case 'per-each': {
      const unitLabel = pricing.unit === 'lb' ? 'lb' : 'each';
      return {
        ...base,
        unitPrice: pricing.priceEach,
        totalPrice: pricing.priceEach,
        selectedSize: '',
        displayText: `1 @ ${formatCurrency(pricing.priceEach)}/${unitLabel}`,
      };
    }
    case 'per-lb':
      return {
        ...base,
        unitPrice: pricing.pricePerLb,
        totalPrice: pricing.pricePerLb,
        selectedSize: '',
        displayText: `1 lb @ ${formatCurrency(pricing.pricePerLb)}/lb`,
      };
    case 'per-container': {
      const spc = pricing.servesPerContainer;
      return {
        ...base,
        unitPrice: pricing.pricePerContainer,
        totalPrice: pricing.pricePerContainer,
        selectedSize: '',
        displayText: `1 container (serves ${spc})`,
        servesMin: spc,
        servesMax: spc,
      };
    }
    case 'flat':
      return {
        ...base,
        unitPrice: pricing.flatPrice,
        totalPrice: pricing.flatPrice,
        selectedSize: '',
        displayText: `${formatCurrency(pricing.flatPrice)} flat rate`,
      };
    default:
      return null;
  }
}

function ProductCard({
  product,
  alreadyAdded,
  onAdd,
}: {
  product: CateringProduct;
  alreadyAdded: boolean;
  onAdd: (item: OrderItem) => void;
}) {
  const [pickingSize, setPickingSize] = useState(false);
  const pricing = product.pricing;
  const needsSize = pricing.type === 'tray' || pricing.type === 'pan';

  const handleAddDirect = () => {
    const item = buildOrderItem(product);
    if (item) onAdd(item);
  };

  const handlePickSize = (size: 'small' | 'medium' | 'large' | 'half' | 'full') => {
    const item = buildOrderItem(product, size);
    if (item) {
      onAdd(item);
      setPickingSize(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-[#F5EDE0] flex items-center justify-center">
          <span className="text-[#E8621A] text-xl font-oswald font-bold">
            {product.title.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-oswald font-bold text-sm text-[#1A1A1A] tracking-wide leading-tight truncate">
                {product.title}
              </h4>
              {product.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{product.description}</p>
              )}
              <p className="text-xs font-semibold text-[#E8621A] mt-1">{getDisplayPrice(product)}</p>
            </div>
            {alreadyAdded ? (
              <span className="flex-shrink-0 px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold uppercase tracking-wide">
                Added
              </span>
            ) : !pickingSize ? (
              <button
                type="button"
                onClick={() => (needsSize ? setPickingSize(true) : handleAddDirect())}
                className="flex-shrink-0 px-3 py-1.5 bg-[#1A1A1A] text-white text-xs font-oswald font-bold rounded-lg hover:bg-[#E8621A] transition-colors tracking-wide"
              >
                Add
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPickingSize(false)}
                className="flex-shrink-0 px-2 py-1.5 text-xs text-gray-500 hover:text-[#1A1A1A]"
              >
                Cancel
              </button>
            )}
          </div>

          {pickingSize && pricing.type === 'tray' && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {pricing.sizes.map((s) => {
                const label = s.size.charAt(0).toUpperCase() + s.size.slice(1);
                return (
                  <button
                    key={s.size}
                    type="button"
                    onClick={() => handlePickSize(s.size)}
                    className="px-2.5 py-1 border border-[#E8621A] text-[#E8621A] hover:bg-[#E8621A] hover:text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {label} · {formatCurrency(s.price)}
                  </button>
                );
              })}
            </div>
          )}

          {pickingSize && pricing.type === 'pan' && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {pricing.sizes.map((s) => {
                const label = s.size === 'half' ? 'Half Pan' : 'Full Pan';
                return (
                  <button
                    key={s.size}
                    type="button"
                    onClick={() => handlePickSize(s.size)}
                    className="px-2.5 py-1 border border-[#E8621A] text-[#E8621A] hover:bg-[#E8621A] hover:text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {label} · {formatCurrency(s.price)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MenuPicker({ onAdd, existingProductIds = [] }: MenuPickerProps) {
  const [products, setProducts] = useState<CateringProduct[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/catering-products')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load menu');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setProducts((data.products as CateringProduct[]) || []);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || 'Failed to load menu');
        setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!products) return [];
    const term = search.trim().toLowerCase();
    const activeTag = CATEGORIES.find((c) => c.id === activeCategory)?.tag ?? null;

    return products.filter((p) => {
      if (EXCLUDED_TAGS.some((t) => p.tags?.includes(t))) return false;
      if (activeTag && !p.tags?.includes(activeTag)) return false;
      if (term) {
        const haystack = [
          p.title,
          p.description,
          ...(p.tags || []),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [products, search, activeCategory]);

  const existingSet = useMemo(() => new Set(existingProductIds), [existingProductIds]);

  return (
    <div className="bg-[#F5EDE0]/40 rounded-xl border border-gray-200 shadow-sm flex flex-col max-h-[calc(100vh-8rem)] overflow-hidden">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-3 space-y-2">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E8621A]/30 focus:border-[#E8621A]"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="text-center py-12 text-sm text-gray-500">Loading menu...</div>
        ) : error ? (
          <div className="text-center py-12 text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm font-medium text-gray-500">No items found</p>
            <p className="text-xs text-gray-400 mt-1">
              {search ? 'Try a different search term' : 'No products in this category'}
            </p>
          </div>
        ) : (
          filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              alreadyAdded={existingSet.has(p.id)}
              onAdd={onAdd}
            />
          ))
        )}
      </div>
    </div>
  );
}
