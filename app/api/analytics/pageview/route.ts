import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, visitor_id, page_path, page_title, previous_pageview_id } = body;

    if (!session_id || !page_path) {
      return NextResponse.json({ error: 'session_id and page_path required' }, { status: 400 });
    }

    // Close previous pageview
    if (previous_pageview_id) {
      const now = new Date().toISOString();
      await supabaseAdmin
        .from('analytics_pageviews')
        .update({ exited_at: now })
        .eq('id', previous_pageview_id);
    }

    // Create new pageview
    const { data, error } = await supabaseAdmin
      .from('analytics_pageviews')
      .insert({
        session_id,
        visitor_id,
        page_path,
        page_title,
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ pageview_id: data.id });
  } catch (error) {
    console.error('Analytics pageview error:', error);
    return NextResponse.json({ error: 'Failed to record pageview' }, { status: 500 });
  }
}
