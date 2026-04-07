'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminAuthGate from '@/components/admin/AdminAuthGate';
import AdminNav from '@/components/admin/AdminNav';
import { formatCurrency } from '@/lib/pricing';

// ── Types ──────────────────────────────────────────────

interface Customer {
  email: string;
  name: string;
  phone: string | null;
  company: string | null;
  total_orders: number;
  total_spent: number;
  first_order: string;
  last_order: string;
}

type SortColumn = 'name' | 'email' | 'total_orders' | 'total_spent' | 'last_order';

// ── Helpers ────────────────────────────────────────────

function getToken(): string {
  return sessionStorage.getItem('admin_token') ?? '';
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildCsvContent(customers: Customer[]): string {
  const headers = ['Name', 'Email', 'Phone', 'Company', 'Total Orders', 'Total Spent', 'First Order', 'Last Order'];
  const rows = customers.map(c => [
    escapeCsvField(c.name),
    escapeCsvField(c.email),
    escapeCsvField(c.phone || ''),
    escapeCsvField(c.company || ''),
    String(c.total_orders),
    c.total_spent.toFixed(2),
    formatDate(c.first_order),
    formatDate(c.last_order),
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}

function buildExcelXml(customers: Customer[]): string {
  // Generate an Excel-compatible XML spreadsheet
  const escXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const headers = ['Name', 'Email', 'Phone', 'Company', 'Total Orders', 'Total Spent', 'First Order', 'Last Order'];

  let rows = '';
  // Header row
  rows += '<Row>';
  headers.forEach(h => {
    rows += `<Cell><Data ss:Type="String">${escXml(h)}</Data></Cell>`;
  });
  rows += '</Row>\n';

  // Data rows
  customers.forEach(c => {
    rows += '<Row>';
    rows += `<Cell><Data ss:Type="String">${escXml(c.name)}</Data></Cell>`;
    rows += `<Cell><Data ss:Type="String">${escXml(c.email)}</Data></Cell>`;
    rows += `<Cell><Data ss:Type="String">${escXml(c.phone || '')}</Data></Cell>`;
    rows += `<Cell><Data ss:Type="String">${escXml(c.company || '')}</Data></Cell>`;
    rows += `<Cell><Data ss:Type="Number">${c.total_orders}</Data></Cell>`;
    rows += `<Cell><Data ss:Type="Number">${c.total_spent.toFixed(2)}</Data></Cell>`;
    rows += `<Cell><Data ss:Type="String">${escXml(formatDate(c.first_order))}</Data></Cell>`;
    rows += `<Cell><Data ss:Type="String">${escXml(formatDate(c.last_order))}</Data></Cell>`;
    rows += '</Row>\n';
  });

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
<Style ss:ID="header"><Font ss:Bold="1"/></Style>
</Styles>
<Worksheet ss:Name="Customers">
<Table>
<Column ss:Width="150"/>
<Column ss:Width="220"/>
<Column ss:Width="130"/>
<Column ss:Width="160"/>
<Column ss:Width="90"/>
<Column ss:Width="100"/>
<Column ss:Width="110"/>
<Column ss:Width="110"/>
${rows}
</Table>
</Worksheet>
</Workbook>`;
}

// ── Component ─────────────────────────────────────────

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<SortColumn>('last_order');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/customers', { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load customers');
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // Filter
  const filtered = customers.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    );
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortCol) {
      case 'name': cmp = a.name.localeCompare(b.name); break;
      case 'email': cmp = a.email.localeCompare(b.email); break;
      case 'total_orders': cmp = a.total_orders - b.total_orders; break;
      case 'total_spent': cmp = a.total_spent - b.total_spent; break;
      case 'last_order': cmp = a.last_order.localeCompare(b.last_order); break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function toggleSort(col: SortColumn) {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir(col === 'name' || col === 'email' ? 'asc' : 'desc');
    }
  }

  function sortIndicator(col: SortColumn) {
    if (sortCol !== col) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  }

  function handleExportCSV() {
    const csv = buildCsvContent(sorted);
    downloadFile(csv, `lexington-betty-customers-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
  }

  function handleExportExcel() {
    const xml = buildExcelXml(sorted);
    downloadFile(xml, `lexington-betty-customers-${new Date().toISOString().slice(0, 10)}.xls`, 'application/vnd.ms-excel');
  }

  return (
    <AdminAuthGate>
      <div className="min-h-screen bg-[#1A1A1A]">
        <AdminNav />

        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-oswald text-2xl text-white tracking-wide">Customers</h1>
              <p className="text-white/50 text-sm mt-1">
                {loading ? 'Loading...' : `${filtered.length} customer${filtered.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                disabled={loading || sorted.length === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSV
              </button>
              <button
                onClick={handleExportExcel}
                disabled={loading || sorted.length === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[#E8621A] text-white hover:bg-[#d4570f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name, email, company, or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-80 px-4 py-2.5 rounded-lg bg-white/10 text-white placeholder-white/40 border border-white/10 focus:border-[#E8621A] focus:outline-none text-sm"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#E8621A] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Table (desktop) */}
          {!loading && sorted.length > 0 && (
            <>
              <div className="hidden md:block bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      {([
                        ['name', 'Name'],
                        ['email', 'Email'],
                        ['total_orders', 'Orders'],
                        ['total_spent', 'Total Spent'],
                        ['last_order', 'Last Order'],
                      ] as [SortColumn, string][]).map(([col, label]) => (
                        <th
                          key={col}
                          onClick={() => toggleSort(col)}
                          className="px-4 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
                        >
                          {label}{sortIndicator(col)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sorted.map(c => (
                      <tr key={c.email} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-sm text-white font-medium">{c.name}</div>
                          {c.company && (
                            <div className="text-xs text-white/40 mt-0.5">{c.company}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <a href={`mailto:${c.email}`} className="text-sm text-[#E8621A] hover:underline">
                            {c.email}
                          </a>
                          {c.phone && (
                            <div className="text-xs text-white/40 mt-0.5">{c.phone}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#E8621A]/15 text-[#E8621A] text-sm font-semibold">
                            {c.total_orders}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-white/80">
                          {formatCurrency(c.total_spent)}
                        </td>
                        <td className="px-4 py-3 text-sm text-white/50">
                          {formatDate(c.last_order)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards (mobile) */}
              <div className="md:hidden space-y-3">
                {sorted.map(c => (
                  <div key={c.email} className="bg-white/5 rounded-xl border border-white/10 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-white font-medium">{c.name}</div>
                        {c.company && <div className="text-xs text-white/40">{c.company}</div>}
                      </div>
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#E8621A]/15 text-[#E8621A] text-sm font-semibold">
                        {c.total_orders}
                      </span>
                    </div>
                    <a href={`mailto:${c.email}`} className="text-sm text-[#E8621A] hover:underline block mb-1">
                      {c.email}
                    </a>
                    {c.phone && <div className="text-xs text-white/40 mb-2">{c.phone}</div>}
                    <div className="flex justify-between text-xs text-white/50 pt-2 border-t border-white/10">
                      <span>Spent: {formatCurrency(c.total_spent)}</span>
                      <span>Last: {formatDate(c.last_order)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Empty state */}
          {!loading && sorted.length === 0 && !error && (
            <div className="text-center py-20">
              <div className="text-white/30 text-5xl mb-4">👥</div>
              <p className="text-white/50">
                {search ? 'No customers match your search.' : 'No customers yet. Orders will appear here.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminAuthGate>
  );
}
