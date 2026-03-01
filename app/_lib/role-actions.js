/**
 * @file role actions
 * @module role-actions
 */

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
    .select('roles(name, priority)')
    .eq('user_id', userData.id);

  const adminRole = roles?.find((r) => r.roles?.name === 'admin');
  if (!adminRole) throw new Error('Unauthorized: Admin access required');

  return {
    adminId: userData.id,
    adminPriority: adminRole.roles?.priority ?? 6,
  };
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

// ─── role description update ─────────────────────────────────

export async function updateRoleDescriptionAction(formData) {
  const { adminId } = await requireAdmin();
  const roleId = formData.get('roleId');
  const description = formData.get('description')?.trim();

  if (!roleId) throw new Error('Role ID is required');
  if (!description) throw new Error('Description cannot be empty');

  const { error } = await supabaseAdmin
    .from('roles')
    .update({ description })
    .eq('id', roleId);

  if (error) throw new Error(error.message);

  await logActivity(adminId, 'update_role_description', 'role', roleId, {
    description,
  });

  revalidatePath('/account/admin/roles');
  return { success: true };
}

// ─── permission toggle ────────────────────────────────────────

export async function toggleRolePermissionAction(formData) {
  const { adminId } = await requireAdmin();
  const roleId = formData.get('roleId');
  const permissionId = formData.get('permissionId');
  const action = formData.get('action'); // 'add' | 'remove'

  if (!roleId || !permissionId)
    throw new Error('Missing roleId or permissionId');
  if (!['add', 'remove'].includes(action)) throw new Error('Invalid action');

  if (action === 'add') {
    // Upsert-style: ignore duplicate
    const { error } = await supabaseAdmin
      .from('role_permissions')
      .insert({ role_id: roleId, permission_id: permissionId });

    if (error && !error.message?.toLowerCase().includes('duplicate')) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabaseAdmin
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId);

    if (error) throw new Error(error.message);
  }

  await logActivity(adminId, `permission_${action}`, 'role', roleId, {
    permissionId,
  });

  revalidatePath('/account/admin/roles');
  return { success: true };
}

// ─── assign role to user ──────────────────────────────────────

export async function assignRoleToUserAction(formData) {
  const { adminId } = await requireAdmin();
  const userId = formData.get('userId');
  const roleId = formData.get('roleId');
  const roleName = formData.get('roleName');

  if (!userId || !roleId) throw new Error('Missing userId or roleId');

  // Check if already assigned — avoid duplicate
  const { data: existing } = await supabaseAdmin
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('role_id', roleId)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role_id: roleId, assigned_by: adminId });
    if (error) throw new Error(error.message);
  }

  await logActivity(adminId, 'assign_role', 'user', userId, {
    roleId,
    roleName,
  });
  revalidatePath('/account/admin/roles');
  revalidatePath('/account/admin/users');
  return { success: true };
}

// ─── remove role from user ────────────────────────────────────

export async function removeRoleFromUserAction(formData) {
  const { adminId } = await requireAdmin();
  const userId = formData.get('userId');
  const roleId = formData.get('roleId');
  const roleName = formData.get('roleName');

  if (!userId || !roleId) throw new Error('Missing userId or roleId');

  const { error } = await supabaseAdmin
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleId);

  if (error) throw new Error(error.message);

  await logActivity(adminId, 'remove_role', 'user', userId, {
    roleId,
    roleName,
  });
  revalidatePath('/account/admin/roles');
  revalidatePath('/account/admin/users');
  return { success: true };
}
