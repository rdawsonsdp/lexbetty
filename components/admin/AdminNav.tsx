'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin/menu', label: 'Menu' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/concierge-rules', label: 'Concierge' },
  { href: '/admin/quickbooks', label: 'QuickBooks' },
  { href: '/admin/settings', label: 'Settings' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="bg-[#1A1A1A] border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/admin/menu" className="font-oswald text-[#E8621A] font-bold text-lg tracking-wide">
            LB ADMIN
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-white/15 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
