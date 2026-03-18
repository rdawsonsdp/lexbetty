'use client';

import { useState, useEffect, useMemo } from 'react';
import { CATERING_PRODUCTS } from '@/lib/products';
import { CateringProduct } from '@/lib/types';

/**
 * Fetches active products from the database sorted by sort_position.
 * Falls back to showing all products (static order) on error.
 */
export function useActiveProducts() {
  const [sortedProducts, setSortedProducts] = useState<CateringProduct[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/catering-products')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setSortedProducts(data.products as CateringProduct[]);
      })
      .catch(() => {
        // Graceful degradation: show all products
        if (!cancelled) setSortedProducts(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeProducts = useMemo(() => {
    if (!sortedProducts) return CATERING_PRODUCTS;
    return sortedProducts;
  }, [sortedProducts]);

  const getActiveByEventType = useMemo(() => {
    return (eventType: string | null): CateringProduct[] => {
      if (!eventType || eventType === 'alacarte') return activeProducts;
      return activeProducts.filter((p) =>
        p.categories.includes(eventType as any),
      );
    };
  }, [activeProducts]);

  return { activeProducts, getActiveByEventType };
}
