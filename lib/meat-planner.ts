import { CateringProduct } from './types';
import { formatCurrency } from './pricing';

/**
 * Meat Planner — guided protein selection
 *
 * Portion sizing by event type:
 *   Light (lunch/appetizer):  6 oz per person
 *   Standard (dinner/corp):   9 oz per person (default)
 *   Heavy (big event/BBQ):   12 oz per person
 *
 * Split evenly across selected meats:
 *   1 meat  → full portion each
 *   2 meats → half portion each
 *   3 meats → third portion each
 *
 * Formula: served lbs per meat = (ozPerPerson ÷ numberOfMeats × headcount) ÷ 16
 *
 * Uses the 'meats' tag to identify products, then categorizes by pricing type:
 *   per-each / per-lb → by the pound
 *   pan               → half/full pan sizing
 *   per-container     → container count
 */

// Default to standard event portion — editable in Admin > Settings > Business Rules
export const TOTAL_OZ_PER_PERSON = 9;

export const MEAT_TAG = 'meats';

// Brisket rounds to 5-lb (half-pan) increments
const BRISKET_ID = 'brisket';

// Enforced minimums (override product.minOrderQuantity for the planner)
const MEAT_MINIMUMS: Record<string, number> = {
  'smoked-ribs': 10,
  'brisket': 5,
  'pulled-pork': 5,
  'pulled-chicken': 5,
  'turkey-tips': 5,
};

// --- helpers ----------------------------------------------------------------

export function isMeatTagged(product: CateringProduct): boolean {
  return product.tags?.includes(MEAT_TAG) || false;
}

export function isPerLbMeat(product: CateringProduct): boolean {
  return isMeatTagged(product) && (product.pricing.type === 'per-each' || product.pricing.type === 'per-lb');
}

export function isPanMeat(product: CateringProduct): boolean {
  return isMeatTagged(product) && product.pricing.type === 'pan';
}

export function isContainerMeat(product: CateringProduct): boolean {
  return isMeatTagged(product) && product.pricing.type === 'per-container';
}

// --- recommendation types ---------------------------------------------------

export interface MeatRecommendation {
  recommendedQty: number;
  enforcedQty: number;
  minimum: number;
  step: number;
  mathString: string;
  panDisplay?: string;
  unitPrice: number;
  totalPrice: number;
  pricingType: 'per-lb' | 'pan' | 'container';
  defaultSize?: 'half' | 'full';
}

export interface MeatSelection {
  selected: boolean;
  quantity: number;
  size?: 'half' | 'full';
}

// --- main calculation -------------------------------------------------------

export function calculateMeatRecommendation(
  product: CateringProduct,
  headcount: number,
  selectedSize?: 'half' | 'full',
  numberOfMeats: number = 1,
): MeatRecommendation {
  if (isPerLbMeat(product)) return calcPerLb(product, headcount, numberOfMeats);
  if (isPanMeat(product)) return calcPan(product, headcount, selectedSize, numberOfMeats);
  return calcContainer(product, headcount, numberOfMeats);
}

// --- per-lb meats (per-each pricing = $/lb) ---------------------------------

function getMinimum(product: CateringProduct): number {
  return (
    MEAT_MINIMUMS[product.id] ||
    product.minOrderQuantity ||
    (product.pricing.type === 'per-each' ? product.pricing.minOrder : undefined) ||
    1
  );
}

function calcPerLb(product: CateringProduct, headcount: number, numberOfMeats: number): MeatRecommendation {
  const ozPerMeat = TOTAL_OZ_PER_PERSON / Math.max(1, numberOfMeats);
  const rawLbs = (headcount * ozPerMeat) / 16;
  let recommended: number;
  let panDisplay: string | undefined;

  if (product.id === BRISKET_ID) {
    recommended = Math.ceil(rawLbs / 5) * 5;
    const fullPans = Math.floor(recommended / 10);
    const halfPans = recommended % 10 >= 5 ? 1 : 0;
    const parts: string[] = [];
    if (fullPans > 0) parts.push(`${fullPans} full pan${fullPans > 1 ? 's' : ''}`);
    if (halfPans > 0) parts.push('1 half pan');
    panDisplay = parts.join(' + ') || '1 half pan';
  } else {
    recommended = Math.ceil(rawLbs * 2) / 2;
  }

  const minimum = getMinimum(product);
  const enforced = Math.max(recommended, minimum);

  const priceEach = product.pricing.type === 'per-each' ? product.pricing.priceEach
    : product.pricing.type === 'per-lb' ? product.pricing.pricePerLb : 0;
  const step = minimum >= 5 || product.id === BRISKET_ID ? 5 : 1;

  // Format oz display cleanly
  const ozStr = parseFloat(ozPerMeat.toFixed(2)).toString();

  // Transparent math string
  let mathString = `${headcount} guests \u00d7 ${ozStr} oz = ${rawLbs.toFixed(1)} lbs`;
  if (product.id === BRISKET_ID) {
    mathString += ` \u2192 ${enforced} lbs (${panDisplay})`;
  } else if (enforced > recommended) {
    mathString += ` \u2192 ${enforced} lbs (min ${minimum})`;
  } else {
    mathString += ` \u2192 ${enforced} lbs`;
  }

  return {
    recommendedQty: recommended,
    enforcedQty: enforced,
    minimum,
    step,
    mathString,
    panDisplay,
    unitPrice: priceEach,
    totalPrice: priceEach * enforced,
    pricingType: 'per-lb',
  };
}

// --- pan meats (half / full pan pricing) ------------------------------------

function calcPan(
  product: CateringProduct,
  headcount: number,
  selectedSize?: 'half' | 'full',
  numberOfMeats: number = 1,
): MeatRecommendation {
  if (product.pricing.type !== 'pan') {
    return emptyRec('pan');
  }

  const sizes = product.pricing.sizes;
  const halfPan = sizes.find(s => s.size === 'half');
  const fullPan = sizes.find(s => s.size === 'full');

  // Auto-recommend size based on headcount
  let recSize: 'half' | 'full';
  let recQty: number;

  if (halfPan && headcount <= halfPan.servesMax) {
    recSize = 'half';
    recQty = 1;
  } else if (fullPan && headcount <= fullPan.servesMax) {
    recSize = 'full';
    recQty = 1;
  } else if (fullPan) {
    recSize = 'full';
    recQty = Math.ceil(headcount / fullPan.servesMin);
  } else {
    recSize = 'half';
    recQty = halfPan ? Math.ceil(headcount / halfPan.servesMin) : 1;
  }

  const useSize = selectedSize || recSize;
  const sizeOpt = sizes.find(s => s.size === useSize) || sizes[0];

  // Use 9oz formula if estimated weight is available
  let qty: number;
  let mathString: string;
  const sizeLabel = useSize === 'half' ? 'Half Pan' : 'Full Pan';

  if (sizeOpt.estimatedWeightOz) {
    const ozPerMeat = TOTAL_OZ_PER_PERSON / Math.max(1, numberOfMeats);
    const totalOzNeeded = headcount * ozPerMeat;
    qty = Math.max(1, Math.ceil(totalOzNeeded / sizeOpt.estimatedWeightOz));
    const ozStr = parseFloat(ozPerMeat.toFixed(2)).toString();
    const totalOzStr = parseFloat(totalOzNeeded.toFixed(1)).toString();
    mathString = `${headcount} guests \u00d7 ${ozStr} oz = ${totalOzStr} oz \u2192 ${qty} ${sizeLabel}${qty !== 1 ? 's' : ''} (~${sizeOpt.estimatedWeightOz} oz each)`;
  } else {
    qty = selectedSize
      ? Math.max(1, Math.ceil(headcount / sizeOpt.servesMin))
      : recQty;
    mathString = qty === 1
      ? `${sizeLabel} (serves ${sizeOpt.servesMin}-${sizeOpt.servesMax})`
      : `${qty} ${sizeLabel}s (serves ${sizeOpt.servesMin * qty}-${sizeOpt.servesMax * qty})`;
  }

  return {
    recommendedQty: qty,
    enforcedQty: qty,
    minimum: 1,
    step: 1,
    mathString,
    unitPrice: sizeOpt.price,
    totalPrice: sizeOpt.price * qty,
    pricingType: 'pan',
    defaultSize: recSize,
  };
}

// --- container meats --------------------------------------------------------

function calcContainer(
  product: CateringProduct,
  headcount: number,
  numberOfMeats: number = 1,
): MeatRecommendation {
  if (product.pricing.type !== 'per-container') {
    return emptyRec('container');
  }

  const { pricePerContainer, servesPerContainer, estimatedWeightOz } = product.pricing;

  let qty: number;
  let mathString: string;

  if (estimatedWeightOz) {
    const ozPerMeat = TOTAL_OZ_PER_PERSON / Math.max(1, numberOfMeats);
    const totalOzNeeded = headcount * ozPerMeat;
    qty = Math.max(1, Math.ceil(totalOzNeeded / estimatedWeightOz));
    const ozStr = parseFloat(ozPerMeat.toFixed(2)).toString();
    const totalOzStr = parseFloat(totalOzNeeded.toFixed(1)).toString();
    mathString = `${headcount} guests \u00d7 ${ozStr} oz = ${totalOzStr} oz \u2192 ${qty} container${qty !== 1 ? 's' : ''} (~${estimatedWeightOz} oz each)`;
  } else {
    qty = Math.ceil(headcount / servesPerContainer);
    const totalServes = qty * servesPerContainer;
    mathString = qty === 1
      ? `1 container (serves ${servesPerContainer})`
      : `${qty} containers (serves ${totalServes})`;
  }

  return {
    recommendedQty: qty,
    enforcedQty: qty,
    minimum: 1,
    step: 1,
    mathString,
    unitPrice: pricePerContainer,
    totalPrice: pricePerContainer * qty,
    pricingType: 'container',
  };
}

// --- total calculator -------------------------------------------------------

export function calculatePlannerTotal(
  selections: Record<string, MeatSelection>,
  products: CateringProduct[],
  headcount: number,
): { total: number; perPerson: number; count: number } {
  let total = 0;
  let count = 0;

  for (const [productId, sel] of Object.entries(selections)) {
    if (!sel.selected) continue;
    const product = products.find(p => p.id === productId);
    if (!product) continue;
    count++;

    if (product.pricing.type === 'per-each') {
      total += product.pricing.priceEach * sel.quantity;
    } else if (product.pricing.type === 'per-lb') {
      total += product.pricing.pricePerLb * sel.quantity;
    } else if (product.pricing.type === 'pan') {
      const sizeOpt =
        product.pricing.sizes.find(s => s.size === sel.size) ||
        product.pricing.sizes[0];
      total += sizeOpt.price * sel.quantity;
    } else if (product.pricing.type === 'per-container') {
      total += product.pricing.pricePerContainer * sel.quantity;
    }
  }

  return {
    total,
    perPerson: headcount > 0 ? total / headcount : 0,
    count,
  };
}

// --- util -------------------------------------------------------------------

function emptyRec(
  pricingType: 'per-lb' | 'pan' | 'container',
): MeatRecommendation {
  return {
    recommendedQty: 1,
    enforcedQty: 1,
    minimum: 1,
    step: 1,
    mathString: '',
    unitPrice: 0,
    totalPrice: 0,
    pricingType,
  };
}
