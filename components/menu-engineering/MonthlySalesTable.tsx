'use client';

import { getMonthlySummary } from '@/lib/sales-data';
import { formatCurrency } from '@/lib/pricing';
import { formatMonth } from '@/lib/menu-engineering';

export default function MonthlySalesTable() {
  const summary = getMonthlySummary();

  return (
    <section className="mb-8">
      <h2 className="text-xl sm:text-2xl font-oswald font-semibold text-[#383838] mb-4">
        Monthly Sales Overview
      </h2>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#383838] text-white">
                <th className="px-4 py-3 text-left font-oswald font-medium tracking-wide">Month</th>
                <th className="px-4 py-3 text-right font-oswald font-medium tracking-wide">Revenue</th>
                <th className="px-4 py-3 text-right font-oswald font-medium tracking-wide">COGS</th>
                <th className="px-4 py-3 text-right font-oswald font-medium tracking-wide">Profit</th>
                <th className="px-4 py-3 text-right font-oswald font-medium tracking-wide">Margin</th>
                <th className="px-4 py-3 text-right font-oswald font-medium tracking-wide">Orders</th>
                <th className="px-4 py-3 text-right font-oswald font-medium tracking-wide">MoM</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row, idx) => {
                const prev = idx > 0 ? summary[idx - 1] : null;
                const momChange = prev
                  ? ((row.totalRevenue - prev.totalRevenue) / prev.totalRevenue) * 100
                  : 0;

                return (
                  <tr
                    key={row.month}
                    className={`border-b border-gray-100 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    } hover:bg-[#E8621A]/5 transition-colors`}
                  >
                    <td className="px-4 py-3 font-semibold text-[#383838]">
                      {formatMonth(row.month)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(row.totalRevenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {formatCurrency(row.totalCogs)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">
                      {formatCurrency(row.totalProfit)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          row.marginPct >= 70
                            ? 'bg-green-100 text-green-800'
                            : row.marginPct >= 65
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {row.marginPct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {row.totalOrders.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {idx === 0 ? (
                        <span className="text-gray-400">--</span>
                      ) : (
                        <span
                          className={`font-semibold ${
                            momChange >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {momChange >= 0 ? '+' : ''}
                          {momChange.toFixed(1)}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#383838]/5 font-semibold">
                <td className="px-4 py-3 text-[#383838]">Total</td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(summary.reduce((s, r) => s + r.totalRevenue, 0))}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">
                  {formatCurrency(summary.reduce((s, r) => s + r.totalCogs, 0))}
                </td>
                <td className="px-4 py-3 text-right text-green-700">
                  {formatCurrency(summary.reduce((s, r) => s + r.totalProfit, 0))}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-[#383838] text-white">
                    {(
                      (summary.reduce((s, r) => s + r.totalProfit, 0) /
                        summary.reduce((s, r) => s + r.totalRevenue, 0)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {summary.reduce((s, r) => s + r.totalOrders, 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-gray-400">--</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
