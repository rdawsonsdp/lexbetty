'use client';

import { useState, useEffect, ReactNode } from 'react';

interface AdminAuthGateProps {
  children: ReactNode;
}

export default function AdminAuthGate({ children }: AdminAuthGateProps) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validate existing token against the server
    const token = sessionStorage.getItem('admin_token');
    if (token) {
      fetch('/api/admin/products', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      }).then(res => {
        if (res.ok) {
          setIsAuthed(true);
        } else {
          // Token is stale, clear it
          sessionStorage.removeItem('admin_token');
        }
        setLoading(false);
      }).catch(() => {
        sessionStorage.removeItem('admin_token');
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError('Invalid password');
        return;
      }

      const { token } = await res.json();
      sessionStorage.setItem('admin_token', token);
      setIsAuthed(true);
    } catch {
      setError('Authentication failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Admin Access</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#E8621A] focus:border-transparent"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <button
            type="submit"
            className="w-full mt-4 bg-[#1A1A1A] text-white py-3 rounded-lg font-semibold hover:bg-[#4a4747] transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
