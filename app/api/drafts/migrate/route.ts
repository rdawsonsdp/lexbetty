import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { ANON_SESSION_COOKIE, isUuid } from '@/lib/drafts';

// Attaches any drafts owned by the current anon session cookie to the signed-in user.
// Called on the client right after a successful sign-in.
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const anonId = request.cookies.get(ANON_SESSION_COOKIE)?.value
    ?? cookieStore.get(ANON_SESSION_COOKIE)?.value
    ?? null;

  if (!isUuid(anonId)) {
    return NextResponse.json({ migrated: 0 });
  }

  const { data, error } = await supabaseAdmin
    .from('order_drafts')
    .update({ user_id: user.id, anon_session_id: null })
    .eq('anon_session_id', anonId)
    .is('user_id', null)
    .select('id');

  if (error) {
    console.error('draft migrate error', error);
    return NextResponse.json({ error: 'Failed to migrate drafts' }, { status: 500 });
  }

  return NextResponse.json({ migrated: data?.length ?? 0 });
}
