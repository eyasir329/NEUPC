/**
 * @file achievements data-access — split from the data-service module.
 */

import { supabase, supabaseAdmin } from '@/app/_lib/integrations/supabase';

// Get all achievements with admin details.
export async function getAchievementsAdmin() {
  const { data, error } = await supabaseAdmin
    .from('achievements')
    .select(
      `*,
       users!achievements_created_by_fkey(id, full_name, avatar_url),
       member_achievements(id, user_id, position, users(id, full_name, avatar_url))`
    )
    .order('year', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  const achievements = data ?? [];

  const currentYear = new Date().getFullYear();
  const stats = {
    total: achievements.length,
    thisYear: achievements.filter((a) => a.year === currentYear).length,
    teamAchievements: achievements.filter((a) => a.is_team).length,
    individualAchievements: achievements.filter((a) => !a.is_team).length,
    categories: [
      ...new Set(achievements.map((a) => a.category).filter(Boolean)),
    ].length,
    years: [...new Set(achievements.map((a) => a.year).filter(Boolean))].sort(
      (a, b) => b - a
    ),
  };

  return { achievements, stats };
}

// Get all achievements.
export async function getAllAchievements() {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('year', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get an achievement by ID.
export async function getAchievementById(id) {
  const { data, error } = await supabase
    .from('achievements')
    .select('*, member_achievements(*, users(id, full_name, avatar_url))')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Get achievements filtered by year.
export async function getAchievementsByYear(year) {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('year', year)
    .order('achievement_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get achievements by category.
export async function getAchievementsByCategory(category) {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('category', category)
    .order('year', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Create a new achievement.
export async function createAchievement(achievementData) {
  const { data, error } = await supabase
    .from('achievements')
    .insert([achievementData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update an achievement.
export async function updateAchievement(id, updates) {
  const { data, error } = await supabase
    .from('achievements')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Delete an achievement.
export async function deleteAchievement(id) {
  const { error } = await supabaseAdmin
    .from('achievements')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// Get achievements for a member.
export async function getMemberAchievements(userId) {
  const { data, error } = await supabase
    .from('member_achievements')
    .select('*, achievements(*)')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return data;
}

// Get members of an achievement.
export async function getAchievementMembers(achievementId) {
  const { data, error } = await supabase
    .from('member_achievements')
    .select('*, users(id, full_name, avatar_url)')
    .eq('achievement_id', achievementId);
  if (error) throw new Error(error.message);
  return data;
}

// Link a member to an achievement.
export async function addMemberAchievement(
  achievementId,
  userId,
  position = null
) {
  const { data, error } = await supabase
    .from('member_achievements')
    .insert([{ achievement_id: achievementId, user_id: userId, position }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Unlink a member from an achievement.
export async function removeMemberAchievement(achievementId, userId) {
  const { error } = await supabase
    .from('member_achievements')
    .delete()
    .eq('achievement_id', achievementId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getAchievementMemberCount(achievementId) {
  const { count, error } = await supabase
    .from('member_achievements')
    .select('*', { count: 'exact', head: true })
    .eq('achievement_id', achievementId);
  if (error) throw new Error(error.message);
  return count || 0;
}

export async function getMostEarnedAchievements(limit = 10) {
  const { data, error } = await supabase
    .from('achievements')
    .select('*, member_achievements(user_id)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (
    data?.map((achievement) => ({
      ...achievement,
      memberCount: achievement.member_achievements?.length || 0,
    })) || []
  );
}
