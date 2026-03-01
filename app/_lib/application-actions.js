/**
 * @file application actions
 * @module application-actions
 */

'use server';

import { supabaseAdmin } from '@/app/_lib/supabase';
import { revalidatePath } from 'next/cache';
import { requireAdmin, createLogger } from '@/app/_lib/helpers';

const logActivity = createLogger('join_request');

function revalidate() {
  revalidatePath('/account/admin/applications');
}

// =============================================================================
// APPROVE APPLICATION
// =============================================================================

export async function approveApplicationAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  if (!id) return { error: 'Application ID is required.' };

  const { data, error } = await supabaseAdmin
    .from('join_requests')
    .update({
      status: 'approved',
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: error.message };

  await logActivity(admin.id, 'application_approved', id, {
    applicant_email: data.email,
    applicant_name: data.name,
  });
  revalidate();
  return { success: true };
}

// =============================================================================
// REJECT APPLICATION
// =============================================================================

export async function rejectApplicationAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  const rejection_reason = formData.get('rejection_reason')?.trim() || null;
  if (!id) return { error: 'Application ID is required.' };

  const { data, error } = await supabaseAdmin
    .from('join_requests')
    .update({
      status: 'rejected',
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: error.message };

  await logActivity(admin.id, 'application_rejected', id, {
    applicant_email: data.email,
    reason: rejection_reason,
  });
  revalidate();
  return { success: true };
}

// =============================================================================
// RESET TO PENDING
// =============================================================================

export async function resetApplicationAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  if (!id) return { error: 'Application ID is required.' };

  const { error } = await supabaseAdmin
    .from('join_requests')
    .update({
      status: 'pending',
      reviewed_by: null,
      reviewed_at: null,
      rejection_reason: null,
    })
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'application_reset', id);
  revalidate();
  return { success: true };
}

// =============================================================================
// DELETE APPLICATION
// =============================================================================

export async function deleteApplicationAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  if (!id) return { error: 'Application ID is required.' };

  const { error } = await supabaseAdmin
    .from('join_requests')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'application_deleted', id);
  revalidate();
  return { success: true };
}

// =============================================================================
// BULK ACTIONS
// =============================================================================

export async function bulkApproveApplicationsAction(formData) {
  const admin = await requireAdmin();

  const idsRaw = formData.get('ids');
  if (!idsRaw) return { error: 'No IDs provided.' };

  let ids;
  try {
    ids = JSON.parse(idsRaw);
  } catch {
    return { error: 'Invalid IDs format.' };
  }
  if (!Array.isArray(ids) || ids.length === 0) return { error: 'No IDs.' };

  const { error } = await supabaseAdmin
    .from('join_requests')
    .update({
      status: 'approved',
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .in('id', ids);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'applications_bulk_approved', null, {
    count: ids.length,
  });
  revalidate();
  return { success: true, updated: ids.length };
}

export async function bulkRejectApplicationsAction(formData) {
  const admin = await requireAdmin();

  const idsRaw = formData.get('ids');
  const rejection_reason = formData.get('rejection_reason')?.trim() || null;
  if (!idsRaw) return { error: 'No IDs provided.' };

  let ids;
  try {
    ids = JSON.parse(idsRaw);
  } catch {
    return { error: 'Invalid IDs format.' };
  }
  if (!Array.isArray(ids) || ids.length === 0) return { error: 'No IDs.' };

  const { error } = await supabaseAdmin
    .from('join_requests')
    .update({
      status: 'rejected',
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason,
    })
    .in('id', ids);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'applications_bulk_rejected', null, {
    count: ids.length,
  });
  revalidate();
  return { success: true, updated: ids.length };
}

export async function bulkDeleteApplicationsAction(formData) {
  const admin = await requireAdmin();

  const idsRaw = formData.get('ids');
  if (!idsRaw) return { error: 'No IDs provided.' };

  let ids;
  try {
    ids = JSON.parse(idsRaw);
  } catch {
    return { error: 'Invalid IDs format.' };
  }
  if (!Array.isArray(ids) || ids.length === 0) return { error: 'No IDs.' };

  const { error } = await supabaseAdmin
    .from('join_requests')
    .delete()
    .in('id', ids);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'applications_bulk_deleted', null, {
    count: ids.length,
  });
  revalidate();
  return { success: true, deleted: ids.length };
}
