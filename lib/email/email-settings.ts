import { supabase } from '../supabase/client';
import { supabaseAdmin } from '../supabase/server';

export interface EmailSettings {
  email_enabled: boolean;
  email_subject_quote: string;
  email_subject_order: string;
  company_phone: string;
  company_email: string;
  company_address: string;
  notification_emails: string;
}

const DEFAULTS: EmailSettings = {
  email_enabled: true,
  email_subject_quote: 'Your Catering Quote #{orderNumber} — Lexington Betty Smokehouse',
  email_subject_order: 'Your Catering Order #{orderNumber} — Lexington Betty Smokehouse',
  company_phone: '(312) 600-8155',
  company_email: 'orders@lexingtonbettycatering.com',
  company_address: '756 E. 111th St, Chicago, IL 60628',
  notification_emails: '',
};

// In-memory fallback
let localEmailSettings: EmailSettings = { ...DEFAULTS };

export async function getEmailSettings(): Promise<EmailSettings> {
  try {
    // Use admin client to avoid RLS restrictions
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'email_settings')
      .single();

    if (error || !data) return localEmailSettings;
    const merged = { ...DEFAULTS, ...(data.value as Partial<EmailSettings>) };
    localEmailSettings = merged;
    return merged;
  } catch {
    return localEmailSettings;
  }
}

export async function setEmailSettings(settings: Partial<EmailSettings>): Promise<void> {
  // Read current from DB first, then merge
  const current = await getEmailSettings();
  const merged = { ...current, ...settings };
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
