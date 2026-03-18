import {
  CateringProduct,
  SelectedCateringItem,
  CalculatedOrderItem,
  TraySizeOption,
  PanSizeOption,
} from './types';
import { isMeatProduct } from './portion-engine';

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get the best tray size for a given headcount
 * Returns the smallest size that can cover the headcount
 */
export function getBestTraySize(
  sizes: TraySizeOption[],
  headcount: number
): { size: TraySizeOption; quantity: number } {
  // Sort sizes by servesMax ascending
  const sortedSizes = [...sizes].sort((a, b) => a.servesMax - b.servesMax);

  // Try to find a single size that covers the headcount
  for (const size of sortedSizes) {
    if (size.servesMax >= headcount) {
      return { size, quantity: 1 };
    }
  }

  // If no single size works, use the largest size and calculate quantity needed
  const largestSize = sortedSizes[sortedSizes.length - 1];
  const quantity = Math.ceil(headcount / largestSize.servesMin);
  return { size: largestSize, quantity };
}

/**
 * Get the best pan size for a given headcount
 */
export function getBestPanSize(
  sizes: PanSizeOption[],
  headcount: number
): { size: PanSizeOption; quantity: number } {
  // Sort sizes by servesMax ascending
  const sortedSizes = [...sizes].sort((a, b) => a.servesMax - b.servesMax);

  // Try to find a single size that covers the headcount
  for (const size of sortedSizes) {
    if (size.servesMax >= headcount) {
      return { size, quantity: 1 };
    }
  }

  // If no single size works, use the largest and calculate quantity
  const largestSize = sortedSizes[sortedSizes.length - 1];
  const quantity = Math.ceil(headcount / largestSize.servesMin);
  return { size: largestSize, quantity };
}

/**
 * Calculate the order details for a product based on headcount
 */
export function calculateProductOrder(
  product: CateringProduct,
  headcount: number,
  sizeOverride?: 'small' | 'medium' | 'large' | 'half' | 'full'
): CalculatedOrderItem {
  const pricing = product.pricing;

  switch (pricing.type) {
    case 'tray': {
      let size, quantity;
      if (sizeOverride) {
        const override = pricing.sizes.find(s => s.size === sizeOverride);
        if (override) {
          size = override;
          quantity = Math.max(1, Math.ceil(headcount / override.servesMax));
        } else {
          ({ size, quantity } = getBestTraySize(pricing.sizes, headcount));
        }
      } else {
        ({ size, quantity } = getBestTraySize(pricing.sizes, headcount));
      }
      const totalServesMin = size.servesMin * quantity;
      const totalServesMax = size.servesMax * quantity;
      const sizeLabel = size.size.charAt(0).toUpperCase() + size.size.slice(1);

      return {
        product,
        selectedSize: size.size,
        quantity,
        unitPrice: size.price,
        totalPrice: size.price * quantity,
        servesMin: totalServesMin,
        servesMax: totalServesMax,
        displayText: quantity === 1
          ? `${sizeLabel} Tray (serves ${size.servesMin}-${size.servesMax})`
          : `${quantity} ${sizeLabel} Trays (serves ${totalServesMin}-${totalServesMax})`,
        itemQuantity: 1,
      };
    }

    case 'pan': {
      let size, quantity;
      if (sizeOverride) {
        const override = pricing.sizes.find(s => s.size === sizeOverride);
        if (override) {
          size = override;
          quantity = Math.max(1, Math.ceil(headcount / override.servesMax));
        } else {
          ({ size, quantity } = getBestPanSize(pricing.sizes, headcount));
        }
      } else {
        ({ size, quantity } = getBestPanSize(pricing.sizes, headcount));
      }
      const totalServesMin = size.servesMin * quantity;
      const totalServesMax = size.servesMax * quantity;
      const sizeLabel = size.size === 'half' ? 'Half Pan' : 'Full Pan';

      return {
        product,
        selectedSize: size.size,
        quantity,
        unitPrice: size.price,
        totalPrice: size.price * quantity,
        servesMin: totalServesMin,
        servesMax: totalServesMax,
        displayText: quantity === 1
          ? `${sizeLabel} (serves ${size.servesMin}-${size.servesMax})`
          : `${quantity} ${sizeLabel}s (serves ${totalServesMin}-${totalServesMax})`,
        itemQuantity: 1,
      };
    }

    case 'per-person': {
      const minOrder = pricing.minOrder || 1;
      const quantity = Math.max(minOrder, headcount);
      return {
        product,
        quantity,
        unitPrice: pricing.pricePerPerson,
        totalPrice: pricing.pricePerPerson * quantity,
        servesMin: quantity,
        servesMax: quantity,
        displayText: `${quantity} servings @ ${formatCurrency(pricing.pricePerPerson)}/person`,
        itemQuantity: 1,
      };
    }

    case 'per-dozen': {
      const dozensNeeded = Math.ceil(headcount / pricing.servesPerDozen);
      const totalServes = dozensNeeded * pricing.servesPerDozen;
      return {
        product,
        quantity: dozensNeeded,
        unitPrice: pricing.pricePerDozen,
        totalPrice: pricing.pricePerDozen * dozensNeeded,
        servesMin: totalServes,
        servesMax: totalServes,
        displayText: dozensNeeded === 1
          ? `1 dozen (serves ${pricing.servesPerDozen})`
          : `${dozensNeeded} dozen (serves ${totalServes})`,
        itemQuantity: 1,
      };
    }

    case 'per-each': {
      const minOrder = pricing.minOrder || 1;
      const quantity = Math.max(minOrder, headcount);
      return {
        product,
        quantity,
        unitPrice: pricing.priceEach,
        totalPrice: pricing.priceEach * quantity,
        servesMin: quantity,
        servesMax: quantity,
        displayText: `${quantity} @ ${formatCurrency(pricing.priceEach)} each`,
        itemQuantity: 1,
      };
    }

    case 'per-container': {
      const containersNeeded = Math.ceil(headcount / pricing.servesPerContainer);
      const totalServes = containersNeeded * pricing.servesPerContainer;
      return {
        product,
        quantity: containersNeeded,
        unitPrice: pricing.pricePerContainer,
        totalPrice: pricing.pricePerContainer * containersNeeded,
        servesMin: totalServes,
        servesMax: totalServes,
        displayText: containersNeeded === 1
          ? `1 container (serves ${pricing.servesPerContainer})`
          : `${containersNeeded} containers (serves ${totalServes})`,
        itemQuantity: 1,
      };
    }

    case 'flat': {
      return {
        product,
        quantity: 1,
        unitPrice: pricing.flatPrice,
        totalPrice: pricing.flatPrice,
        servesMin: headcount,
        servesMax: headcount,
        displayText: `${formatCurrency(pricing.flatPrice)} flat rate`,
        itemQuantity: 1,
      };
    }

    default:
      return {
        product,
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        servesMin: 0,
        servesMax: 0,
        displayText: 'Unknown pricing',
        itemQuantity: 1,
      };
  }
}

/**
 * Calculate all order items with proper sizing based on headcount
 *
 * For dropdown-quantity items (per-each, per-container, per-dozen),
 * item.quantity IS the user's chosen quantity — not a multiplier.
 */
export function calculateAllOrderItems(
  items: SelectedCateringItem[],
  headcount: number
): CalculatedOrderItem[] {
  return items.map(item => {
    const calc = calculateProductOrder(item.product, headcount, item.selectedSize);
    const pt = item.product.pricing.type;

    // --- per-each: item.quantity = user's chosen count (lbs for meats, units otherwise)
    if (pt === 'per-each') {
      const meat = isMeatProduct(item.product.id);
      const serves = meat
        ? Math.floor((item.quantity * 16) / 3)
        : item.quantity;

      return {
        ...calc,
        itemQuantity: item.quantity,
        quantity: item.quantity,
        totalPrice: calc.unitPrice * item.quantity,
        displayText: meat
          ? `${item.quantity} lbs`
          : `${item.quantity} @ ${formatCurrency(calc.unitPrice)} each`,
        servesMin: serves,
        servesMax: serves,
      };
    }

    // --- per-container: item.quantity = container count
    if (pt === 'per-container' && item.product.pricing.type === 'per-container') {
      const spc = item.product.pricing.servesPerContainer;
      const totalServes = item.quantity * spc;
      return {
        ...calc,
        itemQuantity: item.quantity,
        quantity: item.quantity,
        totalPrice: calc.unitPrice * item.quantity,
        displayText: item.quantity === 1
          ? `1 container (serves ${spc})`
          : `${item.quantity} containers (serves ${totalServes})`,
        servesMin: totalServes,
        servesMax: totalServes,
      };
    }

    // --- per-dozen: item.quantity = dozen count
    if (pt === 'per-dozen' && item.product.pricing.type === 'per-dozen') {
      const spd = item.product.pricing.servesPerDozen;
      const totalServes = item.quantity * spd;
      return {
        ...calc,
        itemQuantity: item.quantity,
        quantity: item.quantity,
        totalPrice: calc.unitPrice * item.quantity,
        displayText: item.quantity === 1
          ? `1 dozen (serves ${spd})`
          : `${item.quantity} dozen (serves ${totalServes})`,
        servesMin: totalServes,
        servesMax: totalServes,
      };
    }

    // --- tray / pan / per-person / flat: item.quantity is a multiplier
    return {
      ...calc,
      itemQuantity: item.quantity,
      totalPrice: calc.totalPrice * item.quantity,
    };
  });
}

/**
 * Calculate the total cost of all selected items based on headcount
 */
export function calculateTotalCost(
  items: SelectedCateringItem[],
  headcount: number = 10
): number {
  const calculatedItems = calculateAllOrderItems(items, headcount);
  return calculatedItems.reduce((total, item) => total + item.totalPrice, 0);
}

/**
 * Calculate cost per person based on headcount
 */
export function calculatePerPersonCost(
  items: SelectedCateringItem[],
  headcount: number
): number {
  if (headcount <= 0) return 0;
  const total = calculateTotalCost(items, headcount);
  return total / headcount;
}

/**
 * Calculate total servings from all selected items
 */
export function calculateTotalServings(
  items: SelectedCateringItem[],
  headcount: number = 10
): number {
  const calculatedItems = calculateAllOrderItems(items, headcount);
  // Use the minimum serves count to be conservative
  return calculatedItems.reduce((total, item) => total + item.servesMin, 0);
}

/**
 * Check if the order has enough servings for the headcount
 */
export function hasEnoughServings(
  items: SelectedCateringItem[],
  headcount: number
): boolean {
  const totalServings = calculateTotalServings(items, headcount);
  return totalServings >= headcount;
}

/**
 * Calculate serving coverage percentage
 */
export function calculateServingCoverage(
  items: SelectedCateringItem[],
  headcount: number
): number {
  if (headcount <= 0) return 0;
  const totalServings = calculateTotalServings(items, headcount);
  return Math.round((totalServings / headcount) * 100);
}

/**
 * Get the display price for a product (used in product cards)
 * Shows the starting price for variable pricing items
 */
export function getDisplayPrice(product: CateringProduct): string {
  const pricing = product.pricing;

  switch (pricing.type) {
    case 'tray': {
      const lowestPrice = Math.min(...pricing.sizes.map(s => s.price));
      return `From ${formatCurrency(lowestPrice)}`;
    }
    case 'pan': {
      const lowestPrice = Math.min(...pricing.sizes.map(s => s.price));
      return `From ${formatCurrency(lowestPrice)}`;
    }
    case 'per-person':
      return `${formatCurrency(pricing.pricePerPerson)}/person`;
    case 'per-dozen':
      return `${formatCurrency(pricing.pricePerDozen)}/dozen`;
    case 'per-each':
      return `${formatCurrency(pricing.priceEach)} each`;
    case 'per-container':
      return `${formatCurrency(pricing.pricePerContainer)}/container`;
    case 'flat':
      return formatCurrency(pricing.flatPrice);
    default:
      return 'Price varies';
  }
}

/**
 * Get pricing type label for display
 */
export function getPricingTypeLabel(product: CateringProduct): string {
  const pricing = product.pricing;

  switch (pricing.type) {
    case 'tray':
      return 'Tray sizes: S/M/L';
    case 'pan':
      return 'Pan sizes: Half/Full';
    case 'per-person':
      return 'Per person';
    case 'per-dozen':
      return 'Per dozen';
    case 'per-each':
      return 'Per item';
    case 'per-container':
      return `Serves ${pricing.servesPerContainer}`;
    case 'flat':
      return 'Flat rate per event';
    default:
      return '';
  }
}
