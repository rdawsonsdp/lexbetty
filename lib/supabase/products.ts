import { supabase } from './client';
import { supabaseAdmin } from './server';
import { CateringProduct, EventType, ProductPricing } from '@/lib/types';
import { CATERING_PRODUCTS, getProductsByEventType } from '@/lib/products';

// DB row shape
interface ProductRow {
  id: string;
  title: string;
  description: string;
  image: string;
  categories: string[];
  pricing: ProductPricing;
  tags: string[] | null;
  featured: boolean;
  variant_id: string | null;
  slug: string | null;
  inventory: number | null;
  is_active: boolean;
  sort_position: number;
  created_at: string;
  updated_at: string;
}

function rowToProduct(row: ProductRow): CateringProduct {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    image: row.image,
    categories: row.categories as EventType[],
    pricing: row.pricing,
    tags: row.tags ?? undefined,
    featured: row.featured || undefined,
    variantId: row.variant_id ?? undefined,
    slug: row.slug ?? undefined,
    inventory: row.inventory ?? undefined,
  };
}

export function productToRow(product: CateringProduct, sortPosition: number = 0): Omit<ProductRow, 'created_at' | 'updated_at'> {
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    image: product.image,
    categories: product.categories,
    pricing: product.pricing as unknown as ProductPricing,
    tags: product.tags ?? null,
    featured: product.featured ?? false,
    variant_id: product.variantId ?? null,
    slug: product.slug ?? null,
    inventory: product.inventory ?? null,
    is_active: true,
    sort_position: sortPosition,
  };
}

/**
 * Fetch active products from Supabase, filtered by event type.
 * Falls back to hardcoded products if Supabase is unavailable.
 */
export async function getProductsFromDB(eventType?: EventType | null): Promise<CateringProduct[]> {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_position', { ascending: true });

    if (eventType) {
      query = query.contains('categories', [eventType]);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No products found');

    return (data as ProductRow[]).map(rowToProduct);
  } catch (err) {
    console.warn('Supabase fetch failed, falling back to hardcoded products:', err);
    if (eventType) {
      return getProductsByEventType(eventType);
    }
    return CATERING_PRODUCTS;
  }
}

/**
 * Fetch a single product by ID from Supabase.
 */
export async function getProductByIdFromDB(id: string): Promise<CateringProduct | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return rowToProduct(data as ProductRow);
  } catch {
    const product = CATERING_PRODUCTS.find(p => p.id === id);
    return product ?? null;
  }
}

/**
 * Fetch ALL products for admin (including inactive), using service role.
 */
export async function getAllProductsForAdmin(): Promise<(CateringProduct & { is_active: boolean; sort_position: number })[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('sort_position', { ascending: true });

    if (error) throw error;

    return (data as ProductRow[]).map(row => ({
      ...rowToProduct(row),
      is_active: row.is_active,
      sort_position: row.sort_position,
    }));
  } catch (err) {
    console.warn('Supabase admin fetch failed, falling back to hardcoded products:', err);
    return CATERING_PRODUCTS.map((p, i) => ({
      ...p,
      is_active: true,
      sort_position: i,
    }));
  }
}

/**
 * Create or update a product (admin).
 */
export async function upsertProduct(product: CateringProduct & { is_active?: boolean; sort_position?: number }): Promise<void> {
  const row = productToRow(product, product.sort_position ?? 0);
  if (product.is_active !== undefined) {
    row.is_active = product.is_active;
  }

  const { error } = await supabaseAdmin
    .from('products')
    .upsert(row, { onConflict: 'id' });

  if (error) throw error;
}

/**
 * Save new sort order (admin).
 */
export async function saveSortOrder(items: { id: string; sort_position: number }[]): Promise<void> {
  // Use a transaction-like approach: update each row
  const updates = items.map(item =>
    supabaseAdmin
      .from('products')
      .update({ sort_position: item.sort_position })
      .eq('id', item.id)
  );

  const results = await Promise.all(updates);
  const failed = results.find(r => r.error);
  if (failed?.error) throw failed.error;
}

/**
 * Soft-delete a product (admin).
 */
export async function softDeleteProduct(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('products')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}
