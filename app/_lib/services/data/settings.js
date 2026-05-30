/**
 * @file settings data-access — split from the data-service module.
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';

// Get all settings.
export async function getAllSettings() {
  const { data, error } = await supabaseAdmin
    .from('website_settings')
    .select('*')
    .order('category');
  if (error) throw new Error(error.message);
  return data;
}

// Get settings by category.
export async function getSettingsByCategory(category) {
  const { data, error } = await supabaseAdmin
    .from('website_settings')
    .select('key, value')
    .eq('category', category);
  if (error) throw new Error(error.message);
  return data;
}

// Get a single setting by key.
export async function getSetting(key) {
  const { data, error } = await supabaseAdmin
    .from('website_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value ?? null;
}

// Insert or update a setting.
export async function upsertSetting(
  key,
  value,
  updatedBy,
  category = null,
  description = null
) {
  const { data, error } = await supabaseAdmin
    .from('website_settings')
    .upsert(
      {
        key,
        value,
        category,
        description,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Delete a setting.
export async function deleteSetting(key) {
  const { error } = await supabaseAdmin
    .from('website_settings')
    .delete()
    .eq('key', key);
  if (error) throw new Error(error.message);
  return { success: true };
}
