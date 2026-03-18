import { CateringProduct } from './types';

/**
 * Meat Portion Engine
 * Default: 3 oz per person per meat
 * Formula: lbs_needed = (headcount × 3) / 16, rounded up to nearest 0.5 lb
 */

// Products that use meat portioning (per-each / by-the-pound items)
export const MEAT_PRODUCT_IDS = [
  'brisket', 'pulled-pork', 'smoked-ribs', 'pulled-chicken',
  'turkey-tips', 'rib-tips', 'beef-wagyu-sausage',
];

// Products that round to 5 lb increments (brisket pan sizing)
const PAN_ROUND_IDS = ['brisket'];

/**
 * Calculate pounds needed for a meat item based on headcount
 * Uses 3oz per person rule
 */
export function calculateMeatPounds(headcount: number): number {
  const rawLbs = (headcount * 3) / 16;
  // Round up to nearest 0.5 lb
  return Math.ceil(rawLbs * 2) / 2;
}

/**
 * Apply pan rounding for brisket (round up to nearest 5 lb = whole pans)
 * Half pan = 5 lbs, Full pan = 10 lbs
 */
export function applyPanRounding(lbs: number): number {
  return Math.ceil(lbs / 5) * 5;
}

/**
 * Get the display text for brisket pan count
 */
export function getBrisketPanDisplay(lbs: number): string {
  const fullPans = Math.floor(lbs / 10);
  const halfPans = (lbs % 10) / 5;
  const parts: string[] = [];
  if (fullPans > 0) parts.push(`${fullPans} full pan${fullPans > 1 ? 's' : ''}`);
  if (halfPans > 0) parts.push(`${halfPans} half pan${halfPans > 1 ? 's' : ''}`);
  return parts.join(' + ') || '1 half pan';
}

/**
 * Check if a product uses the meat portion engine
 */
export function isMeatProduct(productId: string): boolean {
  return MEAT_PRODUCT_IDS.includes(productId);
}

/**
 * Check if a product requires pan rounding
 */
export function requiresPanRounding(productId: string): boolean {
  return PAN_ROUND_IDS.includes(productId);
}

/**
 * Calculate the recommended quantity for a meat product
 * Returns { recommended, minimum, enforced, wasMinimumApplied, panDisplay }
 */
export function calculateMeatOrder(product: CateringProduct, headcount: number): {
  recommended: number;
  minimum: number;
  enforced: number;
  wasMinimumApplied: boolean;
  panDisplay?: string;
  rawCalculated: number;
} {
  const rawLbs = calculateMeatPounds(headcount);
  let recommended = rawLbs;
  const minimum = product.minOrderQuantity || 1;

  // Apply pan rounding for brisket
  if (requiresPanRounding(product.id)) {
    recommended = applyPanRounding(recommended);
  }

  // Enforce minimum
  const enforced = Math.max(recommended, minimum);
  const wasMinimumApplied = enforced > recommended;

  // Pan display for brisket
  let panDisplay: string | undefined;
  if (requiresPanRounding(product.id)) {
    panDisplay = getBrisketPanDisplay(enforced);
  }

  return {
    recommended,
    minimum,
    enforced,
    wasMinimumApplied,
    panDisplay,
    rawCalculated: rawLbs,
  };
}
