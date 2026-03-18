import { supabase } from './client';
import { supabaseAdmin } from './server';

// In-memory fallback when Supabase is not configured
let localDisabledCategories: string[] = [];

// --- Business Rules ---

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  value: number;
  unit: string;
  formula?: string;
  category?: string;
}

const DEFAULT_RULES: BusinessRule[] = [
  // --- Portion Sizing: Served oz per person by event type ---
  {
    id: 'portion-light',
    name: 'Light Event Portion',
    description: 'Served protein per person for lunch, light events, or appetizer-style service',
    value: 6,
    unit: 'oz per person',
    formula: 'served lbs per meat = (6 ÷ numberOfMeats × headcount) ÷ 16',
    category: 'Portion Sizing',
  },
  {
    id: 'portion-standard',
    name: 'Standard Event Portion',
    description: 'Served protein per person for standard dinner, corporate events, or general catering (default)',
    value: 9,
    unit: 'oz per person',
    formula: 'served lbs per meat = (9 ÷ numberOfMeats × headcount) ÷ 16',
    category: 'Portion Sizing',
  },
  {
    id: 'portion-heavy',
    name: 'Heavy Event Portion',
    description: 'Served protein per person for hungry crowds, big events, or BBQ-focused meals',
    value: 12,
    unit: 'oz per person',
    formula: 'served lbs per meat = (12 ÷ numberOfMeats × headcount) ÷ 16',
    category: 'Portion Sizing',
  },
  // --- Meat split rule ---
  {
    id: 'meat-split',
    name: 'Meat Split Rule',
    description: 'Total protein is split evenly across however many meats the customer selects',
    value: 0,
    unit: '',
    formula: 'oz per meat = total oz per person ÷ number of meats selected',
    category: 'Portion Sizing',
  },
];

let localRules: BusinessRule[] = [...DEFAULT_RULES];

export async function getBusinessRules(): Promise<BusinessRule[]> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'business_rules')
      .single();

    if (error || !data) return localRules;
    return Array.isArray(data.value) ? data.value : localRules;
  } catch {
    return localRules;
  }
}

export async function setBusinessRules(rules: BusinessRule[]): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('settings')
      .upsert(
        { key: 'business_rules', value: rules, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) throw error;
  } catch {
    localRules = rules;
  }
}

export async function getDisabledCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'disabled_categories')
      .single();

    if (error || !data) return localDisabledCategories;
    return Array.isArray(data.value) ? data.value : [];
  } catch {
    return localDisabledCategories;
  }
}

export async function setDisabledCategories(categories: string[]): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('settings')
      .upsert(
        { key: 'disabled_categories', value: categories, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) throw error;
  } catch {
    // Fall back to in-memory storage when Supabase admin is not configured
    localDisabledCategories = categories;
  }
}
