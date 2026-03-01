/**
 * @file contact actions
 * @module contact-actions
 */

'use server';

import { supabaseAdmin } from '@/app/_lib/supabase';
import { revalidatePath } from 'next/cache';
import { requireAdmin, createLogger } from '@/app/_lib/helpers';
import { headers } from 'next/headers';
import { rateLimitPublicForm } from '@/app/_lib/rate-limiter';
import { sanitizeText, isValidEmail } from '@/app/_lib/validation';

const logActivity = createLogger('contact_submission');

function revalidate() {
  revalidatePath('/account/admin/contact-submissions');
}

// =============================================================================
// SUBMIT CONTACT FORM (Public — no auth required)
// =============================================================================

export async function submitContactFormAction(formData) {
  // Rate limit by IP
  const headersList = await headers();
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = rateLimitPublicForm(ip);
  if (rl.limited) {
    return { error: 'Too many submissions. Please try again later.' };
  }

  const name = sanitizeText(formData.get('name'), 100);
  const email = formData.get('email')?.trim();
  const subject = sanitizeText(formData.get('subject'), 200);
  const message = sanitizeText(formData.get('message'), 5000);

  if (!name) return { error: 'Name is required.' };
  if (!email || !isValidEmail(email))
    return { error: 'A valid email is required.' };
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

  if (error) {
    console.error('Contact form submission error:', error);
    return { error: 'Failed to submit your message. Please try again.' };
  }
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
