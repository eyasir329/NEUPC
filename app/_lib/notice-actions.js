'use server';

import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import { supabaseAdmin } from '@/app/_lib/supabase';
import { revalidatePath } from 'next/cache';

// =============================================================================
// HELPERS
// =============================================================================

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');
  const roles = await getUserRoles(session.user.email);
  if (!roles.includes('admin')) redirect('/account');
  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active') redirect('/account');
  return user;
}

async function logActivity(userId, action, entityId, details = {}) {
  try {
    await supabaseAdmin.from('activity_logs').insert({
      user_id: userId,
      action,
      entity_type: 'notice',
      entity_id: entityId,
      details,
    });
  } catch {
    // non-critical
  }
}

function revalidate() {
  revalidatePath('/account/admin/notices');
  revalidatePath('/notices');
}

// =============================================================================
// CREATE NOTICE
// =============================================================================

export async function createNoticeAction(formData) {
  const admin = await requireAdmin();

  const title = formData.get('title')?.trim();
  const content = formData.get('content')?.trim();
  if (!title) return { error: 'Title is required.' };
  if (!content) return { error: 'Content is required.' };

  const rawAudience = formData.get('target_audience') || '';
  const target_audience = rawAudience
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);

  const rawAttachments = formData.get('attachments') || '';
  const attachments = rawAttachments
    .split('\n')
    .map((a) => a.trim())
    .filter(Boolean);

  const payload = {
    title,
    content,
    notice_type: formData.get('notice_type') || 'general',
    priority: formData.get('priority') || 'medium',
    target_audience: target_audience.length ? target_audience : null,
    is_pinned: formData.get('is_pinned') === 'true',
    expires_at: formData.get('expires_at') || null,
    attachments: attachments.length ? attachments : null,
    created_by: admin.id,
  };

  const { data, error } = await supabaseAdmin
    .from('notices')
    .insert([payload])
    .select()
    .single();

  if (error) return { error: error.message };

  await logActivity(admin.id, 'notice_created', data.id, { title });
  revalidate();
  return { success: true, id: data.id };
}

// =============================================================================
// UPDATE NOTICE
// =============================================================================

export async function updateNoticeAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  if (!id) return { error: 'Notice ID is required.' };

  const title = formData.get('title')?.trim();
  const content = formData.get('content')?.trim();
  if (!title) return { error: 'Title is required.' };
  if (!content) return { error: 'Content is required.' };

  const rawAudience = formData.get('target_audience') || '';
  const target_audience = rawAudience
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);

  const rawAttachments = formData.get('attachments') || '';
  const attachments = rawAttachments
    .split('\n')
    .map((a) => a.trim())
    .filter(Boolean);

  const payload = {
    title,
    content,
    notice_type: formData.get('notice_type') || 'general',
    priority: formData.get('priority') || 'medium',
    target_audience: target_audience.length ? target_audience : null,
    is_pinned: formData.get('is_pinned') === 'true',
    expires_at: formData.get('expires_at') || null,
    attachments: attachments.length ? attachments : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('notices')
    .update(payload)
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'notice_updated', id, { title });
  revalidate();
  return { success: true };
}

// =============================================================================
// DELETE NOTICE
// =============================================================================

export async function deleteNoticeAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  if (!id) return { error: 'Notice ID is required.' };

  const { error } = await supabaseAdmin.from('notices').delete().eq('id', id);
  if (error) return { error: error.message };

  await logActivity(admin.id, 'notice_deleted', id, {});
  revalidate();
  return { success: true };
}

// =============================================================================
// TOGGLE PIN
// =============================================================================

export async function toggleNoticePinAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  const pinned = formData.get('pinned') === 'true';
  if (!id) return { error: 'Notice ID is required.' };

  const { error } = await supabaseAdmin
    .from('notices')
    .update({ is_pinned: pinned, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(admin.id, pinned ? 'notice_pinned' : 'notice_unpinned', id, {});
  revalidate();
  return { success: true };
}
