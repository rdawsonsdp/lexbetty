'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function SignInDropdown() {
  const { user, loading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
    );
  }

  // Signed in — show user initial with dropdown
  if (user) {
    const initial = user.user_metadata?.first_name?.[0] || user.email?.[0]?.toUpperCase() || '?';
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-9 h-9 rounded-full bg-[#E8621A] text-white font-oswald font-bold text-sm flex items-center justify-center hover:opacity-90 transition-opacity"
          aria-label="Account menu"
        >
          {initial}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="font-oswald font-semibold text-[#1A1A1A] text-sm truncate">
                {user.user_metadata?.first_name || 'Welcome'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <Link
              href="/my-orders"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2.5 text-sm text-[#1A1A1A] hover:bg-[#F5EDE0] transition-colors"
            >
              My Orders
            </Link>
            <button
              onClick={async () => {
                await signOut();
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  // Not signed in — show VIP button with dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#1A1A1A] text-white font-oswald text-sm tracking-wider px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap"
        aria-label="Sign in"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        BETTY VIP
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 py-5 px-5 z-50 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#E8621A]/10 mb-3">
            <svg className="w-6 h-6 text-[#E8621A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h3 className="font-oswald font-bold text-[#1A1A1A] text-lg mb-1">Betty VIP</h3>
          <span className="inline-block bg-[#E8621A] text-white font-oswald font-bold text-xs tracking-widest px-3 py-1 rounded-full mb-3">
            COMING SOON
          </span>
          <p className="text-sm text-gray-500 leading-relaxed">
            Save your info, track orders, earn rewards, and reorder your favorites in one click. We&apos;re cooking up something special for our VIPs.
          </p>
          <button
            onClick={() => setIsOpen(false)}
            className="mt-4 text-xs text-gray-400 hover:text-[#1A1A1A] transition-colors"
          >
            Got it
          </button>
        </div>
      )}
    </div>
  );
}
