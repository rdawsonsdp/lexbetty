import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { getAuthorizationUrl } from '@/lib/quickbooks/client';

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const authUrl = getAuthorizationUrl();
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('QB authorize error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}
