/**
 * @file Committee actions
 * @module committee-actions
 */

'use server';

import { auth } from '@/app/_lib/auth/auth';
import {
  addCommitteeMember,
  createCommitteePosition,
  deleteCommitteePosition,
  removeCommitteeMember,
  updateCommitteeMember,
  updateCommitteePosition,
} from '@/app/_lib/services/data-service';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { revalidatePath, revalidateTag } from 'next/cache';
import { uploadToDrive } from '@/app/_lib/integrations/gdrive';
import crypto from 'crypto';

async function requireAdminOrAdvisor() {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Not authenticated');

  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, account_status')
    .eq('email', session.user.email)
    .single();

  if (userError || !userData) throw new Error('User not found');
  if (userData.account_status !== 'active') {
    throw new Error('Account is not active');
  }

  const { data: roleRows, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userData.id);

  if (roleError) throw new Error(roleError.message);
  const isAuthorized = roleRows?.some(
    (row) => row.roles?.name === 'admin' || row.roles?.name === 'advisor'
  );
  if (!isAuthorized) throw new Error('Unauthorized');

  return userData.id;
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
  } catch {
    // Ignore logging errors to avoid blocking admin operations.
  }
}

function revalidateCommitteeViews() {
  revalidatePath('/account/advisor');
  revalidatePath('/account/advisor/committee');
  revalidatePath('/account/admin/committee');
  revalidatePath('/committee');
  revalidateTag('committee');
}

export async function createCommitteePositionAction(formData) {
  const adminId = await requireAdminOrAdvisor();

  const title = formData.get('title')?.toString().trim();
  const category = formData.get('category')?.toString().trim();
  if (!title) throw new Error('Position title is required');
  if (!category) throw new Error('Position category is required');

  const displayOrderRaw = formData.get('display_order')?.toString().trim();
  const rankRaw = formData.get('rank')?.toString().trim();

  const position = await createCommitteePosition({
    title,
    category,
    display_order: displayOrderRaw ? Number(displayOrderRaw) : 0,
    rank: rankRaw ? Number(rankRaw) : null,
    responsibilities:
      formData.get('responsibilities')?.toString().trim() || null,
  });

  await logActivity(
    adminId,
    'create_committee_position',
    'committee_position',
    position.id,
    {
      title,
      category,
    }
  );

  revalidateCommitteeViews();
}

export async function updateCommitteePositionAction(formData) {
  const adminId = await requireAdminOrAdvisor();

  const id = formData.get('id')?.toString();
  if (!id) throw new Error('Position id is required');

  const title = formData.get('title')?.toString().trim();
  const category = formData.get('category')?.toString().trim();
  if (!title) throw new Error('Position title is required');
  if (!category) throw new Error('Position category is required');

  const displayOrderRaw = formData.get('display_order')?.toString().trim();
  const rankRaw = formData.get('rank')?.toString().trim();

  await updateCommitteePosition(id, {
    title,
    category,
    display_order: displayOrderRaw ? Number(displayOrderRaw) : 0,
    rank: rankRaw ? Number(rankRaw) : null,
    responsibilities:
      formData.get('responsibilities')?.toString().trim() || null,
  });

  await logActivity(
    adminId,
    'update_committee_position',
    'committee_position',
    id,
    {
      title,
      category,
    }
  );

  revalidateCommitteeViews();
}

export async function deleteCommitteePositionAction(formData) {
  const adminId = await requireAdminOrAdvisor();

  const id = formData.get('id')?.toString();
  if (!id) throw new Error('Position id is required');

  await deleteCommitteePosition(id);
  await logActivity(
    adminId,
    'delete_committee_position',
    'committee_position',
    id,
    {}
  );

  revalidateCommitteeViews();
}

export async function createCommitteeMemberAction(formData) {
  const adminId = await requireAdminOrAdvisor();

  const userId = formData.get('user_id')?.toString();
  const positionId = formData.get('position_id')?.toString();
  const termStart = formData.get('term_start')?.toString();

  if (!userId) throw new Error('User is required');
  if (!positionId) throw new Error('Position is required');
  if (!termStart) throw new Error('Term start date is required');

  const created = await addCommitteeMember({
    user_id: userId,
    position_id: positionId,
    term_start: termStart,
    term_end: formData.get('term_end')?.toString() || null,
    is_current: formData.get('is_current')?.toString() === 'true',
    bio: formData.get('bio')?.toString().trim() || null,
    custom_avatar_url: formData.get('custom_avatar_url')?.toString() || null,
  });

  // Upsert profile data
  const academicSession = formData.get('academic_session')?.toString().trim();
  const department = formData.get('department')?.toString().trim();
  const github = formData.get('github')?.toString().trim();
  const linkedin = formData.get('linkedin')?.toString().trim();

  const profileUpdates = { updated_at: new Date().toISOString() };
  let hasProfileUpdates = false;

  if (academicSession !== undefined) {
    profileUpdates.academic_session = academicSession || null;
    hasProfileUpdates = true;
  }
  if (department !== undefined) {
    profileUpdates.department = department || null;
    hasProfileUpdates = true;
  }
  if (github !== undefined) {
    profileUpdates.github = github || null;
    hasProfileUpdates = true;
  }
  if (linkedin !== undefined) {
    profileUpdates.linkedin = linkedin || null;
    hasProfileUpdates = true;
  }

  if (hasProfileUpdates) {
    await supabaseAdmin
      .from('member_profiles')
      .upsert(
        { user_id: userId, ...profileUpdates },
        { onConflict: 'user_id' }
      );
  }

  await logActivity(
    adminId,
    'create_committee_member',
    'committee_member',
    created.id,
    {
      userId,
      positionId,
    }
  );

  revalidateCommitteeViews();
  return { success: true };
}

export async function updateCommitteeMemberAction(formData) {
  const adminId = await requireAdminOrAdvisor();

  const id = formData.get('id')?.toString();
  if (!id) throw new Error('Committee member id is required');

  const termStart = formData.get('term_start')?.toString();
  if (!termStart) throw new Error('Term start date is required');

  const positionId = formData.get('position_id')?.toString();
  if (!positionId) throw new Error('Position is required');

  const customAvatarUrl = formData.get('custom_avatar_url');
  const updates = {
    position_id: positionId,
    term_start: termStart,
    term_end: formData.get('term_end')?.toString() || null,
    is_current: formData.get('is_current')?.toString() === 'true',
    bio: formData.get('bio')?.toString().trim() || null,
  };
  if (customAvatarUrl !== null) {
    updates.custom_avatar_url = customAvatarUrl.toString().trim() || null;
  }

  await updateCommitteeMember(id, updates);

  // Get the user ID associated with the committee member
  const { data: memberData } = await supabaseAdmin
    .from('committee_members')
    .select('user_id')
    .eq('id', id)
    .single();

  if (memberData?.user_id) {
    const userId = memberData.user_id;
    const academicSession = formData.get('academic_session')?.toString().trim();
    const department = formData.get('department')?.toString().trim();
    const github = formData.get('github')?.toString().trim();
    const linkedin = formData.get('linkedin')?.toString().trim();

    const profileUpdates = { updated_at: new Date().toISOString() };
    let hasProfileUpdates = false;

    if (academicSession !== undefined) {
      profileUpdates.academic_session = academicSession || null;
      hasProfileUpdates = true;
    }
    if (department !== undefined) {
      profileUpdates.department = department || null;
      hasProfileUpdates = true;
    }
    if (github !== undefined) {
      profileUpdates.github = github || null;
      hasProfileUpdates = true;
    }
    if (linkedin !== undefined) {
      profileUpdates.linkedin = linkedin || null;
      hasProfileUpdates = true;
    }

    if (hasProfileUpdates) {
      await supabaseAdmin
        .from('member_profiles')
        .upsert(
          { user_id: userId, ...profileUpdates },
          { onConflict: 'user_id' }
        );
    }
  }

  await logActivity(
    adminId,
    'update_committee_member',
    'committee_member',
    id,
    {
      positionId,
    }
  );

  revalidateCommitteeViews();
  return { success: true };
}

export async function deleteCommitteeMemberAction(formData) {
  const adminId = await requireAdminOrAdvisor();

  const id = formData.get('id')?.toString();
  if (!id) throw new Error('Committee member id is required');

  await removeCommitteeMember(id);
  await logActivity(
    adminId,
    'delete_committee_member',
    'committee_member',
    id,
    {}
  );

  revalidateCommitteeViews();
}

export async function uploadCommitteeMemberAvatarAction(formData) {
  const adminId = await requireAdminOrAdvisor();

  const file = formData.get('file');
  const memberId = formData.get('memberId');

  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: 'No image provided.' };
  }

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { error: 'Image type not supported. Use JPEG, PNG, WebP, or GIF.' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `committee_avatar_${memberId || 'temp'}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;

  let url, fileId;
  try {
    const arrayBuffer = await file.arrayBuffer();
    ({ url, fileId } = await uploadToDrive(
      Buffer.from(arrayBuffer),
      filename,
      file.type,
      'committee-avatars'
    ));
  } catch (err) {
    console.error('Google Drive committee avatar upload error:', err);
    return { error: 'Failed to upload image. Please try again.' };
  }

  if (memberId && !memberId.startsWith('cm_')) {
    const { error: dbError } = await supabaseAdmin
      .from('committee_members')
      .update({ custom_avatar_url: url, updated_at: new Date().toISOString() })
      .eq('id', memberId);

    if (dbError) {
      console.error('Failed to update committee avatar in database:', dbError);
      return { error: `Image uploaded, but failed to save to database: ${dbError.message}` };
    }

    await logActivity(adminId, 'committee_member_avatar_uploaded', 'committee_member', memberId, {
      filename: file.name,
      fileId,
    });

    revalidateCommitteeViews();
  }

  return { success: true, url };
}
