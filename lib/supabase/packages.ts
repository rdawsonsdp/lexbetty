import { supabase } from './client';
import { supabaseAdmin } from './server';
import { CateringPackage, EventType } from '@/lib/types';
import { CATERING_PACKAGES } from '@/lib/packages';

// DB row shape
interface PackageRow {
  id: string;
  title: string;
  description: string;
  price_per_person: number;
  image: string;
  items: string[];
  categories: string[];
  min_headcount: number | null;
  max_headcount: number | null;
  is_active: boolean;
  sort_position: number;
  created_at: string;
  updated_at: string;
}

function rowToPackage(row: PackageRow): CateringPackage {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    pricePerPerson: Number(row.price_per_person),
    image: row.image,
    items: row.items,
    categories: row.categories as EventType[],
    minHeadcount: row.min_headcount ?? undefined,
    maxHeadcount: row.max_headcount ?? undefined,
  };
}

/**
 * Fetch active packages from Supabase. Falls back to hardcoded packages.
 */
export async function getPackagesFromDB(eventType?: EventType | null): Promise<CateringPackage[]> {
  try {
    let query = supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_position', { ascending: true });

    if (eventType) {
      query = query.contains('categories', [eventType]);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No packages found');

    return (data as PackageRow[]).map(rowToPackage);
  } catch (err) {
    console.warn('Supabase packages fetch failed, falling back to hardcoded packages:', err);
    if (eventType) {
      return CATERING_PACKAGES.filter(pkg => pkg.categories.includes(eventType));
    }
    return CATERING_PACKAGES;
  }
}

/**
 * Fetch all packages for admin (including inactive).
 */
export async function getAllPackagesForAdmin(): Promise<(CateringPackage & { is_active: boolean; sort_position: number })[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('packages')
      .select('*')
      .order('sort_position', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return (data as PackageRow[]).map(row => ({
      ...rowToPackage(row),
      is_active: row.is_active,
      sort_position: row.sort_position,
    }));
  } catch (err) {
    console.warn('Failed to fetch admin packages:', err);
    return CATERING_PACKAGES.map((pkg, i) => ({
      ...pkg,
      is_active: true,
      sort_position: i,
    }));
  }
}

/**
 * Upsert a package.
 */
export async function upsertPackage(pkg: CateringPackage, sortPosition: number = 0, isActive: boolean = true) {
  const row = {
    id: pkg.id,
    title: pkg.title,
    description: pkg.description,
    price_per_person: pkg.pricePerPerson,
    image: pkg.image,
    items: pkg.items,
    categories: pkg.categories,
    min_headcount: pkg.minHeadcount ?? null,
    max_headcount: pkg.maxHeadcount ?? null,
    is_active: isActive,
    sort_position: sortPosition,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('packages')
    .upsert(row, { onConflict: 'id' });

  if (error) throw error;
}
