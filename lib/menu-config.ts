// Shared menu configuration — written by Menu Engineering dashboard, read by the menu page.
// Stored in localStorage so changes persist across page navigations.

const STORAGE_KEY = 'caterpro-menu-config';

export interface MenuBundle {
  name: string;
  productIds: string[];
}

export interface MenuConfig {
  featuredProductIds: string[];
  chefsPickIds: string[];
  removedItemIds: string[];
  seasonalItemIds: string[];
  bundles: MenuBundle[];
  appliedRecommendationIds: string[];
  appliedAt: string; // ISO timestamp
}

export function saveMenuConfig(config: MenuConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // localStorage may be unavailable (SSR, private browsing quota)
  }
}

export function loadMenuConfig(): MenuConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MenuConfig;
  } catch {
    return null;
  }
}

export function clearMenuConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
