import { NextRequest, NextResponse } from 'next/server';
import { createCateringDraftOrder } from '@/lib/shopify';

interface CreateOrderRequest {
  items?: Array<{ productId: string; title: string; quantity: number; unitPrice: number; totalPrice: number; selectedSize: string; displayText: string }>;
  lineItems?: Array<{ variantId: string; quantity: number }>;
  headcount: number;
  eventType: string;
  buyerInfo: {
    name: string;
    email: string;
    phone: string;
    company: string;
    eventDate: string;
    eventTime?: string;
    deliveryAddress?: string;
    notes?: string;
  };
  setupRequired?: boolean;
  deliveryFee?: number;
  orderTotal?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();

    // Validate required fields — checkout sends `items`, Shopify path uses `lineItems`
    const hasItems = (body.items && body.items.length > 0) || (body.lineItems && body.lineItems.length > 0);
    if (!hasItems) {
      return NextResponse.json(
        { success: false, error: 'No items in order' },
        { status: 400 }
      );
    }

    if (!body.headcount || body.headcount < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid headcount' },
        { status: 400 }
      );
    }

    if (!body.buyerInfo?.email) {
      return NextResponse.json(
        { success: false, error: 'Buyer email is required' },
        { status: 400 }
      );
    }

    // Check if Shopify is configured
    const shopifyConfigured =
      process.env.SHOPIFY_STORE_DOMAIN &&
      process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

    if (!shopifyConfigured) {
      // Return mock response for development
      console.log('Mock order created (Shopify not configured):', body);
      return NextResponse.json({
        success: true,
        draftOrderId: 'mock-order-123',
        draftOrderNumber: '#MOCK-1001',
        invoiceUrl: 'https://example.com/mock-invoice',
      });
    }

    // Create the draft order in Shopify
    const lineItems = body.lineItems ?? (body.items || []).map(item => ({
      variantId: item.productId,
      quantity: item.quantity,
    }));
    const result = await createCateringDraftOrder(
      lineItems,
      body.headcount,
      body.eventType,
      body.buyerInfo
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error creating catering order:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
