import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { getAuthorizationUrl } from '@/lib/quickbooks/client';

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { url, state } = getAuthorizationUrl();
    console.log('QB Auth URL redirect_uri:', process.env.QB_REDIRECT_URI);
    console.log('QB Auth URL full:', url);

    // Set the CSRF state in a short-lived cookie for verification in the callback
    const response = NextResponse.json({ authUrl: url });
    response.cookies.set('qb_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('QB authorize error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}
