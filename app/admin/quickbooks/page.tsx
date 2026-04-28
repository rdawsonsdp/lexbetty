'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import AdminAuthGate from '@/components/admin/AdminAuthGate';
import AdminNav from '@/components/admin/AdminNav';

interface QBStatus {
  connected: boolean;
  companyId?: string;
  expiresAt?: string;
}

interface QBCredentialsView {
  clientId: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
  hasClientSecret: boolean;
  source: { clientId: 'db' | 'env' | 'none'; clientSecret: 'db' | 'env' | 'none' };
}

function QuickBooksAdmin() {
  const [status, setStatus] = useState<QBStatus | null>(null);
  const [creds, setCreds] = useState<QBCredentialsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state for credentials
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [redirectUriInput, setRedirectUriInput] = useState('');
  const [environmentInput, setEnvironmentInput] = useState<'sandbox' | 'production'>('sandbox');
  const [showSecret, setShowSecret] = useState(false);

  const getToken = () => sessionStorage.getItem('admin_token') || '';

  const fetchAll = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [statusRes, credsRes] = await Promise.all([
        fetch('/api/quickbooks/status', { headers }),
        fetch('/api/quickbooks/credentials', { headers }),
      ]);
      const statusData = await statusRes.json();
      const credsData = await credsRes.json();
      setStatus(statusData);
      if (credsRes.ok) {
        setCreds(credsData);
        setClientIdInput(credsData.clientId || '');
        setRedirectUriInput(credsData.redirectUri || '');
        setEnvironmentInput(credsData.environment || 'sandbox');
      }
    } catch {
      setError('Failed to load QuickBooks settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    // Check URL params for OAuth callback result
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      setSuccessMsg(`Connected to QuickBooks (Company: ${params.get('companyId')})`);
      window.history.replaceState({}, '', '/admin/quickbooks');
    }
    if (params.get('error')) {
      setError(params.get('error'));
      window.history.replaceState({}, '', '/admin/quickbooks');
    }
  }, [fetchAll]);

  const handleSaveCredentials = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSavingCreds(true);
    try {
      const res = await fetch('/api/quickbooks/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          clientId: clientIdInput,
          clientSecret: clientSecretInput,
          redirectUri: redirectUriInput,
          environment: environmentInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save credentials');
      } else {
        setCreds(data.credentials);
        setClientSecretInput('');
        setSuccessMsg('Credentials saved');
      }
    } catch {
      setError('Failed to save credentials');
    } finally {
      setSavingCreds(false);
    }
  };

  const handleConnect = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/quickbooks/authorize', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError(data.error || 'Failed to get authorization URL');
      }
    } catch {
      setError('Failed to initiate QuickBooks connection');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect QuickBooks? New orders will no longer create invoices.')) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/quickbooks/disconnect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setStatus({ connected: false });
        setSuccessMsg('QuickBooks disconnected');
      } else {
        setError('Failed to disconnect');
      }
    } catch {
      setError('Failed to disconnect QuickBooks');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const credsReady = Boolean(creds?.clientId && creds?.hasClientSecret && creds?.redirectUri);
  const sourceLabel = (s: 'db' | 'env' | 'none') =>
    s === 'db' ? 'Saved' : s === 'env' ? 'From env var' : 'Not set';

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="font-oswald text-3xl font-bold text-[#1A1A1A] mb-8">
          QuickBooks Integration
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            {successMsg}
          </div>
        )}

        {/* Credentials Form */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="font-oswald text-xl font-bold text-[#1A1A1A] mb-1">
            App Credentials
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            From the Intuit Developer dashboard - your app&apos;s Keys &amp; OAuth settings.
          </p>

          <form onSubmit={handleSaveCredentials} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                Client ID
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({sourceLabel(creds?.source.clientId || 'none')})
                </span>
              </label>
              <input
                type="text"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="ABcd1234..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E8621A] focus:border-transparent text-sm font-mono"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                Client Secret
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({sourceLabel(creds?.source.clientSecret || 'none')})
                </span>
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={clientSecretInput}
                  onChange={(e) => setClientSecretInput(e.target.value)}
                  placeholder={creds?.hasClientSecret ? 'Leave blank to keep current secret' : 'Enter client secret'}
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E8621A] focus:border-transparent text-sm font-mono"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-[#1A1A1A] px-2 py-1"
                >
                  {showSecret ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Stored in Supabase. Never returned to the browser after save - leave blank to keep the existing value.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                Redirect URI
              </label>
              <input
                type="text"
                value={redirectUriInput}
                onChange={(e) => setRedirectUriInput(e.target.value)}
                placeholder="https://yourdomain.com/api/quickbooks/callback"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E8621A] focus:border-transparent text-sm font-mono"
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-gray-500">
                Must match exactly what you registered in the Intuit Developer dashboard.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                Environment
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="qb_env"
                    value="sandbox"
                    checked={environmentInput === 'sandbox'}
                    onChange={() => setEnvironmentInput('sandbox')}
                  />
                  Sandbox
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="qb_env"
                    value="production"
                    checked={environmentInput === 'production'}
                    onChange={() => setEnvironmentInput('production')}
                  />
                  Production
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={savingCreds}
                className="px-4 py-2 bg-[#E8621A] text-white font-oswald font-bold rounded-lg hover:bg-[#c8531a] transition-colors disabled:opacity-50 text-sm"
              >
                {savingCreds ? 'Saving...' : 'Save Credentials'}
              </button>
            </div>
          </form>
        </div>

        {/* Connection Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`w-3 h-3 rounded-full ${
                status?.connected ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            <span className="font-medium text-[#1A1A1A]">
              {status?.connected ? 'Connected' : 'Not Connected'}
            </span>
          </div>

          {status?.connected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Company ID</p>
                  <p className="font-medium text-[#1A1A1A]">{status.companyId}</p>
                </div>
                <div>
                  <p className="text-gray-500">Token Expires</p>
                  <p className="font-medium text-[#1A1A1A]">
                    {status.expiresAt
                      ? new Date(status.expiresAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-oswald font-bold text-[#1A1A1A] mb-2">How It Works</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>- New orders automatically create QuickBooks invoices</li>
                  <li>- Customers receive a payment link via email</li>
                  <li>- Payments are tracked and order status updates automatically</li>
                </ul>
              </div>

              <button
                onClick={handleDisconnect}
                disabled={actionLoading}
                className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Disconnecting...' : 'Disconnect QuickBooks'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Connect your QuickBooks Online account to automatically create invoices
                and accept payments for catering orders.
              </p>

              {!credsReady && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm text-amber-900">
                  Save your Client ID, Client Secret, and Redirect URI above before connecting.
                </div>
              )}

              <button
                onClick={handleConnect}
                disabled={actionLoading || !credsReady}
                className="px-6 py-3 bg-[#2CA01C] text-white font-oswald font-bold rounded-lg hover:bg-[#248A17] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Connecting...' : 'Connect QuickBooks'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuickBooksPage() {
  return (
    <AdminAuthGate>
      <QuickBooksAdmin />
    </AdminAuthGate>
  );
}
