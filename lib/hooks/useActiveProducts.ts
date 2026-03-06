'use client';

import { useState, useEffect, useMemo } from 'react';
import { CATERING_PRODUCTS } from '@/lib/products';
import { CateringProduct } from '@/lib/types';

/**
 * Fetches active product IDs from the database and returns CATERING_PRODUCTS
 * filtered to only active items. Falls back to showing all products on error.
 */
export function useActiveProducts() {
  const [activeIds, setActiveIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/catering-products')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const ids = new Set<string>(
          (data.products as CateringProduct[]).map((p) => p.id),
        );
        setActiveIds(ids);
      })
      .catch(() => {
        // Graceful degradation: show all products
        if (!cancelled) setActiveIds(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeProducts = useMemo(() => {
    if (!activeIds) return CATERING_PRODUCTS;
    return CATERING_PRODUCTS.filter((p) => activeIds.has(p.id));
  }, [activeIds]);

  const getActiveByEventType = useMemo(() => {
    return (eventType: string | null): CateringProduct[] => {
      if (!eventType) return activeProducts;
      return activeProducts.filter((p) =>
        p.categories.includes(eventType as any),
      );
    };
  }, [activeProducts]);

  return { activeProducts, getActiveByEventType };
}
