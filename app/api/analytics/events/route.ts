import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, visitor_id, events } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'Events array required' }, { status: 400 });
    }

    // Limit batch size
    if (events.length > 50) {
      return NextResponse.json({ error: 'Max 50 events per batch' }, { status: 400 });
    }

    const rows = events.map((e: { event_name: string; event_category?: string; event_data?: Record<string, unknown>; page_path?: string; timestamp?: string }) => ({
      session_id,
      visitor_id,
      event_name: e.event_name,
      event_category: e.event_category || null,
      event_data: e.event_data || null,
      page_path: e.page_path || null,
      timestamp: e.timestamp || new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from('analytics_events')
      .insert(rows);

    if (error) throw error;

    // Update funnel based on events
    const funnelUpdates: Record<string, boolean | string | number> = {};
    for (const e of events) {
      switch (e.event_name) {
        case 'plan_event_click':
          funnelUpdates.started_wizard = true;
          break;
        case 'select_event_type':
          funnelUpdates.selected_event_type = true;
          break;
        case 'set_headcount':
          funnelUpdates.set_headcount = true;
          break;
        case 'select_order_type':
          funnelUpdates.selected_order_type = true;
          break;
        case 'add_to_cart':
          funnelUpdates.added_items = true;
          break;
        case 'proceed_to_checkout':
          funnelUpdates.reached_checkout = true;
          break;
        case 'order_confirmed':
          funnelUpdates.completed_order = true;
          if (e.event_data?.order_number) funnelUpdates.order_number = e.event_data.order_number;
          if (e.event_data?.total) funnelUpdates.order_total = e.event_data.total;
          if (e.event_data?.order_type) funnelUpdates.order_type = e.event_data.order_type;
          break;
      }
    }

    if (Object.keys(funnelUpdates).length > 0 && session_id) {
      funnelUpdates.updated_at = new Date().toISOString();
      await supabaseAdmin
        .from('analytics_funnels')
        .update(funnelUpdates)
        .eq('session_id', session_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics events error:', error);
    return NextResponse.json({ error: 'Failed to record events' }, { status: 500 });
  }
}
