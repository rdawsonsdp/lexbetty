'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminAuthGate from '@/components/admin/AdminAuthGate';

interface QBStatus {
  connected: boolean;
  companyId?: string;
  expiresAt?: string;
}

function QuickBooksAdmin() {
  const [status, setStatus] = useState<QBStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getToken = () => sessionStorage.getItem('admin_token') || '';

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/quickbooks/status', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setStatus(data);
    } catch {
      setError('Failed to check QuickBooks status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Check URL params for OAuth callback result
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      setSuccessMsg(`Connected to QuickBooks (Company: ${params.get('companyId')})`);
      // Clean URL
      window.history.replaceState({}, '', '/admin/quickbooks');
    }
    if (params.get('error')) {
      setError(params.get('error'));
      window.history.replaceState({}, '', '/admin/quickbooks');
    }
  }, [fetchStatus]);

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

  return (
    <div className="min-h-screen bg-gray-50">
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

        <div className="bg-white rounded-xl shadow-sm border p-6">
          {/* Status indicator */}
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

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-oswald font-bold text-[#1A1A1A] mb-2">What You Need</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>- QuickBooks Online account (Plus or Advanced)</li>
                  <li>- QB Payments enabled for online payments</li>
                  <li>- QB_CLIENT_ID and QB_CLIENT_SECRET in environment variables</li>
                </ul>
              </div>

              <button
                onClick={handleConnect}
                disabled={actionLoading}
                className="px-6 py-3 bg-[#2CA01C] text-white font-oswald font-bold rounded-lg hover:bg-[#248A17] transition-colors disabled:opacity-50"
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
