'use server';

import { revalidatePath } from 'next/cache';
import { auth } from './auth';
import { supabaseAdmin } from './supabase';
import { getUserRoles, getUserByEmail } from './data-service';

async function requireActiveGuest() {
  const session = await auth();
  if (!session?.user) throw new Error('Not authenticated');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('guest')) throw new Error('Not a guest user');

  const user = await getUserByEmail(session.user.email);
  if (!user) throw new Error('User not found');
  if (user.account_status !== 'active') throw new Error('Account not active');

  return user;
}

// ── Update basic info (full_name, phone, avatar_url) ─────────────────────────
export async function updateGuestInfoAction(formData) {
  try {
    const user = await requireActiveGuest();

    const full_name = formData.get('full_name')?.trim();
    const phone = formData.get('phone')?.trim() || null;
    const avatar_url = formData.get('avatar_url')?.trim() || null;

    const updates = { updated_at: new Date().toISOString() };
    if (full_name) updates.full_name = full_name;
    updates.phone = phone;
    if (avatar_url !== null) updates.avatar_url = avatar_url;

    const { error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) return { error: error.message };

    revalidatePath('/account/guest/profile');
    revalidatePath('/account/guest/settings');
    revalidatePath('/account');
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}
