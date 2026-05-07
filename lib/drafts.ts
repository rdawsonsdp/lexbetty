import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const ANON_SESSION_COOKIE = 'lb_anon_session';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): value is string {
  return !!value && UUID_RE.test(value);
}

export interface DraftOwner {
  userId: string | null;
  anonSessionId: string | null;
}

export async function resolveDraftOwner(request: NextRequest): Promise<DraftOwner | null> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only path for resolving the owner
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    return { userId: user.id, anonSessionId: null };
  }

  const anonId = request.cookies.get(ANON_SESSION_COOKIE)?.value
    ?? cookieStore.get(ANON_SESSION_COOKIE)?.value
    ?? null;

  if (!isUuid(anonId)) return null;
  return { userId: null, anonSessionId: anonId };
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'No draft owner — sign in or provide an anon session cookie' },
    { status: 401 }
  );
}

export const DRAFT_ROW_SELECT = 'id, name, state, is_active, created_at, updated_at, converted_order_id';
