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
      entity_type: 'contact_submission',
      entity_id: entityId,
      details,
    });
  } catch {
    // non-critical
  }
}

function revalidate() {
  revalidatePath('/account/admin/contact-submissions');
}

// =============================================================================
// SUBMIT CONTACT FORM (Public — no auth required)
// =============================================================================

export async function submitContactFormAction(formData) {
  const name = formData.get('name')?.trim();
  const email = formData.get('email')?.trim();
  const subject = formData.get('subject')?.trim();
  const message = formData.get('message')?.trim();

  if (!name) return { error: 'Name is required.' };
  if (!email) return { error: 'Email is required.' };
  if (!message || message.length < 10)
    return { error: 'Message must be at least 10 characters.' };

  const payload = {
    name,
    email,
    subject: subject || null,
    message,
    status: 'new',
  };

  const { data, error } = await supabaseAdmin
    .from('contact_submissions')
    .insert([payload])
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, id: data.id };
}

// =============================================================================
// UPDATE STATUS
// =============================================================================

export async function updateContactStatusAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  const status = formData.get('status');

  if (!id) return { error: 'Submission ID is required.' };
  if (!['new', 'read', 'replied', 'archived'].includes(status))
    return { error: 'Invalid status.' };

  const updates = { status };

  if (status === 'replied') {
    updates.replied_by = admin.id;
    updates.replied_at = new Date().toISOString();
  }

  const { error } = await supabaseAdmin
    .from('contact_submissions')
    .update(updates)
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(admin.id, `contact_status_${status}`, id, { status });
  revalidate();
  return { success: true };
}

// =============================================================================
// MARK AS READ (when opened)
// =============================================================================

export async function markContactReadAction(id) {
  const admin = await requireAdmin();

  // Only transition new → read
  const { data: existing } = await supabaseAdmin
    .from('contact_submissions')
    .select('status')
    .eq('id', id)
    .single();

  if (existing?.status === 'new') {
    await supabaseAdmin
      .from('contact_submissions')
      .update({ status: 'read' })
      .eq('id', id);

    await logActivity(admin.id, 'contact_read', id);
    revalidate();
  }

  return { success: true };
}

// =============================================================================
// DELETE SUBMISSION
// =============================================================================

export async function deleteContactSubmissionAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  if (!id) return { error: 'Submission ID is required.' };

  const { error } = await supabaseAdmin
    .from('contact_submissions')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'contact_deleted', id);
  revalidate();
  return { success: true };
}

// =============================================================================
// BULK STATUS UPDATE
// =============================================================================

export async function bulkUpdateContactStatusAction(formData) {
  const admin = await requireAdmin();

  const idsRaw = formData.get('ids');
  const status = formData.get('status');

  if (!idsRaw) return { error: 'No IDs provided.' };
  if (!['new', 'read', 'replied', 'archived'].includes(status))
    return { error: 'Invalid status.' };

  let ids;
  try {
    ids = JSON.parse(idsRaw);
  } catch {
    return { error: 'Invalid IDs format.' };
  }

  if (!Array.isArray(ids) || ids.length === 0)
    return { error: 'No IDs provided.' };

  const updates = { status };
  if (status === 'replied') {
    updates.replied_by = admin.id;
    updates.replied_at = new Date().toISOString();
  }

  const { error } = await supabaseAdmin
    .from('contact_submissions')
    .update(updates)
    .in('id', ids);

  if (error) return { error: error.message };

  await logActivity(admin.id, `contact_bulk_${status}`, null, {
    ids,
    count: ids.length,
  });
  revalidate();
  return { success: true, updated: ids.length };
}

// =============================================================================
// BULK DELETE
// =============================================================================

export async function bulkDeleteContactSubmissionsAction(formData) {
  const admin = await requireAdmin();

  const idsRaw = formData.get('ids');
  if (!idsRaw) return { error: 'No IDs provided.' };

  let ids;
  try {
    ids = JSON.parse(idsRaw);
  } catch {
    return { error: 'Invalid IDs format.' };
  }

  if (!Array.isArray(ids) || ids.length === 0)
    return { error: 'No IDs provided.' };

  const { error } = await supabaseAdmin
    .from('contact_submissions')
    .delete()
    .in('id', ids);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'contact_bulk_deleted', null, {
    ids,
    count: ids.length,
  });
  revalidate();
  return { success: true, deleted: ids.length };
}
