import { supabase } from './client';
import { supabaseAdmin } from './server';

// In-memory fallback when Supabase is not configured
let localDisabledCategories: string[] = [];

export async function getDisabledCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'disabled_categories')
      .single();

    if (error || !data) return localDisabledCategories;
    return Array.isArray(data.value) ? data.value : [];
  } catch {
    return localDisabledCategories;
  }
}

export async function setDisabledCategories(categories: string[]): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('settings')
      .upsert(
        { key: 'disabled_categories', value: categories, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) throw error;
  } catch {
    // Fall back to in-memory storage when Supabase admin is not configured
    localDisabledCategories = categories;
  }
}
