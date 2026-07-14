/**
 * @file Member profile data-access — fetches the member's profile row,
 *   judge handles (with ratings), problem-solving stats and daily
 *   activity history for the profile page. All values come from live
 *   DB rows — no placeholders.
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';

/**
 * Fetch the member-profile aggregates in one round of parallel queries.
 *
 * @param {string} userId - users.id of the authenticated member.
 */
export async function getMemberProfileData(userId) {
  const [
    { data: memberProfile },
    { data: handles },
    { data: userStats },
    { data: dailyActivity },
  ] = await Promise.all([
    supabaseAdmin
      .from('member_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
    supabaseAdmin
      .from('user_handles')
      .select('handle, rating, max_rating, platform:platform_id(code, name)')
      .eq('user_id', userId),
    supabaseAdmin
      .from('user_stats')
      .select(
        'total_solved, easy_solved, medium_solved, hard_solved, current_streak, longest_streak, total_submissions'
      )
      .eq('user_id', userId)
      .maybeSingle(),
    supabaseAdmin
      .from('user_daily_activity')
      .select('activity_date, problems_solved')
      .eq('user_id', userId)
      .order('activity_date', { ascending: true }),
  ]);

  return {
    memberProfile: memberProfile || null,
    handles: handles || [],
    userStats: userStats || null,
    dailyActivity: dailyActivity || [],
  };
}
