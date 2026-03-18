import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '7', 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Sessions
    const { data: sessions } = await supabaseAdmin
      .from('analytics_sessions')
      .select('id, visitor_id, session_start, duration_seconds, device_type, referrer, is_returning')
      .gte('session_start', since)
      .order('session_start', { ascending: false });

    const sessionList = sessions || [];
    const totalSessions = sessionList.length;
    const uniqueVisitors = new Set(sessionList.map(s => s.visitor_id)).size;
    const returningVisitors = sessionList.filter(s => s.is_returning).length;
    const avgDuration = totalSessions > 0
      ? Math.round(sessionList.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / totalSessions)
      : 0;

    // Device breakdown
    const mobile = sessionList.filter(s => s.device_type === 'mobile').length;
    const desktop = sessionList.filter(s => s.device_type === 'desktop').length;
    const tablet = sessionList.filter(s => s.device_type === 'tablet').length;

    // Top referrers
    const referrerCounts: Record<string, number> = {};
    sessionList.forEach(s => {
      const ref = s.referrer || 'Direct';
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
    });
    const topReferrers = Object.entries(referrerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([source, count]) => ({ source, count }));

    // Funnel data
    const { data: funnels } = await supabaseAdmin
      .from('analytics_funnels')
      .select('*')
      .gte('created_at', since);

    const funnelList = funnels || [];
    const funnel = {
      visited: funnelList.length,
      started_wizard: funnelList.filter(f => f.started_wizard).length,
      selected_event: funnelList.filter(f => f.selected_event_type).length,
      set_headcount: funnelList.filter(f => f.set_headcount).length,
      added_items: funnelList.filter(f => f.added_items).length,
      reached_checkout: funnelList.filter(f => f.reached_checkout).length,
      completed_order: funnelList.filter(f => f.completed_order).length,
    };

    // Recent orders from training data
    const { data: orders } = await supabaseAdmin
      .from('order_training_data')
      .select('order_number, headcount, order_total, is_quote, event_type, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20);

    const orderList = orders || [];
    const totalRevenue = orderList.reduce((sum, o) => sum + (parseFloat(o.order_total) || 0), 0);
    const avgOrderValue = orderList.length > 0 ? totalRevenue / orderList.length : 0;
    const conversionRate = totalSessions > 0
      ? Math.round((funnel.completed_order / totalSessions) * 10000) / 100
      : 0;

    // Top events
    const { data: topEvents } = await supabaseAdmin
      .from('analytics_events')
      .select('event_name')
      .gte('timestamp', since);

    const eventCounts: Record<string, number> = {};
    (topEvents || []).forEach((e: { event_name: string }) => {
      eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1;
    });
    const topEventsList = Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({ name, count }));

    // Popular products (from add_to_cart events)
    const { data: cartEvents } = await supabaseAdmin
      .from('analytics_events')
      .select('event_data')
      .eq('event_name', 'add_to_cart')
      .gte('timestamp', since);

    const productCounts: Record<string, { title: string; count: number }> = {};
    (cartEvents || []).forEach((e: { event_data: { product_id?: string; title?: string } | null }) => {
      const pid = e.event_data?.product_id;
      const title = e.event_data?.title || pid || 'Unknown';
      if (pid) {
        if (!productCounts[pid]) productCounts[pid] = { title, count: 0 };
        productCounts[pid].count++;
      }
    });
    const popularProducts = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      overview: {
        totalSessions,
        uniqueVisitors,
        returningVisitors,
        avgDuration,
        totalRevenue,
        avgOrderValue,
        conversionRate,
        ordersCompleted: funnel.completed_order,
      },
      devices: { mobile, desktop, tablet },
      topReferrers,
      funnel,
      topEvents: topEventsList,
      popularProducts,
      recentOrders: orderList,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
