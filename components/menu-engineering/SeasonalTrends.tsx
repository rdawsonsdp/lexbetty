'use client';

import { useState } from 'react';
import { MONTHS } from '@/lib/sales-data';
import { formatCurrency } from '@/lib/pricing';
import {
  type ClassifiedProduct,
  formatMonthShort,
  getCategoryHeatmapData,
  getQuadrantColor,
} from '@/lib/menu-engineering';

interface SeasonalTrendsProps {
  products: ClassifiedProduct[];
}

export default function SeasonalTrends({ products }: SeasonalTrendsProps) {
  const [view, setView] = useState<'sparklines' | 'heatmap' | 'trends'>('sparklines');

  const heatmapData = getCategoryHeatmapData(products);

  const risingItems = products
    .filter((p) => p.trend === 'rising')
    .sort((a, b) => b.trendPct - a.trendPct)
    .slice(0, 8);

  const decliningItems = products
    .filter((p) => p.trend === 'declining')
    .sort((a, b) => a.trendPct - b.trendPct)
    .slice(0, 8);

  // Top products by revenue for sparklines
  const topProducts = [...products]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 12);

  return (
    <section className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl sm:text-2xl font-oswald font-semibold text-[#383838]">
          Seasonal Trends
        </h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['sparklines', 'heatmap', 'trends'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                view === v
                  ? 'bg-white text-[#383838] shadow-sm'
                  : 'text-gray-500 hover:text-[#383838]'
              }`}
            >
              {v === 'sparklines' ? 'Sparklines' : v === 'heatmap' ? 'Heatmap' : 'Rising / Declining'}
            </button>
          ))}
        </div>
      </div>

      {/* Sparklines View */}
      {view === 'sparklines' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left font-oswald font-medium text-gray-600 w-48">Product</th>
                  {MONTHS.map((m) => (
                    <th key={m} className="px-2 py-2 text-center font-oswald font-medium text-gray-600 w-16">
                      {formatMonthShort(m)}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-right font-oswald font-medium text-gray-600">Trend</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, idx) => {
                  const maxUnits = Math.max(
                    ...product.monthlyData.map((d) => d.revenue)
                  );

                  return (
                    <tr
                      key={product.productId}
                      className={`border-b border-gray-50 ${
                        idx % 2 === 0 ? '' : 'bg-gray-50/30'
                      }`}
                    >
                      <td className="px-4 py-2">
                        <div className="font-medium text-[#383838] truncate max-w-[180px]">
                          {product.title}
                        </div>
                        <div className="text-xs text-gray-400">{product.category}</div>
                      </td>
                      {product.monthlyData.map((md) => {
                        const pct = maxUnits > 0 ? (md.revenue / maxUnits) * 100 : 0;
                        return (
                          <td key={md.month} className="px-2 py-2">
                            <div className="flex items-end justify-center h-8">
                              <div
                                className="w-6 rounded-t transition-all"
                                style={{
                                  height: `${Math.max(4, pct)}%`,
                                  backgroundColor: getQuadrantColor(product.quadrant),
                                  opacity: 0.7 + (pct / 100) * 0.3,
                                }}
                                title={`${formatMonthShort(md.month)}: ${formatCurrency(md.revenue)}`}
                              />
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-2 text-right">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            product.trend === 'rising'
                              ? 'text-green-600'
                              : product.trend === 'declining'
                              ? 'text-red-600'
                              : 'text-gray-400'
                          }`}
                        >
                          {product.trend === 'rising' ? (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                          ) : product.trend === 'declining' ? (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          ) : (
                            <span>—</span>
                          )}
                          {product.trendPct > 0 ? '+' : ''}{product.trendPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Heatmap View */}
      {view === 'heatmap' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left font-oswald font-medium text-gray-600">Category</th>
                  {MONTHS.map((m) => (
                    <th key={m} className="px-3 py-2 text-center font-oswald font-medium text-gray-600">
                      {formatMonthShort(m)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row) => {
                  const maxVal = Math.max(...row.values);
                  return (
                    <tr key={row.category} className="border-t border-gray-100">
                      <td className="px-3 py-3 font-semibold text-[#383838] capitalize">
                        {row.category}
                      </td>
                      {row.values.map((val, idx) => {
                        const intensity = maxVal > 0 ? val / maxVal : 0;
                        return (
                          <td key={row.months[idx]} className="px-2 py-2 text-center">
                            <div
                              className="mx-auto rounded-lg w-full min-w-[50px] py-2 text-xs font-semibold transition-all"
                              style={{
                                backgroundColor: `rgba(218, 187, 100, ${0.1 + intensity * 0.7})`,
                                color: intensity > 0.5 ? '#383838' : '#B0B0B0',
                              }}
                              title={`${row.category} ${formatMonthShort(row.months[idx])}: ${formatCurrency(val)}`}
                            >
                              {val >= 1000 ? `$${(val / 1000).toFixed(0)}K` : `$${val}`}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rising vs Declining View */}
      {view === 'trends' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rising */}
          <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
            <div className="bg-green-50 px-4 py-3 border-b border-green-200">
              <h3 className="font-oswald font-semibold text-green-800 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Rising Items
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {risingItems.map((item) => (
                <div key={item.productId} className="px-4 py-2.5 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-[#383838] truncate">{item.title}</div>
                    <div className="text-xs text-gray-400">{item.category}</div>
                  </div>
                  <span className="text-sm font-bold text-green-600 ml-2">
                    +{item.trendPct}%
                  </span>
                </div>
              ))}
              {risingItems.length === 0 && (
                <div className="px-4 py-4 text-sm text-gray-400 text-center">No rising items</div>
              )}
            </div>
          </div>

          {/* Declining */}
          <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
            <div className="bg-red-50 px-4 py-3 border-b border-red-200">
              <h3 className="font-oswald font-semibold text-red-800 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
                Declining Items
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {decliningItems.map((item) => (
                <div key={item.productId} className="px-4 py-2.5 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-[#383838] truncate">{item.title}</div>
                    <div className="text-xs text-gray-400">{item.category}</div>
                  </div>
                  <span className="text-sm font-bold text-red-600 ml-2">
                    {item.trendPct}%
                  </span>
                </div>
              ))}
              {decliningItems.length === 0 && (
                <div className="px-4 py-4 text-sm text-gray-400 text-center">No declining items</div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
