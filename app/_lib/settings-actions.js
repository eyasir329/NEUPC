'use server';

import { supabaseAdmin } from './supabase';
import { revalidatePath } from 'next/cache';
import { auth } from './auth';
import { getUserByEmail } from './data-service';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');
  const user = await getUserByEmail(session.user.email);
  if (!user || user.account_status !== 'active' || !user.is_active)
    throw new Error('Unauthorized');
  return user;
}

/**
 * Save a batch of settings for a given category.
 * `entries` is an array of { key, value, description? }
 */
export async function saveSettingsAction(formData) {
  try {
    const user = await requireAdmin();
    const category = formData.get('category');
    const entriesRaw = formData.get('entries');
    if (!category || !entriesRaw) return { error: 'Invalid request' };

    const entries = JSON.parse(entriesRaw);

    const rows = entries.map(({ key, value, description }) => ({
      key,
      value, // jsonb accepts any JS value
      category,
      description: description || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from('website_settings')
      .upsert(rows, { onConflict: 'key' });

    if (error) return { error: error.message };

    revalidatePath('/account/admin/settings');
    return { success: true };
  } catch (err) {
    return { error: err.message || 'Failed to save settings' };
  }
}

/**
 * Reset all settings in a category to their defaults
 * by deleting all matching rows (they'll fall back to code defaults).
 */
export async function resetCategoryAction(formData) {
  try {
    await requireAdmin();
    const category = formData.get('category');
    if (!category) return { error: 'Invalid request' };

    const { error } = await supabaseAdmin
      .from('website_settings')
      .delete()
      .eq('category', category);

    if (error) return { error: error.message };

    revalidatePath('/account/admin/settings');
    return { success: true };
  } catch (err) {
    return { error: err.message || 'Failed to reset settings' };
  }
}
