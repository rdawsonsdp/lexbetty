import { supabaseAdmin } from '@/lib/supabase/server';

export interface QBCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}

const SETTINGS_KEY = 'qb_credentials';

function fromEnv(): QBCredentials {
  return {
    clientId: process.env.QB_CLIENT_ID || '',
    clientSecret: process.env.QB_CLIENT_SECRET || '',
    redirectUri: process.env.QB_REDIRECT_URI || '',
    environment: (process.env.QB_ENVIRONMENT === 'production' ? 'production' : 'sandbox'),
  };
}

/**
 * Load QB credentials from the settings table, falling back to env vars
 * for any field that isn't set in the database.
 */
export async function getQBCredentials(): Promise<QBCredentials> {
  const env = fromEnv();
  try {
    const { data } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .single();

    const stored = (data?.value || {}) as Partial<QBCredentials>;
    return {
      clientId: stored.clientId || env.clientId,
      clientSecret: stored.clientSecret || env.clientSecret,
      redirectUri: stored.redirectUri || env.redirectUri,
      environment: stored.environment === 'production' ? 'production' : (stored.environment === 'sandbox' ? 'sandbox' : env.environment),
    };
  } catch {
    return env;
  }
}

/**
 * Save QB credentials to the settings table. Empty strings are ignored so an
 * admin can update one field without re-entering the secret.
 */
export async function setQBCredentials(input: Partial<QBCredentials>): Promise<void> {
  const current = await getQBCredentialsRaw();
  const merged: QBCredentials = {
    clientId: input.clientId?.trim() || current.clientId,
    clientSecret: input.clientSecret?.trim() || current.clientSecret,
    redirectUri: input.redirectUri?.trim() || current.redirectUri,
    environment: input.environment === 'production' ? 'production' : input.environment === 'sandbox' ? 'sandbox' : current.environment,
  };

  const { error } = await supabaseAdmin
    .from('settings')
    .upsert(
      { key: SETTINGS_KEY, value: merged, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );

  if (error) throw new Error(`Failed to save QB credentials: ${error.message}`);
}

/**
 * Read only the row stored in the DB (no env fallback). Used internally so
 * partial updates don't accidentally pull env values into the saved row.
 */
async function getQBCredentialsRaw(): Promise<QBCredentials> {
  try {
    const { data } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .single();
    const stored = (data?.value || {}) as Partial<QBCredentials>;
    return {
      clientId: stored.clientId || '',
      clientSecret: stored.clientSecret || '',
      redirectUri: stored.redirectUri || '',
      environment: stored.environment === 'production' ? 'production' : 'sandbox',
    };
  } catch {
    return { clientId: '', clientSecret: '', redirectUri: '', environment: 'sandbox' };
  }
}

/**
 * Public-safe view of credentials — never exposes the raw client secret.
 */
export async function getQBCredentialsPublic(): Promise<{
  clientId: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
  hasClientSecret: boolean;
  source: { clientId: 'db' | 'env' | 'none'; clientSecret: 'db' | 'env' | 'none' };
}> {
  const env = fromEnv();
  const raw = await getQBCredentialsRaw();
  const merged = await getQBCredentials();
  return {
    clientId: merged.clientId,
    redirectUri: merged.redirectUri,
    environment: merged.environment,
    hasClientSecret: Boolean(merged.clientSecret),
    source: {
      clientId: raw.clientId ? 'db' : env.clientId ? 'env' : 'none',
      clientSecret: raw.clientSecret ? 'db' : env.clientSecret ? 'env' : 'none',
    },
  };
}
