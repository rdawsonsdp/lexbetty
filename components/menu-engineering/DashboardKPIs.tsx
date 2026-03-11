'use client';

import { formatCurrency } from '@/lib/pricing';
import { getMonthlySummary, getCategorySummary } from '@/lib/sales-data';
import type { ClassifiedProduct } from '@/lib/menu-engineering';

interface DashboardKPIsProps {
  products: ClassifiedProduct[];
}

export default function DashboardKPIs({ products }: DashboardKPIsProps) {
  const monthlySummary = getMonthlySummary();
  const categorySummary = getCategorySummary();

  const totalRevenue = monthlySummary.reduce((s, m) => s + m.totalRevenue, 0);
  const totalProfit = monthlySummary.reduce((s, m) => s + m.totalProfit, 0);
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const topCategory = categorySummary[0]?.category || 'N/A';
  const productCount = products.length;

  // Month-over-month trend (last two months)
  const lastMonth = monthlySummary[monthlySummary.length - 1];
  const prevMonth = monthlySummary[monthlySummary.length - 2];
  const momChange = prevMonth
    ? ((lastMonth.totalRevenue - prevMonth.totalRevenue) / prevMonth.totalRevenue) * 100
    : 0;

  const kpis = [
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      sublabel: '6-month total',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Total Profit',
      value: formatCurrency(totalProfit),
      sublabel: '6-month gross profit',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: 'Overall Margin',
      value: `${overallMargin.toFixed(1)}%`,
      sublabel: 'Gross margin',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: 'Products',
      value: productCount.toString(),
      sublabel: 'Analyzed items',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
    {
      label: 'Top Category',
      value: topCategory.charAt(0).toUpperCase() + topCategory.slice(1),
      sublabel: `${formatCurrency(categorySummary[0]?.revenue || 0)} revenue`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
    {
      label: 'MoM Trend',
      value: `${momChange >= 0 ? '+' : ''}${momChange.toFixed(1)}%`,
      sublabel: `Feb → Mar 2026`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={momChange >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
        </svg>
      ),
      highlight: momChange >= 0 ? 'green' : 'red',
    },
  ];

  return (
    <section className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="text-[#B0B0B0]">{kpi.icon}</div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {kpi.label}
              </span>
            </div>
            <div
              className={`text-lg sm:text-xl font-bold font-oswald ${
                kpi.highlight === 'green'
                  ? 'text-green-600'
                  : kpi.highlight === 'red'
                  ? 'text-red-600'
                  : 'text-[#383838]'
              }`}
            >
              {kpi.value}
            </div>
            <div className="text-xs text-gray-400 mt-1">{kpi.sublabel}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
