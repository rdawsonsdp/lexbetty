'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCatering } from '@/context/CateringContext';
import { CateringProduct } from '@/lib/types';
import { getDisplayPrice, getPricingTypeLabel } from '@/lib/pricing';
import Card from '@/components/ui/Card';
import DietaryFilterBar from '@/components/catering/DietaryFilterBar';
import { useActiveProducts } from '@/lib/hooks/useActiveProducts';

type Category = 'all' | 'breakfast' | 'lunch' | 'dessert';

const CATEGORIES: { id: Category; name: string; description: string }[] = [
  { id: 'all', name: 'All Products', description: 'Browse our complete menu' },
  { id: 'breakfast', name: 'Breakfast', description: 'Start your day right' },
  { id: 'lunch', name: 'Lunch & Dinner', description: 'Hearty meals for any occasion' },
  { id: 'dessert', name: 'Desserts', description: 'Sweet treats and delicious endings' },
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
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-cover"
        />
        {inCart && (
          <div className="absolute top-2 right-2 bg-[#dabb64] text-[#363333] text-xs font-bold px-2 py-1 rounded-full">
            In Cart
          </div>
        )}
      </div>
      <h3 className="font-oswald font-bold text-[#363333] text-lg mb-1 line-clamp-1">
        {product.title}
      </h3>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {product.description}
      </p>
      <div className="flex items-center justify-between mt-auto">
        <div>
          <p className="font-oswald font-bold text-[#dabb64] text-lg">
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
              : 'bg-[#363333] text-white hover:bg-[#dabb64] hover:text-[#363333]'
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
  const { state } = useCatering();
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
  };

  return (
    <div className="min-h-screen bg-[#f7efd7]">
      {/* Header */}
      <div className="bg-[#363333] py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Order Builder
          </Link>
          <h1 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-[#f7efd7] tracking-wider mb-2">
            FULL MENU
          </h1>
          <p className="text-[#dabb64] text-lg">
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
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dabb64]/50"
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
                      ? 'bg-[#363333] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-[#dabb64]/20'
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
        <div className="bg-[#dabb64] py-3">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <p className="font-oswald font-semibold text-[#363333]">
              {state.selectedItems.length} item{state.selectedItems.length !== 1 ? 's' : ''} in cart
            </p>
            <Link
              href="/#catering"
              className="bg-[#363333] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#4a4646] transition-colors"
            >
              View Cart
            </Link>
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
                  <h2 className="font-oswald text-2xl sm:text-3xl font-bold text-[#363333]">
                    Breakfast
                  </h2>
                  <div className="flex-1 h-px bg-[#dabb64]" />
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
                  <h2 className="font-oswald text-2xl sm:text-3xl font-bold text-[#363333]">
                    Lunch & Dinner
                  </h2>
                  <div className="flex-1 h-px bg-[#dabb64]" />
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
                  <h2 className="font-oswald text-2xl sm:text-3xl font-bold text-[#363333]">
                    Desserts
                  </h2>
                  <div className="flex-1 h-px bg-[#dabb64]" />
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
          </div>
        ) : (
          // Flat view for specific category
          <>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-oswald text-2xl sm:text-3xl font-bold text-[#363333]">
                {CATEGORIES.find((c) => c.id === activeCategory)?.name}
              </h2>
              <div className="flex-1 h-px bg-[#dabb64]" />
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
                  className="mt-4 text-[#dabb64] hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Back to Order Builder CTA */}
      <div className="bg-[#363333] py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="font-oswald text-2xl sm:text-3xl font-bold text-[#f7efd7] mb-4">
            Ready to finalize your order?
          </h3>
          <Link
            href="/#catering"
            className="inline-block bg-[#dabb64] text-[#363333] font-oswald font-bold px-8 py-3 rounded-lg hover:bg-[#f7efd7] transition-colors"
          >
            Return to Order Builder
          </Link>
        </div>
      </div>
    </div>
  );
}
