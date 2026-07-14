/**
 * @file guest actions
 * @module guest-actions
 */

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/app/_lib/auth/auth';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { getUserRoles, getUserByEmail } from '@/app/_lib/services/data-service';
import { sanitizeText } from '@/app/_lib/utils/validation';

async function requireGuest() {
  const session = await auth();
  if (!session?.user) throw new Error('Not authenticated');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('guest')) throw new Error('Not a guest user');

  const user = await getUserByEmail(session.user.email);
  if (!user) throw new Error('User not found');

  return user;
}

async function requireActiveGuest() {
  const user = await requireGuest();
  if (user.account_status !== 'active') throw new Error('Account not active');
  return user;
}

// ── Update basic info (full_name, phone, avatar_url) ─────────────────────────
export async function updateGuestInfoAction(formData) {
  try {
    const user = await requireActiveGuest();

    const full_name = sanitizeText(formData.get('full_name'), 100);
    const phone = sanitizeText(formData.get('phone'), 20) || null;

    const updates = { updated_at: new Date().toISOString() };
    if (full_name) updates.full_name = full_name;
    updates.phone = phone;

    const { error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('Guest info update error:', error);
      return { error: 'Failed to update profile.' };
    }

    revalidatePath('/account/guest/profile');
    revalidatePath('/account/guest/settings');
    revalidatePath('/account');
    return { success: true };
  } catch (err) {
    console.error('updateGuestInfoAction error:', err);
    return { error: 'An unexpected error occurred.' };
  }
}

// ── Mark notices as read (persisted per user) ────────────────────────────────
export async function markNoticesReadAction(noticeIds) {
  try {
    const user = await requireGuest();

    const ids = (Array.isArray(noticeIds) ? noticeIds : [noticeIds]).filter(
      (id) => typeof id === 'string' && id.length > 0
    );
    if (!ids.length) return { success: true };

    const rows = ids.map((notice_id) => ({ user_id: user.id, notice_id }));
    const { error } = await supabaseAdmin
      .from('notice_reads')
      .upsert(rows, { onConflict: 'user_id,notice_id', ignoreDuplicates: true });

    if (error) {
      console.error('markNoticesReadAction error:', error);
      return { error: 'Failed to save read state.' };
    }

    revalidatePath('/account/guest/notifications');
    return { success: true };
  } catch (err) {
    console.error('markNoticesReadAction error:', err);
    return { error: 'An unexpected error occurred.' };
  }
}

// ── Save notification preferences (users.notification_prefs jsonb) ───────────
const PREF_KEYS = [
  'emailNotices',
  'browserNotices',
  'eventReminders',
  'weeklyDigest',
];

export async function saveGuestNotificationPrefsAction(prefs) {
  try {
    const user = await requireGuest();

    const clean = {};
    for (const key of PREF_KEYS) {
      if (typeof prefs?.[key] === 'boolean') clean[key] = prefs[key];
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        notification_prefs: clean,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('saveGuestNotificationPrefsAction error:', error);
      return { error: 'Failed to save preferences.' };
    }

    revalidatePath('/account/guest/settings');
    return { success: true };
  } catch (err) {
    console.error('saveGuestNotificationPrefsAction error:', err);
    return { error: 'An unexpected error occurred.' };
  }
}

// ── Delete own guest account ──────────────────────────────────────────────────
export async function deleteGuestAccountAction() {
  try {
    const user = await requireGuest();

    // Remove dependent guest data first, then the user row.
    await supabaseAdmin
      .from('event_registrations')
      .delete()
      .eq('user_id', user.id);
    await supabaseAdmin.from('join_requests').delete().eq('email', user.email);

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', user.id);

    if (error) {
      console.error('deleteGuestAccountAction error:', error);
      return {
        error:
          'Could not delete your account automatically. Please contact an administrator.',
      };
    }

    return { success: true };
  } catch (err) {
    console.error('deleteGuestAccountAction error:', err);
    return { error: 'An unexpected error occurred.' };
  }
}
