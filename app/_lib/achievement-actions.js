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
      entity_type: 'achievement',
      entity_id: entityId,
      details,
    });
  } catch {
    // non-critical
  }
}

function revalidate() {
  revalidatePath('/account/admin/achievements');
  revalidatePath('/achievements');
}

// =============================================================================
// CREATE ACHIEVEMENT
// =============================================================================

export async function createAchievementAction(formData) {
  const admin = await requireAdmin();

  const title = formData.get('title')?.trim();
  const contest_name = formData.get('contest_name')?.trim();
  const result = formData.get('result')?.trim();
  const year = formData.get('year');

  if (!title) return { error: 'Title is required.' };
  if (!contest_name) return { error: 'Contest / event name is required.' };
  if (!result) return { error: 'Result is required.' };
  if (!year) return { error: 'Year is required.' };

  const rawParticipants = formData.get('participants') || '';
  const participants = rawParticipants
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const payload = {
    title,
    contest_name,
    contest_url: formData.get('contest_url')?.trim() || null,
    result,
    year: parseInt(year, 10),
    category: formData.get('category')?.trim() || null,
    description: formData.get('description')?.trim() || null,
    achievement_date: formData.get('achievement_date') || null,
    participants: participants.length ? participants : null,
    is_team: formData.get('is_team') === 'true',
    team_name: formData.get('team_name')?.trim() || null,
    created_by: admin.id,
  };

  const { data, error } = await supabaseAdmin
    .from('achievements')
    .insert([payload])
    .select()
    .single();

  if (error) return { error: error.message };

  await logActivity(admin.id, 'achievement_created', data.id, { title });
  revalidate();
  return { success: true, id: data.id };
}

// =============================================================================
// UPDATE ACHIEVEMENT
// =============================================================================

export async function updateAchievementAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  if (!id) return { error: 'Achievement ID is required.' };

  const title = formData.get('title')?.trim();
  const contest_name = formData.get('contest_name')?.trim();
  const result = formData.get('result')?.trim();
  const year = formData.get('year');

  if (!title) return { error: 'Title is required.' };
  if (!contest_name) return { error: 'Contest / event name is required.' };
  if (!result) return { error: 'Result is required.' };
  if (!year) return { error: 'Year is required.' };

  const rawParticipants = formData.get('participants') || '';
  const participants = rawParticipants
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const payload = {
    title,
    contest_name,
    contest_url: formData.get('contest_url')?.trim() || null,
    result,
    year: parseInt(year, 10),
    category: formData.get('category')?.trim() || null,
    description: formData.get('description')?.trim() || null,
    achievement_date: formData.get('achievement_date') || null,
    participants: participants.length ? participants : null,
    is_team: formData.get('is_team') === 'true',
    team_name: formData.get('team_name')?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('achievements')
    .update(payload)
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'achievement_updated', id, { title });
  revalidate();
  return { success: true };
}

// =============================================================================
// DELETE ACHIEVEMENT
// =============================================================================

export async function deleteAchievementAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id');
  if (!id) return { error: 'Achievement ID is required.' };

  const { error } = await supabaseAdmin
    .from('achievements')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'achievement_deleted', id, {});
  revalidate();
  return { success: true };
}

// =============================================================================
// ADD MEMBER TO ACHIEVEMENT
// =============================================================================

export async function addAchievementMemberAction(formData) {
  const admin = await requireAdmin();

  const achievement_id = formData.get('achievement_id');
  const user_id = formData.get('user_id');
  if (!achievement_id || !user_id) return { error: 'Missing IDs.' };

  // Check for duplicate
  const { data: existing } = await supabaseAdmin
    .from('member_achievements')
    .select('id')
    .eq('achievement_id', achievement_id)
    .eq('user_id', user_id)
    .maybeSingle();

  if (existing) return { error: 'Member already linked to this achievement.' };

  const { error } = await supabaseAdmin.from('member_achievements').insert([
    {
      achievement_id,
      user_id,
      position: formData.get('position')?.trim() || null,
    },
  ]);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'achievement_member_added', achievement_id, {
    user_id,
  });
  revalidate();
  return { success: true };
}

// =============================================================================
// REMOVE MEMBER FROM ACHIEVEMENT
// =============================================================================

export async function removeAchievementMemberAction(formData) {
  const admin = await requireAdmin();

  const id = formData.get('id'); // member_achievements.id
  if (!id) return { error: 'Record ID is required.' };

  const { error } = await supabaseAdmin
    .from('member_achievements')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  await logActivity(admin.id, 'achievement_member_removed', id, {});
  revalidate();
  return { success: true };
}
