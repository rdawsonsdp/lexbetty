import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase/server';

const VALID_CATEGORIES = ['portions', 'pricing', 'policies', 'service', 'custom'];

// GET — fetch all rules (admin sees all, including inactive)
export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('concierge_rules')
      .select('*')
      .order('category')
      .order('sort_order');

    if (error) throw error;
    return NextResponse.json({ rules: data });
  } catch (error) {
    console.error('Failed to fetch concierge rules:', error);
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}

// POST — create a new rule
export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { category, rule } = body;

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    if (!rule || typeof rule !== 'string' || rule.trim().length === 0) {
      return NextResponse.json({ error: 'Rule text is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('concierge_rules')
      .insert({ category, rule: rule.trim(), active: true })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ rule: data });
  } catch (error) {
    console.error('Failed to create rule:', error);
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
  }
}

// PUT — update an existing rule
export async function PUT(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, category, rule, active, sort_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
      updates.category = category;
    }
    if (rule !== undefined) updates.rule = rule.trim();
    if (active !== undefined) updates.active = active;
    if (sort_order !== undefined) updates.sort_order = sort_order;

    const { data, error } = await supabaseAdmin
      .from('concierge_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ rule: data });
  } catch (error) {
    console.error('Failed to update rule:', error);
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
  }
}

// DELETE — remove a rule
export async function DELETE(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('concierge_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete rule:', error);
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }
}
