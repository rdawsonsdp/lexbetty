import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  resolveDraftOwner,
  unauthorizedResponse,
  isUuid,
  DRAFT_ROW_SELECT,
} from '@/lib/drafts';

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const owner = await resolveDraftOwner(request);
  if (!owner) return unauthorizedResponse();

  let lookup = supabaseAdmin
    .from('order_drafts')
    .select('name, state')
    .eq('id', id);
  lookup = owner.userId
    ? lookup.eq('user_id', owner.userId)
    : lookup.eq('anon_session_id', owner.anonSessionId);

  const { data: source, error: lookupError } = await lookup.maybeSingle();
  if (lookupError) {
    console.error('draft duplicate lookup error', lookupError);
    return NextResponse.json({ error: 'Failed to read source draft' }, { status: 500 });
  }
  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from('order_drafts')
    .insert({
      user_id: owner.userId,
      anon_session_id: owner.anonSessionId,
      name: `${source.name} (copy)`.slice(0, 200),
      state: source.state,
      is_active: false,
    })
    .select(DRAFT_ROW_SELECT)
    .single();

  if (error) {
    console.error('draft duplicate insert error', error);
    return NextResponse.json({ error: 'Failed to duplicate draft' }, { status: 500 });
  }

  return NextResponse.json({ draft: data });
}
