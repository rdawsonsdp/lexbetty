import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  resolveDraftOwner,
  unauthorizedResponse,
  isUuid,
  DRAFT_ROW_SELECT,
} from '@/lib/drafts';

function ownerWhere(query: any, owner: { userId: string | null; anonSessionId: string | null }) {
  if (owner.userId) return query.eq('user_id', owner.userId);
  return query.eq('anon_session_id', owner.anonSessionId);
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const owner = await resolveDraftOwner(request);
  if (!owner) return unauthorizedResponse();

  const query = ownerWhere(
    supabaseAdmin.from('order_drafts').select(DRAFT_ROW_SELECT).eq('id', id),
    owner
  );
  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error('draft get error', error);
    return NextResponse.json({ error: 'Failed to load draft' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ draft: data });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const owner = await resolveDraftOwner(request);
  if (!owner) return unauthorizedResponse();

  const body = await request.json().catch(() => ({}));
  const update: Record<string, unknown> = {};

  if (typeof body?.name === 'string' && body.name.trim()) {
    update.name = body.name.trim().slice(0, 200);
  }
  if (body?.state !== undefined) {
    update.state = body.state;
  }
  if (typeof body?.is_active === 'boolean') {
    update.is_active = body.is_active;
  }
  if (typeof body?.converted_order_id === 'string' && isUuid(body.converted_order_id)) {
    update.converted_order_id = body.converted_order_id;
    update.is_active = false;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  // If activating this draft, deactivate any other active drafts for the owner.
  if (update.is_active === true) {
    const deactivate = supabaseAdmin
      .from('order_drafts')
      .update({ is_active: false })
      .eq('is_active', true)
      .neq('id', id);
    if (owner.userId) {
      await deactivate.eq('user_id', owner.userId);
    } else {
      await deactivate.eq('anon_session_id', owner.anonSessionId);
    }
  }

  const query = ownerWhere(
    supabaseAdmin.from('order_drafts').update(update).eq('id', id),
    owner
  );
  const { data, error } = await query.select(DRAFT_ROW_SELECT).maybeSingle();

  if (error) {
    console.error('draft update error', error);
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ draft: data });
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const owner = await resolveDraftOwner(request);
  if (!owner) return unauthorizedResponse();

  const query = ownerWhere(
    supabaseAdmin.from('order_drafts').delete().eq('id', id),
    owner
  );
  const { error } = await query;
  if (error) {
    console.error('draft delete error', error);
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
