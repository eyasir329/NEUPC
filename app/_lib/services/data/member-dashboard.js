/**
 * @file Member dashboard data-access — aggregates the member's real
 *   profile completeness signals, judge handles, problem-solving stats,
 *   leaderboard position and recent solves into the shape the member
 *   dashboard needs. All numbers come from live DB rows — no placeholders.
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';

/**
 * Fetch the member-dashboard aggregates in one round of parallel queries.
 *
 * @param {string} userId - users.id of the authenticated member.
 */
export async function getMemberDashboardStats(userId) {
  const weekAgoIso = new Date(Date.now() - 7 * 86400000).toISOString();

  const [
    { data: memberProfile },
    { data: handles },
    { data: userStats },
    { data: lbRow },
    { count: lbCount },
    { data: recentSolves },
  ] = await Promise.all([
    supabaseAdmin
      .from('member_profiles')
      .select('bio, skills, cgpa')
      .eq('user_id', userId)
      .maybeSingle(),
    supabaseAdmin
      .from('user_handles')
      .select('handle, rating, max_rating, platform:platform_id(code, name)')
      .eq('user_id', userId),
    supabaseAdmin
      .from('user_stats')
      .select(
        'total_solved, current_streak, longest_streak, solved_this_week, last_solve_date'
      )
      .eq('user_id', userId)
      .maybeSingle(),
    supabaseAdmin
      .from('leaderboard_cache')
      .select('global_rank')
      .eq('user_id', userId)
      .maybeSingle(),
    supabaseAdmin
      .from('leaderboard_cache')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('user_solves')
      .select(
        'first_solved_at, problems!inner(name, platforms!inner(code, name))'
      )
      .eq('user_id', userId)
      .gte('first_solved_at', weekAgoIso)
      .order('first_solved_at', { ascending: false }),
  ]);

  return {
    memberProfile: memberProfile || null,
    handles: handles || [],
    userStats: userStats || null,
    globalRank: lbRow?.global_rank ?? null,
    totalRanked: lbCount ?? 0,
    recentSolves: recentSolves || [],
  };
}
