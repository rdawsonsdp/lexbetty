import OAuthClient from 'intuit-oauth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { QBTokens } from './types';

const QB_CLIENT_ID = process.env.QB_CLIENT_ID || '';
const QB_CLIENT_SECRET = process.env.QB_CLIENT_SECRET || '';
const QB_REDIRECT_URI = process.env.QB_REDIRECT_URI || '';
const QB_ENVIRONMENT = (process.env.QB_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';

let oauthClient: OAuthClient | null = null;

function getOAuthClient(): OAuthClient {
  if (!oauthClient) {
    if (!QB_CLIENT_ID || !QB_CLIENT_SECRET) {
      throw new Error('QuickBooks credentials not configured');
    }
    oauthClient = new OAuthClient({
      clientId: QB_CLIENT_ID,
      clientSecret: QB_CLIENT_SECRET,
      environment: QB_ENVIRONMENT,
      redirectUri: QB_REDIRECT_URI,
    });
  }
  return oauthClient;
}

/**
 * Generate the OAuth2 authorization URL for the admin to visit.
 */
export function getAuthorizationUrl(): string {
  const client = getOAuthClient();
  return client.authorizeUri({
    scope: [OAuthClient.scopes.Accounting],
    state: 'lexbetty-qb-connect',
  });
}

/**
 * Exchange the authorization code for tokens after OAuth2 callback.
 */
export async function handleOAuthCallback(url: string): Promise<{ companyId: string }> {
  const client = getOAuthClient();
  const authResponse = await client.createToken(url);
  const token = authResponse.getJson();

  const companyId = token.realmId || process.env.QB_COMPANY_ID || '';
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
async function getValidToken(): Promise<{ accessToken: string; companyId: string }> {
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
    const client = getOAuthClient();
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

    return { accessToken: newToken.access_token, companyId: tokens.company_id };
  }

  return { accessToken: tokens.access_token, companyId: tokens.company_id };
}

/**
 * Make an authenticated API call to QuickBooks Online.
 */
export async function qbApiCall(
  method: 'GET' | 'POST',
  endpoint: string,
  body?: unknown
): Promise<unknown> {
  const { accessToken, companyId } = await getValidToken();
  const baseUrl = QB_ENVIRONMENT === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com';

  const url = `${baseUrl}/v3/company/${companyId}/${endpoint}`;

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
 * Disconnect QuickBooks by removing tokens.
 */
export async function disconnectQB(): Promise<void> {
  await supabaseAdmin.from('qb_tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}
