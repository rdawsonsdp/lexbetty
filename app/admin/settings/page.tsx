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
        <p className="text-gray-500 mb-8">Manage email, category visibility, and store configuration</p>

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
