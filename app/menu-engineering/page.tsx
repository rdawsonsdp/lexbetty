'use client';

import { useMemo } from 'react';
import { classifyProducts, generateRecommendations, getQuadrantSummary, getQuadrantColor, getQuadrantLabel, getQuadrantEmoji } from '@/lib/menu-engineering';
import { formatCurrency } from '@/lib/pricing';
import DashboardKPIs from '@/components/menu-engineering/DashboardKPIs';
import MonthlySalesTable from '@/components/menu-engineering/MonthlySalesTable';
import MenuMatrix from '@/components/menu-engineering/MenuMatrix';
import SeasonalTrends from '@/components/menu-engineering/SeasonalTrends';
import RecommendedUpdates from '@/components/menu-engineering/RecommendedUpdates';

export default function MenuEngineeringPage() {
  const products = useMemo(() => classifyProducts(), []);
  const recommendations = useMemo(() => generateRecommendations(products), [products]);
  const quadrantSummary = useMemo(() => getQuadrantSummary(products), [products]);

  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      {/* Hero Header */}
      <section className="bg-[#383838] text-white py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-oswald font-bold mb-2">
              Menu Engineering Dashboard
            </h1>
            <p className="text-gray-300 text-sm sm:text-base mb-4 max-w-2xl">
              Analyze product performance across the Star/Plowhorse/Puzzle/Dog matrix.
              Review AI-generated recommendations to optimize your menu for profit and popularity.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-sm">
                <svg className="w-4 h-4 text-[#E8621A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Oct 2025 – Mar 2026
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-sm">
                <svg className="w-4 h-4 text-[#E8621A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {products.length} Products Analyzed
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-sm">
                <svg className="w-4 h-4 text-[#E8621A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {recommendations.length} Recommendations
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quadrant Quick Stats */}
      <section className="bg-[#383838] border-t border-white/10 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quadrantSummary.map((qs) => (
              <div
                key={qs.quadrant}
                className="rounded-xl p-3 sm:p-4 border"
                style={{
                  backgroundColor: `${getQuadrantColor(qs.quadrant)}15`,
                  borderColor: `${getQuadrantColor(qs.quadrant)}40`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getQuadrantEmoji(qs.quadrant)}</span>
                  <span className="font-oswald font-semibold text-white text-sm">
                    {getQuadrantLabel(qs.quadrant)}s
                  </span>
                  <span
                    className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${getQuadrantColor(qs.quadrant)}30`,
                      color: getQuadrantColor(qs.quadrant),
                    }}
                  >
                    {qs.count}
                  </span>
                </div>
                <div className="text-white text-base sm:text-lg font-bold font-oswald">
                  {formatCurrency(qs.totalRevenue)}
                </div>
                <div className="text-gray-400 text-xs">
                  {qs.avgMargin}% avg margin
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <DashboardKPIs products={products} />
        <MonthlySalesTable />
        <MenuMatrix products={products} />
        <SeasonalTrends products={products} />
        <RecommendedUpdates recommendations={recommendations} />
      </div>
    </div>
  );
}
