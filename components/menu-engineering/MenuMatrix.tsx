'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/pricing';
import QuadrantBadge from './QuadrantBadge';
import {
  type ClassifiedProduct,
  type Quadrant,
  getQuadrantLabel,
  getQuadrantEmoji,
  getQuadrantColor,
  getQuadrantDescription,
} from '@/lib/menu-engineering';

interface MenuMatrixProps {
  products: ClassifiedProduct[];
}

const CATEGORIES = ['all', 'breakfast', 'lunch', 'dessert', 'beverage', 'snack'] as const;

export default function MenuMatrix({ products }: MenuMatrixProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedQuadrant, setExpandedQuadrant] = useState<Quadrant | null>(null);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  const filtered =
    selectedCategory === 'all'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const quadrants: Quadrant[] = ['star', 'plowhorse', 'puzzle', 'dog'];

  return (
    <section className="mb-8">
      <h2 className="text-xl sm:text-2xl font-oswald font-semibold text-[#1A1A1A] mb-4">
        Menu Engineering Matrix
      </h2>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-[#1A1A1A] text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#E8621A] hover:text-[#1A1A1A]'
            }`}
          >
            {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            <span className="ml-1 opacity-60">
              ({cat === 'all' ? products.length : products.filter((p) => p.category === cat).length})
            </span>
          </button>
        ))}
      </div>

      {/* Scatter Plot */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-4">
        <div className="relative w-full" style={{ paddingBottom: '60%', minHeight: 300 }}>
          <div className="absolute inset-0">
            {/* Quadrant backgrounds */}
            <div className="absolute top-0 left-1/2 right-0 bottom-1/2 bg-[#E8621A]/8 rounded-tr-lg" />
            <div className="absolute top-0 left-0 right-1/2 bottom-1/2 bg-[#4a90d9]/8 rounded-tl-lg" />
            <div className="absolute top-1/2 left-1/2 right-0 bottom-0 bg-[#e88c3a]/8 rounded-br-lg" />
            <div className="absolute top-1/2 left-0 right-1/2 bottom-0 bg-gray-100/50 rounded-bl-lg" />

            {/* Axis lines */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300" />

            {/* Quadrant Labels */}
            <div className="absolute top-2 right-2 sm:right-4 text-xs sm:text-sm font-oswald text-[#92750d]/60 font-semibold">
              STARS
            </div>
            <div className="absolute top-2 left-2 sm:left-4 text-xs sm:text-sm font-oswald text-[#4a90d9]/60 font-semibold">
              PUZZLES
            </div>
            <div className="absolute bottom-2 right-2 sm:right-4 text-xs sm:text-sm font-oswald text-[#e88c3a]/60 font-semibold">
              PLOWHORSES
            </div>
            <div className="absolute bottom-2 left-2 sm:left-4 text-xs sm:text-sm font-oswald text-gray-400/60 font-semibold">
              DOGS
            </div>

            {/* Axis labels */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-500 font-medium">
              Popularity →
            </div>
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-gray-500 font-medium whitespace-nowrap">
              Profitability →
            </div>

            {/* Data Points */}
            {filtered.map((product) => {
              const x = 5 + (product.popularityScore / 100) * 90;
              const y = 95 - (product.profitabilityScore / 100) * 90;
              const color = getQuadrantColor(product.quadrant);
              const isHovered = hoveredProduct === product.productId;

              return (
                <div
                  key={product.productId}
                  className="absolute transition-all duration-200"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: `translate(-50%, -50%) scale(${isHovered ? 1.8 : 1})`,
                    zIndex: isHovered ? 20 : 1,
                  }}
                  onMouseEnter={() => setHoveredProduct(product.productId)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <div
                    className="w-3 h-3 rounded-full border-2 border-white shadow-sm cursor-pointer"
                    style={{ backgroundColor: color }}
                  />
                  {isHovered && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1A1A1A] text-white px-3 py-2 rounded-lg shadow-lg text-xs whitespace-nowrap z-30 pointer-events-none">
                      <div className="font-semibold">{product.title}</div>
                      <div className="text-gray-300">
                        Rev: {formatCurrency(product.totalRevenue)} | Margin: {product.avgMarginPct}%
                      </div>
                      <div className="text-gray-300">
                        Units: {product.totalUnits} | Trend: {product.trend} ({product.trendPct > 0 ? '+' : ''}{product.trendPct}%)
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A1A1A]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quadrant Legend + Expandable Lists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quadrants.map((q) => {
          const items = filtered
            .filter((p) => p.quadrant === q)
            .sort((a, b) => b.totalRevenue - a.totalRevenue);
          const isExpanded = expandedQuadrant === q;

          return (
            <div
              key={q}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setExpandedQuadrant(isExpanded ? null : q)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getQuadrantColor(q) }}
                  />
                  <span className="font-oswald font-semibold text-[#1A1A1A]">
                    {getQuadrantEmoji(q)} {getQuadrantLabel(q)}s
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 hidden sm:inline">
                    {getQuadrantDescription(q)}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 max-h-64 overflow-y-auto">
                  {items.map((item, idx) => (
                    <div
                      key={item.productId}
                      className={`px-4 py-2 flex items-center justify-between text-sm ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[#1A1A1A] truncate">
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-400">
                          {item.category} &middot; {item.totalUnits} units
                        </div>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <div className="font-semibold text-[#1A1A1A]">
                          {formatCurrency(item.totalRevenue)}
                        </div>
                        <div className="text-xs text-gray-400">{item.avgMarginPct}% margin</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
