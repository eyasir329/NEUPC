'use server';

import { auth } from '@/app/_lib/auth';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/app/_lib/supabase';

// ─── helpers ────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error('Not authenticated');

  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single();

  if (!userData) throw new Error('User not found');

  const { data: roles } = await supabaseAdmin
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userData.id);

  const roleNames = roles?.map((r) => r.roles?.name) || [];
  if (!roleNames.includes('admin')) throw new Error('Unauthorized');

  return { adminId: userData.id };
}

async function logActivity(userId, action, entityType, entityId, details = {}) {
  try {
    await supabaseAdmin.from('activity_logs').insert([
      {
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
      },
    ]);
  } catch (_) {}
}

// ─── actions ────────────────────────────────────────────────

export async function suspendUserAction(formData) {
  const { adminId } = await requireAdmin();
  const userId = formData.get('userId');
  const reason = formData.get('reason') || 'Suspended by admin';
  const expiresAt = formData.get('expiresAt');

  if (!expiresAt) throw new Error('Suspension expiry date is required.');

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      account_status: 'suspended',
      status_reason: reason,
      status_changed_by: adminId,
      status_changed_at: new Date().toISOString(),
      suspension_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);
  await logActivity(adminId, 'suspend_user', 'user', userId, {
    reason,
    expiresAt,
  });
  revalidatePath('/account/admin/users');
  revalidatePath('/account');
  return { success: true };
}

export async function activateUserAction(formData) {
  const { adminId } = await requireAdmin();
  const userId = formData.get('userId');
  const reason = formData.get('reason') || 'Account activated by admin';

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      account_status: 'active',
      status_reason: reason,
      status_changed_by: adminId,
      status_changed_at: new Date().toISOString(),
      suspension_expires_at: null,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);
  await logActivity(adminId, 'activate_user', 'user', userId, { reason });
  revalidatePath('/account/admin/users');
  revalidatePath('/account');
  return { success: true };
}

export async function banUserAction(formData) {
  const { adminId } = await requireAdmin();
  const userId = formData.get('userId');
  const reason = formData.get('reason') || 'Banned by admin';

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      account_status: 'banned',
      status_reason: reason,
      status_changed_by: adminId,
      status_changed_at: new Date().toISOString(),
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);
  await logActivity(adminId, 'ban_user', 'user', userId, { reason });
  revalidatePath('/account/admin/users');
  revalidatePath('/account');
  return { success: true };
}

export async function deleteUserAction(formData) {
  const { adminId } = await requireAdmin();
  const userId = formData.get('userId');
  const reason = formData.get('reason') || 'Account deleted by admin';

  // Soft-delete — mark as banned/inactive in DB
  // (Hard auth deletion requires service role key; skip if not available)
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      account_status: 'banned',
      is_active: false,
      status_reason: reason,
      status_changed_by: adminId,
      status_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);
  await logActivity(adminId, 'delete_user', 'user', userId, { reason });
  revalidatePath('/account/admin/users');
  revalidatePath('/account');
  return { success: true };
}

export async function changeUserRoleAction(formData) {
  const { adminId } = await requireAdmin();
  const userId = formData.get('userId');
  const newRole = formData.get('role');

  // Get role id
  const { data: roleData, error: roleErr } = await supabaseAdmin
    .from('roles')
    .select('id')
    .eq('name', newRole)
    .single();

  if (roleErr || !roleData) throw new Error(`Invalid role: ${newRole}`);

  // Replace all existing roles with the new one
  await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);

  const { error } = await supabaseAdmin
    .from('user_roles')
    .insert({ user_id: userId, role_id: roleData.id, assigned_by: adminId });

  if (error) throw new Error(error.message);
  await logActivity(adminId, 'change_role', 'user', userId, { newRole });
  revalidatePath('/account/admin/users');
  revalidatePath('/account');
  return { success: true };
}

// Guest approval: activate account + assign guest role (no member_profiles touch)
export async function approveMemberAction(formData) {
  const { adminId } = await requireAdmin();
  const userId = formData.get('userId');

  const { error: userError } = await supabaseAdmin
    .from('users')
    .update({
      account_status: 'active',
      is_active: true,
      status_reason: 'Guest application approved',
      status_changed_by: adminId,
      status_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (userError) throw new Error(userError.message);

  // Assign guest role (id: b5d15e4f-2f14-431d-b035-f8557bc86e96)
  await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
  const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
    user_id: userId,
    role_id: 'b5d15e4f-2f14-431d-b035-f8557bc86e96',
    assigned_by: adminId,
  });
  if (roleError) throw new Error(roleError.message);

  await logActivity(adminId, 'approve_guest', 'user', userId, {});
  revalidatePath('/account/admin/users');
  revalidatePath('/account');
  return { success: true };
}

// Membership approval: fetch join_request data → build full member_profiles + activate account + assign member role
export async function approveMembershipAction(formData) {
  const { adminId } = await requireAdmin();
  const userId = formData.get('userId');

  // Get user email to look up their join_request
  const { data: userRecord } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();

  if (!userRecord) throw new Error('User not found');

  // Fetch latest pending join_request for this user
  const { data: joinRequest } = await supabaseAdmin
    .from('join_requests')
    .select('*')
    .eq('email', userRecord.email)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Build full member_profiles from join_request data
  const interests = joinRequest?.interests
    ? joinRequest.interests
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  const { error: profileError } = await supabaseAdmin
    .from('member_profiles')
    .upsert(
      {
        user_id: userId,
        student_id: joinRequest?.student_id,
        batch: joinRequest?.batch,
        department: joinRequest?.department,
        github: joinRequest?.github || null,
        codeforces_handle: joinRequest?.codeforces_handle || null,
        interests,
        join_reason: joinRequest?.reason || null,
        approved: true,
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (profileError) throw new Error(profileError.message);

  // Mark join_request as approved
  if (joinRequest?.id) {
    await supabaseAdmin
      .from('join_requests')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', joinRequest.id);
  }

  // account_status stays 'active' (already set when guest was approved).
  // Set is_active: true so the member dashboard guard passes.
  await supabaseAdmin
    .from('users')
    .update({
      is_active: true,
      status_reason: 'Membership approved',
      status_changed_by: adminId,
      status_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  // Assign member role (id: a5b04180-46fc-4da1-bd14-df20a9c60a7d)
  await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
  const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
    user_id: userId,
    role_id: 'a5b04180-46fc-4da1-bd14-df20a9c60a7d',
    assigned_by: adminId,
  });
  if (roleError) throw new Error(roleError.message);

  await logActivity(
    adminId,
    'approve_membership',
    'member_profile',
    userId,
    {}
  );
  revalidatePath('/account/admin/users');
  revalidatePath('/account');
  return { success: true };
}

// Guest rejection: set account_status to rejected — no member_profiles touch
export async function rejectGuestAction(formData) {
  const { adminId } = await requireAdmin();
  const userId = formData.get('userId');
  const reason = formData.get('reason') || 'Guest application rejected';

  const { error: userError } = await supabaseAdmin
    .from('users')
    .update({
      account_status: 'rejected',
      status_reason: reason,
      status_changed_by: adminId,
      status_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (userError) throw new Error(userError.message);

  await logActivity(adminId, 'reject_guest', 'user', userId, { reason });
  revalidatePath('/account/admin/users');
  revalidatePath('/account');
  return { success: true };
}

export async function rejectMemberAction(formData) {
  const { adminId } = await requireAdmin();
  const userId = formData.get('userId');
  const reason = formData.get('reason') || 'Membership application rejected';

  // Fetch email first before any destructive operations
  const { data: userRecord } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();

  // Remove the member_profiles record entirely
  const { error } = await supabaseAdmin
    .from('member_profiles')
    .delete()
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  // Note: account_status is NOT changed here — the user remains an active guest.
  // Rejecting a membership application does not revoke their guest status.

  // Mark the latest pending join_request as rejected
  if (userRecord?.email) {
    await supabaseAdmin
      .from('join_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('email', userRecord.email)
      .eq('status', 'pending');
  }

  await logActivity(adminId, 'reject_member', 'member_profile', userId, {
    reason,
  });
  revalidatePath('/account/admin/users');
  revalidatePath('/account');
  return { success: true };
}
export async function lockUserAction(formData) {
  const { adminId } = await requireAdmin();
  const userId = formData.get('userId');
  const reason = formData.get('reason');

  if (!reason) throw new Error('Reason is required to lock an account.');

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      account_status: 'locked',
      status_reason: reason,
      status_changed_by: adminId,
      status_changed_at: new Date().toISOString(),
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);
  await logActivity(adminId, 'lock_user', 'user', userId, { reason });
  revalidatePath('/account/admin/users');
  revalidatePath('/account');
  return { success: true };
}

export async function updateUserAction(formData) {
  const { adminId } = await requireAdmin();
  const userId = formData.get('userId');
  const name = formData.get('name');
  const email = formData.get('email');
  const studentId = formData.get('studentId');
  const avatar_url = formData.get('avatar');

  const updates = { updated_at: new Date().toISOString() };
  if (name) updates.full_name = name;
  if (email) updates.email = email;
  if (studentId) updates.student_id = studentId;
  if (avatar_url) updates.avatar_url = avatar_url;

  const { error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (error) throw new Error(error.message);
  await logActivity(adminId, 'update_user', 'user', userId, { updates });
  revalidatePath('/account/admin/users');
  revalidatePath('/account');
  return { success: true };
}

export async function submitMembershipApplicationAction(formData) {
  const session = await auth();
  if (!session?.user) throw new Error('Not authenticated');

  // Resolve user id from email
  const { data: user, error: userLookupErr } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email')
    .eq('email', session.user.email)
    .single();
  if (userLookupErr || !user) throw new Error('User not found');

  const userId = user.id;

  // Form fields
  const studentId = formData.get('student_id')?.trim();
  const batch = formData.get('batch')?.trim();
  const department = formData.get('department')?.trim();
  const phone = formData.get('phone')?.trim() || null;
  const semester = formData.get('semester')?.trim() || null;
  const cgpa = formData.get('cgpa') ? parseFloat(formData.get('cgpa')) : null;
  const github = formData.get('github')?.trim() || null;
  const linkedin = formData.get('linkedin')?.trim() || null;
  const codeforces = formData.get('codeforces_handle')?.trim() || null;
  const vjudge = formData.get('vjudge_handle')?.trim() || null;
  const atcoder = formData.get('atcoder_handle')?.trim() || null;
  const leetcode = formData.get('leetcode_handle')?.trim() || null;
  const reason = formData.get('reason')?.trim() || null;
  const interestsRaw = formData.get('interests')?.trim() || null;
  const interests = interestsRaw
    ? interestsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  if (!studentId || !batch || !department) {
    throw new Error('Student ID, batch, and department are required.');
  }

  // 1. Insert or update join_request
  const joinRequestId = formData.get('joinRequestId')?.trim() || null;

  if (joinRequestId) {
    // Update the existing pending request
    const { error: jrError } = await supabaseAdmin
      .from('join_requests')
      .update({
        student_id: studentId,
        batch,
        department,
        phone,
        interests: interestsRaw,
        codeforces_handle: codeforces,
        github,
        reason,
        status: 'pending',
      })
      .eq('id', joinRequestId);
    if (jrError) throw new Error(jrError.message);
  } else {
    // Insert a new request
    const { error: jrError } = await supabaseAdmin
      .from('join_requests')
      .insert({
        full_name: user.full_name || session.user.name,
        email: user.email,
        student_id: studentId,
        batch,
        department,
        phone,
        interests: interestsRaw,
        codeforces_handle: codeforces,
        github,
        reason,
        status: 'pending',
      });
    if (jrError) throw new Error(jrError.message);
  }

  // 2. Insert minimal member_profiles stub so admin can see pending applications
  const { error: mpError } = await supabaseAdmin.from('member_profiles').upsert(
    {
      user_id: userId,
      student_id: studentId,
      batch,
      department,
      approved: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (mpError) throw new Error(mpError.message);

  revalidatePath('/account/guest/membership-application');
  revalidatePath('/account/admin/users');
  return { success: true };
}
