import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { getQBCredentialsPublic, setQBCredentials } from '@/lib/quickbooks/credentials';

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const creds = await getQBCredentialsPublic();
    return NextResponse.json(creds);
  } catch (error) {
    console.error('QB credentials GET error:', error);
    return NextResponse.json({ error: 'Failed to load credentials' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clientId, clientSecret, redirectUri, environment } = body || {};

    if (environment && environment !== 'sandbox' && environment !== 'production') {
      return NextResponse.json({ error: 'Invalid environment' }, { status: 400 });
    }

    await setQBCredentials({
      clientId,
      clientSecret,
      redirectUri,
      environment,
    });

    const creds = await getQBCredentialsPublic();
    return NextResponse.json({ success: true, credentials: creds });
  } catch (error) {
    console.error('QB credentials POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save credentials' },
      { status: 500 }
    );
  }
}
