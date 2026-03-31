import { NextRequest, NextResponse } from 'next/server';
import { handleOAuthCallback } from '@/lib/quickbooks/client';

export async function GET(request: NextRequest) {
  try {
    // Verify CSRF state
    const returnedState = request.nextUrl.searchParams.get('state');
    const storedState = request.cookies.get('qb_oauth_state')?.value;

    if (!returnedState || !storedState || returnedState !== storedState) {
      const redirectUrl = new URL('/admin/quickbooks', request.nextUrl.origin);
      redirectUrl.searchParams.set('error', 'Invalid OAuth state — please try connecting again');
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.delete('qb_oauth_state');
      return response;
    }

    const url = request.url;
    const { companyId } = await handleOAuthCallback(url);

    // Redirect to admin QB page with success
    const redirectUrl = new URL('/admin/quickbooks', request.nextUrl.origin);
    redirectUrl.searchParams.set('connected', 'true');
    redirectUrl.searchParams.set('companyId', companyId);

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('qb_oauth_state');
    return response;
  } catch (error) {
    console.error('QB OAuth callback error:', error);

    const redirectUrl = new URL('/admin/quickbooks', request.nextUrl.origin);
    redirectUrl.searchParams.set('error', 'Failed to connect QuickBooks');

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('qb_oauth_state');
    return response;
  }
}
