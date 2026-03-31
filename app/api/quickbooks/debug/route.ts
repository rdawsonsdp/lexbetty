import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.QB_CLIENT_ID || 'NOT SET';
  const redirectUri = process.env.QB_REDIRECT_URI || 'NOT SET';
  const environment = process.env.QB_ENVIRONMENT || 'NOT SET';
  const hasSecret = !!process.env.QB_CLIENT_SECRET;

  return NextResponse.json({
    QB_CLIENT_ID: clientId,
    QB_CLIENT_SECRET: hasSecret ? '***set***' : '***MISSING***',
    QB_REDIRECT_URI: redirectUri,
    QB_ENVIRONMENT: environment,
  });
}
