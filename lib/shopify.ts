import { CateringProduct, EventType } from './types';
import { getProductsByEventType } from './products';

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

// Shopify integration is currently disabled - using local product data instead
// To enable Shopify, configure SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_ACCESS_TOKEN

/**
 * Fetch catering products
 * Currently returns local product data. Will integrate with Shopify when configured.
 */
export async function fetchCateringProducts(
  eventType?: EventType
): Promise<CateringProduct[]> {
  // Check if Shopify is configured
  if (SHOPIFY_STORE_DOMAIN && SHOPIFY_ADMIN_API_ACCESS_TOKEN) {
    // TODO: Implement Shopify GraphQL fetch when needed
    console.log('Shopify configured but not yet implemented for new pricing types');
  }

  // Return local product data
  if (eventType) {
    return getProductsByEventType(eventType);
  }
  // Return all products when no event type specified
  const { CATERING_PRODUCTS } = await import('./products');
  return CATERING_PRODUCTS;
}

/**
 * Create a draft order for catering
 * Placeholder for Shopify integration
 */
export async function createCateringDraftOrder(
  lineItems: Array<{ variantId: string; quantity: number }>,
  headcount: number,
  eventType: string,
  buyerInfo: {
    name: string;
    email: string;
    phone: string;
    company: string;
    eventDate: string;
    notes?: string;
  }
): Promise<{
  draftOrderId: string;
  draftOrderNumber: string;
  invoiceUrl: string;
}> {
  // Placeholder - will implement when Shopify integration is ready
  console.log('Draft order creation:', { lineItems, headcount, eventType, buyerInfo });

  return {
    draftOrderId: 'placeholder-' + Date.now(),
    draftOrderNumber: 'DRAFT-' + Date.now(),
    invoiceUrl: '#',
  };
}
