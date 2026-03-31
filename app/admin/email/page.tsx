'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminAuthGate from '@/components/admin/AdminAuthGate';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface EmailSettings {
  email_enabled: boolean;
  email_subject_quote: string;
  email_subject_order: string;
  company_phone: string;
  company_email: string;
  company_address: string;
  notification_emails: string;
}

function authHeaders() {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('admin_token') : null;
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function EmailSettingsPage() {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testType, setTestType] = useState<'quote' | 'order'>('quote');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/email-settings')
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/email-settings', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // ignore
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

  const update = (field: keyof EmailSettings, value: string | boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#F5EDE0] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#E8621A] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5EDE0]">
      {/* Header */}
      <div className="bg-[#1A1A1A] py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/admin/menu"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Menu Admin
          </Link>
          <h1 className="font-oswald text-3xl sm:text-4xl font-bold text-[#F5EDE0] tracking-wider">
            EMAIL SETTINGS
          </h1>
          <p className="text-white/60 mt-1">Manage email notifications for quotes and orders</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* Enable / Disable */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-oswald text-xl font-bold text-[#1A1A1A]">Email Notifications</h2>
              <p className="text-sm text-gray-500 mt-1">Send confirmation emails when customers submit a quote or order</p>
            </div>
            <button
              onClick={() => update('email_enabled', !settings.email_enabled)}
              className={`relative w-14 h-7 rounded-full transition-colors ${settings.email_enabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${settings.email_enabled ? 'translate-x-7' : ''}`} />
            </button>
          </div>
        </Card>

        {/* Subject Lines */}
        <Card>
          <h2 className="font-oswald text-xl font-bold text-[#1A1A1A] mb-4">Subject Lines</h2>
          <p className="text-sm text-gray-500 mb-4">
            Use <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{'#{orderNumber}'}</code> to insert the order number.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quote Email Subject</label>
              <input
                type="text"
                value={settings.email_subject_quote}
                onChange={e => update('email_subject_quote', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Email Subject</label>
              <input
                type="text"
                value={settings.email_subject_order}
                onChange={e => update('email_subject_order', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
              />
            </div>
          </div>
        </Card>

        {/* Company Info */}
        <Card>
          <h2 className="font-oswald text-xl font-bold text-[#1A1A1A] mb-4">Company Contact (Email Footer)</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={settings.company_phone}
                onChange={e => update('company_phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={settings.company_email}
                onChange={e => update('company_email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={settings.company_address}
                onChange={e => update('company_address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
              />
            </div>
          </div>
        </Card>

        {/* Notifications — CC on all orders/quotes */}
        <Card>
          <h2 className="font-oswald text-xl font-bold text-[#1A1A1A] mb-1">Notifications</h2>
          <p className="text-sm text-gray-500 mb-4">
            These email addresses will be CC&apos;d on every order and quote confirmation sent to customers.
            Use this to notify the store, kitchen, or management of new orders in real time.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notification Email Addresses
            </label>
            <input
              type="text"
              value={settings.notification_emails}
              onChange={e => update('notification_emails', e.target.value)}
              placeholder="store@lexingtonbettycatering.com, manager@lexingtonbettycatering.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Separate multiple addresses with commas. Leave blank to disable notifications.
            </p>
          </div>
          {settings.notification_emails && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">
                Active notifications will go to:
              </p>
              <ul className="mt-1 space-y-0.5">
                {settings.notification_emails.split(',').map((email, i) => {
                  const trimmed = email.trim();
                  if (!trimmed) return null;
                  return (
                    <li key={i} className="text-sm text-green-600 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {trimmed}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          {saved && <span className="text-green-600 text-sm font-semibold">Settings saved!</span>}
        </div>

        {/* Test Email */}
        <Card>
          <h2 className="font-oswald text-xl font-bold text-[#1A1A1A] mb-4">Send Test Email</h2>
          <p className="text-sm text-gray-500 mb-4">
            Send a sample email to verify formatting. Without <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">RESEND_API_KEY</code>, output logs to server console.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="recipient@example.com"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
            />
            <select
              value={testType}
              onChange={e => setTestType(e.target.value as 'quote' | 'order')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
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
      </div>
    </div>
  );
}

export default function AdminEmailPageWrapper() {
  return (
    <AdminAuthGate>
      <EmailSettingsPage />
    </AdminAuthGate>
  );
}
