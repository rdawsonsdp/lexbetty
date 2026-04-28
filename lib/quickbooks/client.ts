import OAuthClient from 'intuit-oauth';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/server';
import { QBTokens } from './types';
import { getQBCredentials } from './credentials';

const QB_API_MINOR_VERSION = '65';

async function getOAuthClient(): Promise<{ client: OAuthClient; environment: 'sandbox' | 'production'; clientId: string; clientSecret: string }> {
  const creds = await getQBCredentials();
  if (!creds.clientId || !creds.clientSecret) {
    throw new Error('QuickBooks credentials not configured. Add them on the QuickBooks admin page.');
  }
  if (!creds.redirectUri) {
    throw new Error('QuickBooks redirect URI not configured. Add it on the QuickBooks admin page.');
  }
  // Always create fresh — avoids stale redirect URI on serverless warm starts
  const client = new OAuthClient({
    clientId: creds.clientId,
    clientSecret: creds.clientSecret,
    environment: creds.environment,
    redirectUri: creds.redirectUri,
  });
  return { client, environment: creds.environment, clientId: creds.clientId, clientSecret: creds.clientSecret };
}

/**
 * Generate the OAuth2 authorization URL with CSRF-safe random state.
 */
export async function getAuthorizationUrl(): Promise<{ url: string; state: string }> {
  const { client } = await getOAuthClient();
  const state = crypto.randomBytes(16).toString('hex');
  const url = client.authorizeUri({
    scope: [OAuthClient.scopes.Accounting],
    state,
  });
  return { url, state };
}

/**
 * Exchange the authorization code for tokens after OAuth2 callback.
 */
export async function handleOAuthCallback(url: string): Promise<{ companyId: string }> {
  const { client } = await getOAuthClient();
  const authResponse = await client.createToken(url);
  const token = authResponse.getJson();

  // intuit-oauth's getJson() doesn't always surface realmId — fall back to URL param
  let realmIdFromUrl = '';
  try {
    realmIdFromUrl = new URL(url).searchParams.get('realmId') || '';
  } catch {
    // ignore
  }

  const companyId = token.realmId || realmIdFromUrl || process.env.QB_COMPANY_ID || '';
  if (!companyId) {
    throw new Error('QuickBooks did not return a company ID (realmId).');
  }
  const now = new Date();

  // Access token expires in ~1 hour, refresh token in ~101 days
  const accessTokenExpiresAt = new Date(now.getTime() + (token.expires_in || 3600) * 1000);
  const refreshTokenExpiresAt = new Date(now.getTime() + (token.x_refresh_token_expires_in || 8726400) * 1000);

  // Store tokens in Supabase
  const { error } = await supabaseAdmin
    .from('qb_tokens')
    .upsert({
      company_id: companyId,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      access_token_expires_at: accessTokenExpiresAt.toISOString(),
      refresh_token_expires_at: refreshTokenExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id' });

  if (error) throw new Error(`Failed to store QB tokens: ${error.message}`);

  return { companyId };
}

/**
 * Get a valid access token, refreshing if needed.
 */
async function getValidToken(): Promise<{ accessToken: string; companyId: string; environment: 'sandbox' | 'production' }> {
  const { data, error } = await supabaseAdmin
    .from('qb_tokens')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error('QuickBooks not connected. Please authorize in the admin panel.');
  }

  const tokens = data as QBTokens;
  const now = new Date();
  const expiresAt = new Date(tokens.access_token_expires_at);

  // If access token expires within 5 minutes, refresh it
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    const { client, environment } = await getOAuthClient();
    client.setToken({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: 'bearer',
      expires_in: 3600,
      x_refresh_token_expires_in: 8726400,
      realmId: tokens.company_id,
    });

    const refreshResponse = await client.refresh();
    const newToken = refreshResponse.getJson();

    const newAccessExpiresAt = new Date(now.getTime() + (newToken.expires_in || 3600) * 1000);
    const newRefreshExpiresAt = new Date(now.getTime() + (newToken.x_refresh_token_expires_in || 8726400) * 1000);

    await supabaseAdmin
      .from('qb_tokens')
      .update({
        access_token: newToken.access_token,
        refresh_token: newToken.refresh_token,
        access_token_expires_at: newAccessExpiresAt.toISOString(),
        refresh_token_expires_at: newRefreshExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('company_id', tokens.company_id);

    return { accessToken: newToken.access_token, companyId: tokens.company_id, environment };
  }

  const creds = await getQBCredentials();
  return { accessToken: tokens.access_token, companyId: tokens.company_id, environment: creds.environment };
}

/**
 * Make an authenticated API call to QuickBooks Online.
 */
export async function qbApiCall(
  method: 'GET' | 'POST',
  endpoint: string,
  body?: unknown
): Promise<unknown> {
  const { accessToken, companyId, environment } = await getValidToken();
  const baseUrl = environment === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com';

  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${baseUrl}/v3/company/${companyId}/${endpoint}${separator}minorversion=${QB_API_MINOR_VERSION}`;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QB API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Check if QuickBooks is connected (valid tokens exist).
 */
export async function isQBConnected(): Promise<{ connected: boolean; companyId?: string; expiresAt?: string }> {
  try {
    const { data } = await supabaseAdmin
      .from('qb_tokens')
      .select('company_id, refresh_token_expires_at')
      .limit(1)
      .single();

    if (!data) return { connected: false };

    const refreshExpires = new Date(data.refresh_token_expires_at);
    if (refreshExpires < new Date()) {
      return { connected: false };
    }

    return {
      connected: true,
      companyId: data.company_id,
      expiresAt: data.refresh_token_expires_at,
    };
  } catch {
    return { connected: false };
  }
}

/**
 * Disconnect QuickBooks by revoking tokens with Intuit, then deleting locally.
 */
export async function disconnectQB(): Promise<void> {
  try {
    const { data } = await supabaseAdmin
      .from('qb_tokens')
      .select('access_token, refresh_token, company_id')
      .limit(1)
      .single();

    if (data) {
      const creds = await getQBCredentials().catch(() => null);
      if (creds?.clientId && creds?.clientSecret) {
        // Revoke token with Intuit's revocation endpoint (best-effort)
        const revokeUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/revoke';
        const basicAuth = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64');
        await fetch(revokeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${basicAuth}`,
          },
          body: JSON.stringify({ token: data.access_token }),
        }).catch(() => {
          // Revocation is best-effort — still delete locally
        });
      }
    }
  } catch {
    // Continue with local deletion even if revocation fails
  }

  await supabaseAdmin.from('qb_tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}
