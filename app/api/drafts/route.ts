import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { resolveDraftOwner, unauthorizedResponse, DRAFT_ROW_SELECT } from '@/lib/drafts';

export async function GET(request: NextRequest) {
  const owner = await resolveDraftOwner(request);
  if (!owner) return unauthorizedResponse();

  let query = supabaseAdmin
    .from('order_drafts')
    .select(DRAFT_ROW_SELECT)
    .is('converted_order_id', null)
    .order('updated_at', { ascending: false });

  if (owner.userId) {
    query = query.eq('user_id', owner.userId);
  } else {
    query = query.eq('anon_session_id', owner.anonSessionId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('drafts list error', error);
    return NextResponse.json({ error: 'Failed to load drafts' }, { status: 500 });
  }

  return NextResponse.json({ drafts: data ?? [] });
}

export async function POST(request: NextRequest) {
  const owner = await resolveDraftOwner(request);
  if (!owner) return unauthorizedResponse();

  const body = await request.json().catch(() => ({}));
  const name: string = typeof body?.name === 'string' && body.name.trim()
    ? body.name.trim().slice(0, 200)
    : 'Untitled draft';
  const state = body?.state ?? {};
  const setActive = body?.is_active !== false;

  if (setActive) {
    const deactivate = supabaseAdmin
      .from('order_drafts')
      .update({ is_active: false })
      .eq('is_active', true);
    if (owner.userId) {
      await deactivate.eq('user_id', owner.userId);
    } else {
      await deactivate.eq('anon_session_id', owner.anonSessionId);
    }
  }

  const { data, error } = await supabaseAdmin
    .from('order_drafts')
    .insert({
      user_id: owner.userId,
      anon_session_id: owner.anonSessionId,
      name,
      state,
      is_active: setActive,
    })
    .select(DRAFT_ROW_SELECT)
    .single();

  if (error) {
    console.error('drafts create error', error);
    return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 });
  }

  return NextResponse.json({ draft: data });
}
