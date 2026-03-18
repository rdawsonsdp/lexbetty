import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      visitor_id, device_type, browser, os,
      screen_width, screen_height, referrer,
      utm_source, utm_medium, utm_campaign, landing_page,
    } = body;

    if (!visitor_id) {
      return NextResponse.json({ error: 'visitor_id required' }, { status: 400 });
    }

    // Check if this visitor has been here before
    const { count } = await supabaseAdmin
      .from('analytics_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('visitor_id', visitor_id);

    const is_returning = (count || 0) > 0;

    const { data, error } = await supabaseAdmin
      .from('analytics_sessions')
      .insert({
        visitor_id,
        device_type,
        browser,
        os,
        screen_width,
        screen_height,
        referrer,
        utm_source,
        utm_medium,
        utm_campaign,
        landing_page,
        is_returning,
      })
      .select('id')
      .single();

    if (error) throw error;

    // Create funnel row
    await supabaseAdmin.from('analytics_funnels').insert({
      session_id: data.id,
      visitor_id,
      reached_homepage: landing_page === '/',
    });

    return NextResponse.json({ session_id: data.id });
  } catch (error) {
    console.error('Analytics session error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

// PATCH — update session heartbeat
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { session_id, exit_page, page_count, duration_seconds } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 });
    }

    await supabaseAdmin
      .from('analytics_sessions')
      .update({
        session_end: new Date().toISOString(),
        exit_page,
        page_count,
        duration_seconds,
      })
      .eq('id', session_id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
