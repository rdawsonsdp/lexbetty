'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProductImagePlaceholder from '@/components/ui/ProductImagePlaceholder';
import { useCatering } from '@/context/CateringContext';
import { CateringProduct } from '@/lib/types';
import { getDisplayPrice, getPricingTypeLabel } from '@/lib/pricing';
import Card from '@/components/ui/Card';
import DietaryFilterBar from '@/components/catering/DietaryFilterBar';
import { useActiveProducts } from '@/lib/hooks/useActiveProducts';

type Category = 'all' | 'breakfast' | 'lunch' | 'dessert' | 'other';

const CATEGORIES: { id: Category; name: string; description: string }[] = [
  { id: 'all', name: 'All Products', description: 'Browse our complete menu' },
  { id: 'breakfast', name: 'Breakfast', description: 'Start your day right' },
  { id: 'lunch', name: 'Lunch & Dinner', description: 'Hearty meals for any occasion' },
  { id: 'dessert', name: 'Desserts', description: 'Sweet treats and delicious endings' },
  { id: 'other', name: 'Other', description: 'Additional items and services' },
];

function ProductCard({ product }: { product: CateringProduct }) {
  const { dispatch, isItemInCart } = useCatering();
  const inCart = isItemInCart(product.id);

  const handleAddToCart = () => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  return (
    <Card className="overflow-hidden" hover>
      <div className="relative h-40 -mx-4 -mt-4 mb-4">
        <ProductImagePlaceholder title={product.title} />
        {inCart && (
          <div className="absolute top-2 right-2 bg-[#E8621A] text-[#1A1A1A] text-xs font-bold px-2 py-1 rounded-full z-10">
            In Cart
          </div>
        )}
      </div>
      <h3 className="font-oswald font-bold text-[#1A1A1A] text-lg mb-1 line-clamp-1">
        {product.title}
      </h3>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {product.description}
      </p>
      <div className="flex items-center justify-between mt-auto">
        <div>
          <p className="font-oswald font-bold text-[#E8621A] text-lg">
            {getDisplayPrice(product)}
          </p>
          <p className="text-xs text-gray-500">
            {getPricingTypeLabel(product)}
          </p>
        </div>
        <button
          onClick={handleAddToCart}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            inCart
              ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              : 'bg-[#1A1A1A] text-white hover:bg-[#E8621A] hover:text-[#1A1A1A]'
          }`}
        >
          {inCart ? 'Add More' : 'Add'}
        </button>
      </div>
    </Card>
  );
}

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const { state, dispatch } = useCatering();
  const { activeProducts } = useActiveProducts();

  const handleToggleFilter = (tag: string) => {
    setActiveFilters(prev =>
      prev.includes(tag)
        ? prev.filter(f => f !== tag)
        : [...prev, tag]
    );
  };

  // Filter products by category, search, and dietary filters
  const filteredProducts = activeProducts.filter((product) => {
    const matchesCategory =
      activeCategory === 'all' || product.categories.includes(activeCategory as any);
    const matchesSearch =
      searchQuery === '' ||
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDietary = activeFilters.length === 0 ||
      activeFilters.every(f => product.tags?.includes(f));
    return matchesCategory && matchesSearch && matchesDietary;
  });

  // Group products by their primary category for "all" view
  const groupedProducts = {
    breakfast: filteredProducts.filter((p) => p.categories.includes('breakfast')),
    lunch: filteredProducts.filter((p) => p.categories.includes('lunch') && !p.categories.includes('breakfast')),
    dessert: filteredProducts.filter((p) => p.categories.includes('dessert') && !p.categories.includes('breakfast') && !p.categories.includes('lunch')),
    other: filteredProducts.filter((p) => p.categories.includes('other') && !p.categories.includes('breakfast') && !p.categories.includes('lunch') && !p.categories.includes('dessert')),
  };

  return (
    <div className="min-h-screen bg-[#F5EDE0]">
      {/* Header */}
      <div className="bg-[#1A1A1A] py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-[#F5EDE0] tracking-wider mb-2">
            FULL MENU
          </h1>
          <p className="text-[#E8621A] text-lg">
            Browse all {activeProducts.length} items from our catering menu
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg font-oswald font-semibold text-sm whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-[#E8621A]/20'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Filters */}
          <div className="mt-3">
            <DietaryFilterBar activeTags={activeFilters} onToggleTag={handleToggleFilter} />
          </div>
        </div>
      </div>

      {/* Cart Summary Bar */}
      {state.selectedItems.length > 0 && (
        <div className="bg-[#E8621A] py-3">
          <div className="container mx-auto px-4 flex items-center justify-between gap-4">
            <p className="font-oswald font-semibold text-[#1A1A1A]">
              {state.selectedItems.length} item{state.selectedItems.length !== 1 ? 's' : ''} in cart
            </p>
            <div className="flex items-center gap-3">
              {state.orderMode === 'alacarte' && (
                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1">
                  <label className="text-[#1A1A1A] text-xs font-semibold whitespace-nowrap">Guests:</label>
                  <input
                    type="number"
                    value={state.headcount}
                    onChange={(e) => dispatch({ type: 'SET_HEADCOUNT', payload: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-16 px-2 py-1 text-sm text-center border border-white/30 rounded bg-white/90 text-[#1A1A1A] font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              )}
              <Link
                href={state.orderMode === 'alacarte' ? '/checkout' : '/#catering'}
                className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#4a4646] transition-colors"
              >
                {state.orderMode === 'alacarte' ? 'Checkout' : 'View Cart'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        {activeCategory === 'all' ? (
          // Grouped view for "All Products"
          <div className="space-y-12">
            {/* Breakfast Section */}
            {groupedProducts.breakfast.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="font-oswald text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
                    Breakfast
                  </h2>
                  <div className="flex-1 h-px bg-[#E8621A]" />
                  <span className="text-sm text-gray-500">
                    {groupedProducts.breakfast.length} items
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {groupedProducts.breakfast.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {/* Lunch Section */}
            {groupedProducts.lunch.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="font-oswald text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
                    Lunch & Dinner
                  </h2>
                  <div className="flex-1 h-px bg-[#E8621A]" />
                  <span className="text-sm text-gray-500">
                    {groupedProducts.lunch.length} items
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {groupedProducts.lunch.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {/* Desserts Section */}
            {groupedProducts.dessert.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="font-oswald text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
                    Desserts
                  </h2>
                  <div className="flex-1 h-px bg-[#E8621A]" />
                  <span className="text-sm text-gray-500">
                    {groupedProducts.dessert.length} items
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {groupedProducts.dessert.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {/* Other Section */}
            {groupedProducts.other.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="font-oswald text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
                    Other
                  </h2>
                  <div className="flex-1 h-px bg-[#E8621A]" />
                  <span className="text-sm text-gray-500">
                    {groupedProducts.other.length} items
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {groupedProducts.other.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          // Flat view for specific category
          <>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-oswald text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
                {CATEGORIES.find((c) => c.id === activeCategory)?.name}
              </h2>
              <div className="flex-1 h-px bg-[#E8621A]" />
              <span className="text-sm text-gray-500">
                {filteredProducts.length} items
              </span>
            </div>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">No products found</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="mt-4 text-[#E8621A] hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="bg-[#1A1A1A] py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="font-oswald text-2xl sm:text-3xl font-bold text-[#F5EDE0] mb-4">
            {state.orderMode === 'alacarte' ? 'Ready to check out?' : 'Ready to finalize your order?'}
          </h3>
          <Link
            href={state.orderMode === 'alacarte' ? '/checkout' : '/#catering'}
            className="inline-block bg-[#E8621A] text-[#1A1A1A] font-oswald font-bold px-8 py-3 rounded-lg hover:bg-[#F5EDE0] transition-colors"
          >
            {state.orderMode === 'alacarte' ? 'Proceed to Checkout' : 'Return to Order Builder'}
          </Link>
        </div>
      </div>
    </div>
  );
}
