import { supabase } from './client';
import { supabaseAdmin } from './server';

export async function getDisabledCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'disabled_categories')
    .single();

  if (error || !data) return [];
  return Array.isArray(data.value) ? data.value : [];
}

export async function setDisabledCategories(categories: string[]): Promise<void> {
  const { error } = await supabaseAdmin
    .from('settings')
    .upsert(
      { key: 'disabled_categories', value: categories, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );

  if (error) throw new Error(`Failed to save disabled categories: ${error.message}`);
}
