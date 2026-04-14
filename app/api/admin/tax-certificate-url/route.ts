import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const path = new URL(request.url).searchParams.get('path');
  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.storage
    .from('tax-exempt-certificates')
    .createSignedUrl(path, 60 * 60); // 1 hour expiry

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
