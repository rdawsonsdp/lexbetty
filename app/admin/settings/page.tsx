'use client';

import { useState, useEffect } from 'react';
import AdminAuthGate from '@/components/admin/AdminAuthGate';
import AdminNav from '@/components/admin/AdminNav';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface EmailSettings {
  email_enabled: boolean;
  email_subject_quote: string;
  email_subject_order: string;
  company_phone: string;
  company_email: string;
  company_address: string;
}

interface BusinessRule {
  id: string;
  name: string;
  description: string;
  value: number;
  unit: string;
  formula?: string;
  category?: string;
}

function authHeaders() {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('admin_token') : null;
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function SettingsPage() {
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testType, setTestType] = useState<'quote' | 'order'>('quote');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [disabledCategories, setDisabledCategories] = useState<string[]>([]);
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [ruleValue, setRuleValue] = useState<string>('');
  const [savingRule, setSavingRule] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch('/api/admin/email-settings')
      .then(r => r.json())
      .then(data => setEmailSettings(data))
      .catch(() => {});

    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.disabled_categories)) {
          setDisabledCategories(data.disabled_categories);
        }
      })
      .catch(() => {});

    fetch('/api/admin/rules', { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.rules)) {
          setRules(data.rules);
        }
      })
      .catch(() => {});
  }, []);

  const updateEmail = (field: keyof EmailSettings, value: string | boolean) => {
    if (!emailSettings) return;
    setEmailSettings({ ...emailSettings, [field]: value });
  };

  const handleSaveEmail = async () => {
    if (!emailSettings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/email-settings', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(emailSettings),
      });
      if (res.ok) {
        const updated = await res.json();
        setEmailSettings(updated);
        showToast('Email settings saved');
      } else {
        throw new Error();
      }
    } catch {
      showToast('Failed to save email settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ recipientEmail: testEmail, orderType: testType }),
      });
      if (res.ok) {
        setTestResult('Test email sent! Check your inbox (or console in dev mode).');
      } else {
        const data = await res.json();
        setTestResult(`Error: ${data.error}`);
      }
    } catch {
      setTestResult('Failed to send test email.');
    } finally {
      setTestSending(false);
    }
  };

  const handleSaveRule = async (ruleId: string) => {
    const numValue = parseFloat(ruleValue);
    if (isNaN(numValue) || numValue <= 0) {
      showToast('Value must be a positive number', 'error');
      return;
    }
    setSavingRule(true);
    const updated = rules.map(r => r.id === ruleId ? { ...r, value: numValue } : r);
    try {
      const res = await fetch('/api/admin/rules', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ rules: updated }),
      });
      if (!res.ok) throw new Error();
      setRules(updated);
      setEditingRule(null);
      showToast('Rule updated');
    } catch {
      showToast('Failed to save rule', 'error');
    } finally {
      setSavingRule(false);
    }
  };

  const ALL_CATEGORIES = ['breakfast', 'lunch', 'dessert', 'other'];

  const toggleCategory = async (cat: string) => {
    const isDisabled = disabledCategories.includes(cat);
    const updated = isDisabled
      ? disabledCategories.filter(c => c !== cat)
      : [...disabledCategories, cat];
    setDisabledCategories(updated);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ disabled_categories: updated }),
      });
      if (!res.ok) throw new Error();
      showToast(isDisabled ? `${cat} enabled` : `${cat} hidden from public`);
    } catch {
      setDisabledCategories(disabledCategories);
      showToast('Failed to update', 'error');
    }
  };

  if (!emailSettings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#E8621A] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="font-oswald text-3xl font-bold text-[#1A1A1A] tracking-wide mb-2">SETTINGS</h1>
        <p className="text-gray-500 mb-8">Manage email, category visibility, business rules, and store configuration</p>

        {/* ── Email Notifications ── */}
        <section className="mb-8">
          <h2 className="font-oswald text-lg font-bold text-[#1A1A1A] tracking-wide mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#E8621A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            EMAIL NOTIFICATIONS
          </h2>

          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#1A1A1A]">Enable Email Notifications</p>
                  <p className="text-sm text-gray-500">Send confirmation emails for quotes and orders</p>
                </div>
                <button
                  onClick={() => updateEmail('email_enabled', !emailSettings.email_enabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${emailSettings.email_enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${emailSettings.email_enabled ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-[#1A1A1A] mb-3">Subject Lines</h3>
              <p className="text-sm text-gray-500 mb-4">
                Use <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{'#{orderNumber}'}</code> for the order number.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quote Email Subject</label>
                  <input
                    type="text"
                    value={emailSettings.email_subject_quote}
                    onChange={e => updateEmail('email_subject_quote', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Email Subject</label>
                  <input
                    type="text"
                    value={emailSettings.email_subject_order}
                    onChange={e => updateEmail('email_subject_order', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
                  />
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-[#1A1A1A] mb-3">Company Contact (Email Footer)</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={emailSettings.company_phone}
                    onChange={e => updateEmail('company_phone', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={emailSettings.company_email}
                    onChange={e => updateEmail('company_email', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={emailSettings.company_address}
                    onChange={e => updateEmail('company_address', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
                  />
                </div>
              </div>
            </Card>

            <div className="flex items-center gap-3">
              <Button onClick={handleSaveEmail} disabled={saving}>
                {saving ? 'Saving...' : 'Save Email Settings'}
              </Button>
            </div>
          </div>
        </section>

        {/* ── Test Email ── */}
        <section className="mb-8">
          <Card>
            <h3 className="font-semibold text-[#1A1A1A] mb-3">Send Test Email</h3>
            <p className="text-sm text-gray-500 mb-4">
              Verify formatting. Without <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">RESEND_API_KEY</code>, output logs to server console.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="recipient@example.com"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
              />
              <select
                value={testType}
                onChange={e => setTestType(e.target.value as 'quote' | 'order')}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
              >
                <option value="quote">Quote</option>
                <option value="order">Order</option>
              </select>
              <Button onClick={handleSendTest} disabled={testSending || !testEmail}>
                {testSending ? 'Sending...' : 'Send Test'}
              </Button>
            </div>
            {testResult && (
              <p className={`mt-3 text-sm ${testResult.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {testResult}
              </p>
            )}
          </Card>
        </section>

        {/* ── Category Visibility ── */}
        <section className="mb-8">
          <h2 className="font-oswald text-lg font-bold text-[#1A1A1A] tracking-wide mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#E8621A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            CATEGORY VISIBILITY
          </h2>
          <Card>
            <p className="text-sm text-gray-500 mb-4">Control which menu categories are visible to customers on the public site.</p>
            <div className="space-y-3">
              {ALL_CATEGORIES.map(cat => {
                const isDisabled = disabledCategories.includes(cat);
                return (
                  <div key={cat} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-[#1A1A1A] capitalize">{cat}</p>
                      <p className="text-xs text-gray-400">{isDisabled ? 'Hidden from customers' : 'Visible to customers'}</p>
                    </div>
                    <button
                      onClick={() => toggleCategory(cat)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${!isDisabled ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${!isDisabled ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
        {/* ── Business Rules ── */}
        <section className="mb-8">
          <h2 className="font-oswald text-lg font-bold text-[#1A1A1A] tracking-wide mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#E8621A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            BUSINESS RULES
          </h2>
          <Card>
            <p className="text-sm text-gray-500 mb-4">
              Calculation rules used by the ordering system. These values drive the meat planner and portion recommendations.
            </p>

            {/* Group rules by category */}
            {(() => {
              const categories = Array.from(new Set(rules.map(r => r.category || 'General')));
              return categories.map(category => {
                const categoryRules = rules.filter(r => (r.category || 'General') === category);
                return (
                  <div key={category} className="mb-6 last:mb-0">
                    <h3 className="font-oswald text-xs tracking-[0.2em] text-[#9B9189] uppercase mb-3">
                      {category}
                    </h3>
                    <div className="space-y-3">
                      {categoryRules.map(rule => {
                        const isEditable = rule.unit !== '';
                        const isInfoOnly = !isEditable;

                        return (
                          <div key={rule.id} className={`border rounded-lg p-4 ${isInfoOnly ? 'border-dashed border-gray-200 bg-gray-50/50' : 'border-gray-200'}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-[#1A1A1A] flex items-center gap-2 flex-wrap">
                                  {rule.name}
                                  {isEditable && (
                                    <span className="text-xs bg-[#E8621A]/10 text-[#E8621A] px-2 py-0.5 rounded-full font-medium">
                                      {rule.value} {rule.unit}
                                    </span>
                                  )}
                                  {isInfoOnly && (
                                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                                      Info
                                    </span>
                                  )}
                                </h4>
                                <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                                {rule.formula && (
                                  <p className="text-xs text-gray-400 mt-2 font-mono bg-gray-50 px-2 py-1 rounded inline-block border border-gray-100">
                                    {rule.formula}
                                  </p>
                                )}
                              </div>
                              {isEditable && (
                                <>
                                  {editingRule === rule.id ? (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <input
                                        type="number"
                                        value={ruleValue}
                                        onChange={e => setRuleValue(e.target.value)}
                                        className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
                                        step="0.5"
                                        min="0"
                                      />
                                      <span className="text-xs text-gray-400 hidden sm:inline">{rule.unit}</span>
                                      <button
                                        onClick={() => handleSaveRule(rule.id)}
                                        disabled={savingRule}
                                        className="px-3 py-1.5 bg-[#E8621A] text-white text-sm rounded-lg hover:bg-[#d4570f] disabled:opacity-50"
                                      >
                                        {savingRule ? '...' : 'Save'}
                                      </button>
                                      <button
                                        onClick={() => setEditingRule(null)}
                                        className="px-3 py-1.5 text-gray-500 text-sm hover:text-gray-700"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => { setEditingRule(rule.id); setRuleValue(String(rule.value)); }}
                                      className="text-sm text-[#E8621A] hover:underline font-medium whitespace-nowrap flex-shrink-0"
                                    >
                                      Edit
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
            {rules.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No rules configured</p>
            )}
          </Card>
        </section>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPageWrapper() {
  return (
    <AdminAuthGate>
      <SettingsPage />
    </AdminAuthGate>
  );
}
