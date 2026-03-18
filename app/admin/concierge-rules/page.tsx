'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Rule {
  id: string;
  category: string;
  rule: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'portions', label: 'Portions', description: 'How much food to recommend per person' },
  { value: 'pricing', label: 'Pricing', description: 'Minimum orders, discounts, fees' },
  { value: 'policies', label: 'Policies', description: 'Advance notice, deposits, cancellations' },
  { value: 'service', label: 'Service', description: 'Setup, delivery, service area' },
  { value: 'custom', label: 'Custom', description: 'Any other instructions for Betty' },
];

function getCategoryColor(cat: string): string {
  switch (cat) {
    case 'portions': return 'bg-blue-100 text-blue-700';
    case 'pricing': return 'bg-green-100 text-green-700';
    case 'policies': return 'bg-yellow-100 text-yellow-700';
    case 'service': return 'bg-purple-100 text-purple-700';
    case 'custom': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function ConciergeRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // New rule form
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState('portions');
  const [newRule, setNewRule] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Auth check
  useEffect(() => {
    const token = sessionStorage.getItem('admin-token');
    if (token) {
      setAuthToken(token);
      fetchRules(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchRules = async (token: string) => {
    try {
      const res = await fetch('/api/admin/concierge-rules', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch rules');
      const data = await res.json();
      setRules(data.rules || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (password: string) => {
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error('Invalid password');
      const data = await res.json();
      sessionStorage.setItem('admin-token', data.token);
      setAuthToken(data.token);
      fetchRules(data.token);
    } catch {
      setError('Invalid password');
    }
  };

  const handleCreate = async () => {
    if (!newRule.trim() || !authToken) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/concierge-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ category: newCategory, rule: newRule.trim() }),
      });
      if (!res.ok) throw new Error('Failed to create rule');
      const data = await res.json();
      setRules(prev => [...prev, data.rule]);
      setNewRule('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rule: Rule) => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/admin/concierge-rules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ id: rule.id, active: !rule.active }),
      });
      if (!res.ok) throw new Error('Failed to update rule');
      setRules(prev =>
        prev.map(r => (r.id === rule.id ? { ...r, active: !r.active } : r))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle rule');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !authToken) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/concierge-rules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          id: editingId,
          rule: editText.trim(),
          category: editCategory,
        }),
      });
      if (!res.ok) throw new Error('Failed to update rule');
      const data = await res.json();
      setRules(prev =>
        prev.map(r => (r.id === editingId ? data.rule : r))
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save edit');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!authToken || !confirm('Delete this rule?')) return;
    try {
      const res = await fetch(`/api/admin/concierge-rules?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('Failed to delete rule');
      setRules(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
    }
  };

  // Login screen
  if (!authToken) {
    return (
      <div className="min-h-screen bg-[#F5EDE0] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm w-full">
          <h1 className="font-oswald text-2xl font-bold text-[#1A1A1A] mb-6">Admin Login</h1>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const pw = (form.elements.namedItem('password') as HTMLInputElement).value;
              handleLogin(pw);
            }}
          >
            <input
              name="password"
              type="password"
              placeholder="Admin password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
            />
            <button
              type="submit"
              className="w-full bg-[#1A1A1A] text-white font-oswald font-bold py-3 rounded-lg hover:bg-[#E8621A] transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Group rules by category
  const groupedRules: Record<string, Rule[]> = {};
  rules.forEach(r => {
    if (!groupedRules[r.category]) groupedRules[r.category] = [];
    groupedRules[r.category].push(r);
  });

  return (
    <div className="min-h-screen bg-[#F5EDE0]">
      {/* Header */}
      <div className="bg-[#1A1A1A] py-6">
        <div className="container mx-auto px-4">
          <Link
            href="/admin/menu"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-3 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Admin
          </Link>
          <h1 className="font-oswald text-3xl font-bold text-[#F5EDE0] tracking-wider">
            BETTY&apos;S BUSINESS RULES
          </h1>
          <p className="text-white/60 mt-1">
            These rules tell Betty how to build orders — portions, pricing, policies
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Info banner */}
        <div className="bg-[#E8621A]/10 border border-[#E8621A]/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-[#1A1A1A]">
            <strong>How it works:</strong> Active rules are injected into Betty&apos;s AI instructions on every customer conversation.
            When you update a rule here, Betty immediately follows the new guidance. Write rules in plain English.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-6">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-bold">Dismiss</button>
          </div>
        )}

        {/* Add Rule Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-oswald text-xl font-bold text-[#1A1A1A]">
            {rules.length} Rule{rules.length !== 1 ? 's' : ''}
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#E8621A] text-white font-oswald font-bold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Rule
          </button>
        </div>

        {/* New Rule Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="font-oswald text-lg font-bold text-[#1A1A1A] mb-4">New Rule</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label} — {cat.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule (write in plain English — Betty will follow this exactly)
                </label>
                <textarea
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  rows={3}
                  placeholder="e.g., For meats sold by the pound, recommend 0.33 lbs per person."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  disabled={!newRule.trim() || saving}
                  className="bg-[#1A1A1A] text-white font-oswald font-bold px-6 py-2 rounded-lg hover:bg-[#E8621A] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Rule'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setNewRule(''); }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading rules...</div>
        ) : (
          /* Rules grouped by category */
          <div className="space-y-6">
            {CATEGORIES.map(cat => {
              const catRules = groupedRules[cat.value];
              if (!catRules || catRules.length === 0) return null;

              return (
                <div key={cat.value}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getCategoryColor(cat.value)}`}>
                      {cat.label}
                    </span>
                    <span className="text-xs text-gray-400">{cat.description}</span>
                  </div>

                  <div className="space-y-2">
                    {catRules.map(rule => (
                      <div
                        key={rule.id}
                        className={`bg-white rounded-xl border p-4 transition-colors ${
                          rule.active ? 'border-gray-200' : 'border-gray-100 opacity-50'
                        }`}
                      >
                        {editingId === rule.id ? (
                          /* Edit mode */
                          <div className="space-y-3">
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
                            >
                              {CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                              ))}
                            </select>
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="text-sm bg-[#1A1A1A] text-white px-4 py-1.5 rounded-lg hover:bg-[#E8621A] transition-colors disabled:opacity-50"
                              >
                                {saving ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-sm px-4 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Display mode */
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-sm text-[#1A1A1A] flex-1">{rule.rule}</p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Toggle active */}
                              <button
                                onClick={() => handleToggle(rule)}
                                className={`relative w-10 h-5 rounded-full transition-colors ${
                                  rule.active ? 'bg-[#E8621A]' : 'bg-gray-300'
                                }`}
                                title={rule.active ? 'Active — click to disable' : 'Disabled — click to enable'}
                              >
                                <span
                                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                                    rule.active ? 'left-5' : 'left-0.5'
                                  }`}
                                />
                              </button>
                              {/* Edit */}
                              <button
                                onClick={() => {
                                  setEditingId(rule.id);
                                  setEditText(rule.rule);
                                  setEditCategory(rule.category);
                                }}
                                className="text-gray-400 hover:text-[#E8621A] transition-colors p-1"
                                title="Edit rule"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(rule.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                title="Delete rule"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
