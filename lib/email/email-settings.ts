import { supabase } from '../supabase/client';
import { supabaseAdmin } from '../supabase/server';

export interface EmailSettings {
  email_enabled: boolean;
  email_subject_quote: string;
  email_subject_order: string;
  company_phone: string;
  company_email: string;
  company_address: string;
}

const DEFAULTS: EmailSettings = {
  email_enabled: true,
  email_subject_quote: 'Your Catering Quote #{orderNumber} — Lexington Betty Smokehouse',
  email_subject_order: 'Your Catering Order #{orderNumber} — Lexington Betty Smokehouse',
  company_phone: '(312) 600-8155',
  company_email: 'orders@lexingtonbettycatering.com',
  company_address: '756 E. 111th St, Chicago, IL 60628',
};

// In-memory fallback
let localEmailSettings: EmailSettings = { ...DEFAULTS };

export async function getEmailSettings(): Promise<EmailSettings> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'email_settings')
      .single();

    if (error || !data) return localEmailSettings;
    return { ...DEFAULTS, ...(data.value as Partial<EmailSettings>) };
  } catch {
    return localEmailSettings;
  }
}

export async function setEmailSettings(settings: Partial<EmailSettings>): Promise<void> {
  const merged = { ...localEmailSettings, ...settings };
  try {
    const { error } = await supabaseAdmin
      .from('settings')
      .upsert(
        { key: 'email_settings', value: merged, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) throw error;
    localEmailSettings = merged;
  } catch {
    localEmailSettings = merged;
  }
}

export function getDefaultEmailSettings(): EmailSettings {
  return { ...DEFAULTS };
}
