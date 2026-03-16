import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { getEmailSettings, setEmailSettings } from '@/lib/email/email-settings';

export async function GET() {
  const settings = await getEmailSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const authorized = await isAdminAuthorized(request);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    await setEmailSettings(body);
    const updated = await getEmailSettings();
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
