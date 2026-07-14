/**
 * @file advisor actions
 * @module advisor-actions
 */

'use server';

import { auth } from '@/app/_lib/auth/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  approveJoinRequest,
  rejectJoinRequest,
  approveMemberProfile,
  approveBudgetEntry,
  createActivityLog,
  createAdvisorNote,
  setAdvisorNotePinned,
  deleteAdvisorNote,
  updateUser,
} from '@/app/_lib/services/data-service';
import { revalidatePath, revalidateTag } from 'next/cache';

// =============================================================================
// HELPERS
// =============================================================================

async function requireAdvisor() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');
  const roles = await getUserRoles(session.user.email);
  if (!roles.includes('advisor')) redirect('/account');
  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_online)
    redirect('/account');
  return user;
}

async function logDecision(userId, action, entityType, entityId, details = {}) {
  try {
    await createActivityLog(userId, action, entityType, entityId, details);
  } catch (err) {
    console.error('Advisor decision log error:', err);
  }
}

function revalidateApprovals() {
  revalidatePath('/account/advisor/approvals');
  revalidatePath('/account/advisor/analytics');
  revalidatePath('/account/advisor/club-overview');
  revalidatePath('/account/advisor');
  revalidatePath('/account/admin/users');
  revalidatePath('/account/executive/users');
  revalidatePath('/committee');
  revalidateTag('committee');
}

// =============================================================================
// JOIN REQUEST ACTIONS
// =============================================================================

export async function approveJoinRequestAction(formData) {
  const advisor = await requireAdvisor();
  const requestId = formData.get('requestId');

  if (!requestId) return { error: 'Request ID is required.' };

  try {
    await approveJoinRequest(requestId, advisor.id);
    await logDecision(
      advisor.id,
      'approve_join_request',
      'join_request',
      requestId
    );
    revalidateApprovals();
    return { success: 'Join request approved successfully.' };
  } catch (error) {
    console.error('Approve join request error:', error);
    return { error: 'Failed to approve join request.' };
  }
}

export async function rejectJoinRequestAction(formData) {
  const advisor = await requireAdvisor();
  const requestId = formData.get('requestId');
  const reason = formData.get('reason')?.trim();

  if (!requestId) return { error: 'Request ID is required.' };
  if (!reason) return { error: 'Rejection reason is required.' };

  try {
    await rejectJoinRequest(requestId, advisor.id, reason);
    await logDecision(
      advisor.id,
      'reject_join_request',
      'join_request',
      requestId,
      { reason }
    );
    revalidateApprovals();
    return { success: 'Join request rejected.' };
  } catch (error) {
    console.error('Reject join request error:', error);
    return { error: 'Failed to reject join request.' };
  }
}

// =============================================================================
// MEMBER PROFILE ACTIONS
// =============================================================================

export async function approveMemberProfileAction(formData) {
  const advisor = await requireAdvisor();
  const userId = formData.get('userId');

  if (!userId) return { error: 'User ID is required.' };

  try {
    await approveMemberProfile(userId, advisor.id);
    await logDecision(
      advisor.id,
      'approve_member_profile',
      'member_profile',
      userId
    );
    revalidateApprovals();
    return { success: 'Member profile approved successfully.' };
  } catch (error) {
    console.error('Approve member profile error:', error);
    return { error: 'Failed to approve member profile.' };
  }
}

// =============================================================================
// BUDGET ENTRY ACTIONS
// =============================================================================

export async function approveBudgetEntryAction(formData) {
  const advisor = await requireAdvisor();
  const entryId = formData.get('entryId');

  if (!entryId) return { error: 'Entry ID is required.' };

  try {
    await approveBudgetEntry(entryId, advisor.id);
    await logDecision(
      advisor.id,
      'approve_budget_entry',
      'budget_entry',
      entryId
    );
    revalidateApprovals();
    revalidatePath('/account/advisor/budget');
    return { success: 'Budget entry approved successfully.' };
  } catch (error) {
    console.error('Approve budget entry error:', error);
    return { error: 'Failed to approve budget entry.' };
  }
}

// =============================================================================
// ADVISORY NOTE ACTIONS
// =============================================================================

const NOTE_TAGS = ['Strategy', 'Membership', 'Budget', 'Policy'];

export async function createAdvisorNoteAction(formData) {
  const advisor = await requireAdvisor();
  const text = formData.get('text')?.trim();
  const tag = formData.get('tag');

  if (!text) return { error: 'Note text is required.' };
  if (text.length > 2000)
    return { error: 'Note is too long (max 2000 characters).' };

  try {
    const note = await createAdvisorNote(
      advisor.id,
      text,
      NOTE_TAGS.includes(tag) ? tag : 'Strategy'
    );
    revalidatePath('/account/advisor');
    return { success: 'Note saved.', note };
  } catch (error) {
    console.error('Create advisor note error:', error);
    return { error: 'Failed to save note.' };
  }
}

export async function toggleAdvisorNotePinAction(formData) {
  const advisor = await requireAdvisor();
  const noteId = formData.get('noteId');
  const pinned = formData.get('pinned') === 'true';

  if (!noteId) return { error: 'Note ID is required.' };

  try {
    await setAdvisorNotePinned(noteId, advisor.id, pinned);
    revalidatePath('/account/advisor');
    return { success: pinned ? 'Note pinned.' : 'Note unpinned.' };
  } catch (error) {
    console.error('Toggle advisor note pin error:', error);
    return { error: 'Failed to update note.' };
  }
}

export async function deleteAdvisorNoteAction(formData) {
  const advisor = await requireAdvisor();
  const noteId = formData.get('noteId');

  if (!noteId) return { error: 'Note ID is required.' };

  try {
    await deleteAdvisorNote(noteId, advisor.id);
    revalidatePath('/account/advisor');
    return { success: 'Note deleted.' };
  } catch (error) {
    console.error('Delete advisor note error:', error);
    return { error: 'Failed to delete note.' };
  }
}

// =============================================================================
// NOTIFICATION PREFERENCE ACTIONS
// =============================================================================

const ADVISOR_PREF_KEYS = [
  'pending_verifications',
  'budget_approvals',
  'committee_changes',
  'monthly_reports',
];

export async function saveAdvisorNotificationPrefsAction(prefs) {
  const advisor = await requireAdvisor();

  const clean = {};
  for (const key of ADVISOR_PREF_KEYS) {
    if (typeof prefs?.[key] === 'boolean') clean[key] = prefs[key];
  }

  try {
    await updateUser(advisor.id, {
      notification_prefs: {
        ...(advisor.notification_prefs || {}),
        ...clean,
      },
    });

    revalidatePath('/account/advisor/settings');
    return { success: 'Notification preferences saved.' };
  } catch (error) {
    console.error('Save advisor notification prefs error:', error);
    return { error: 'Failed to save preferences.' };
  }
}
