import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { isQBConnected } from '@/lib/quickbooks/client';

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const status = await isQBConnected();
    return NextResponse.json(status);
  } catch (error) {
    console.error('QB status error:', error);
    return NextResponse.json({ connected: false });
  }
}
