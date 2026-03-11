'use client';

import { useState, useEffect } from 'react';
import { CateringPackage } from '@/lib/types';
import { CATERING_PACKAGES } from '@/lib/packages';

/**
 * Fetches active packages from the API (Supabase-backed with fallback).
 */
export function useActivePackages() {
  const [packages, setPackages] = useState<CateringPackage[]>(CATERING_PACKAGES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/catering-packages')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data.packages && data.packages.length > 0) {
          setPackages(data.packages);
        }
      })
      .catch(() => {
        // Graceful degradation: use hardcoded packages
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { packages, loading };
}
