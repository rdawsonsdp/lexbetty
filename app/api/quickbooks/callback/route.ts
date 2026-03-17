import { NextRequest, NextResponse } from 'next/server';
import { handleOAuthCallback } from '@/lib/quickbooks/client';

export async function GET(request: NextRequest) {
  try {
    const url = request.url;
    const { companyId } = await handleOAuthCallback(url);

    // Redirect to admin QB page with success
    const redirectUrl = new URL('/admin/quickbooks', request.nextUrl.origin);
    redirectUrl.searchParams.set('connected', 'true');
    redirectUrl.searchParams.set('companyId', companyId);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('QB OAuth callback error:', error);

    const redirectUrl = new URL('/admin/quickbooks', request.nextUrl.origin);
    redirectUrl.searchParams.set('error', 'Failed to connect QuickBooks');

    return NextResponse.redirect(redirectUrl);
  }
}
