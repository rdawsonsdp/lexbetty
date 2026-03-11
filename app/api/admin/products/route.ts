import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { getAllProductsForAdmin, upsertProduct } from '@/lib/supabase/products';
import { productSchema } from '@/lib/product-schema';

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const products = await getAllProductsForAdmin();
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Failed to fetch admin products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const { tags, featured, variantId, slug, inventory, is_active, sort_position, ...rest } = parsed.data;
    await upsertProduct({
      ...rest,
      tags: tags ?? undefined,
      featured: featured ?? undefined,
      variantId: variantId ?? undefined,
      slug: slug ?? undefined,
      inventory: inventory ?? undefined,
      is_active: is_active ?? undefined,
      sort_position: sort_position ?? undefined,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
