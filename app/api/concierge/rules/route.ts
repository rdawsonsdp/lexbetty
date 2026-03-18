import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Public endpoint — returns only active rules for the AI prompt
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('concierge_rules')
      .select('category, rule')
      .eq('active', true)
      .order('category')
      .order('sort_order');

    if (error) throw error;
    return NextResponse.json({ rules: data || [] });
  } catch {
    // Return empty rules on error (concierge still works with defaults)
    return NextResponse.json({ rules: [] });
  }
}
