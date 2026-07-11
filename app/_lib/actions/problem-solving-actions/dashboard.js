/**
 * @file Dashboard data actions: own and other members' problem-solving data.
 * @module problem-solving-actions/dashboard
 */

'use server';

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { V2_TABLES, getUserHandlesV2, getUserSolvesV2, getUserStatsV2, getUserSubmissionsV2, isV2SchemaAvailable } from '@/app/_lib/services/problem-solving-v2-helpers';
import {
  calculateWeightedScore,
  computeDashboardStatMetrics,
  generateDailyActivity,
  getMaxNonNegativeCount,
  getUserSyncStatusByPlatform,
  isLiveContestParticipation,
  transformContestHistory,
  transformRatingHistory,
} from './_helpers';

export async function getProblemSolvingData() {
  try {
    const { user } = await requireRole('member');

    // Check if V2 schema is available
    const useV2 = await isV2SchemaAvailable();

    // Fetch data with individual error handling for missing tables
    let profile = null;
    let handles = [];
    let statistics = null;
    let recentSolutions = [];
    let problemSolves = [];
    let recentSubmissions = [];

    // Get user profile (this table should always exist)
    try {
      const { data } = await supabaseAdmin
        .from('users')
        .select('id, full_name, avatar_url, role')
        .eq('id', user.id)
        .single();
      profile = data;
    } catch (e) {
      console.error('Error fetching user profile:', e.message);
    }

    // Get user handles (ALL platforms) - V2 or legacy
    try {
      if (useV2) {
        handles = await getUserHandlesV2(user.id);
      } else {
        const { data } = await supabaseAdmin
          .from('user_handles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        handles = data || [];
      }
    } catch (e) {
      console.error('Error fetching user handles:', e.message);
    }

    // Get user statistics - V2 or legacy
    try {
      if (useV2) {
        statistics = await getUserStatsV2(user.id);
      } else {
        const { data } = await supabaseAdmin
          .from('user_problem_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();
        statistics = data;
      }
    } catch (e) {
      // Table may not exist yet - this is expected before migration
      console.error(
        'Error fetching user stats (table may not exist):',
        e.message
      );
    }

    // Get recent solutions (V2 schema with correct table names)
    try {
      const { data } = await supabaseAdmin
        .from(V2_TABLES.SOLUTIONS)
        .select(
          `
          id, source_code, verdict, is_primary, submitted_at, created_at,
          languages(code, name),
          user_solves!inner(
            id, first_solved_at,
            problems!inner(
              id, external_id, name, url, difficulty_rating,
              platforms!inner(code, name)
            )
          )
        `
        )
        .eq('user_solves.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      recentSolutions = (data || []).map((sol) => ({
        id: sol.id,
        source_code: sol.source_code,
        verdict: sol.verdict,
        is_primary: sol.is_primary,
        submitted_at: sol.submitted_at || sol.created_at,
        language: sol.languages?.code,
        language_name: sol.languages?.name,
        user_problem_solves: sol.user_solves
          ? {
              id: sol.user_solves.id,
              first_solved_at: sol.user_solves.first_solved_at,
              problems: sol.user_solves.problems
                ? {
                    platform: sol.user_solves.problems.platforms?.code,
                    problem_id: sol.user_solves.problems.external_id,
                    problem_name: sol.user_solves.problems.name,
                    problem_url: sol.user_solves.problems.url,
                    difficulty_rating:
                      sol.user_solves.problems.difficulty_rating,
                  }
                : null,
            }
          : null,
      }));
    } catch (e) {
      console.error('Error fetching solutions:', e.message);
    }

    // Get recent problem solves for activity data - V2 or legacy
    try {
      if (useV2) {
        problemSolves = await getUserSolvesV2(user.id, { limit: 100 });
        // Transform to match expected shape with nested problems object
        problemSolves = problemSolves.map((solve) => ({
          id: solve.id,
          first_solved_at: solve.first_solved_at,
          solve_count: solve.solve_count,
          problems: {
            platform: solve.platform,
            problem_id: solve.problem_id,
            problem_name: solve.problem_name,
            difficulty_rating: solve.difficulty_rating,
            tags: solve.tags,
          },
        }));
      } else {
        const { data } = await supabaseAdmin
          .from('user_problem_solves')
          .select(
            `
            id, first_solved_at, solve_count,
            problems!inner(platform, problem_id, problem_name, difficulty_rating, tags)
          `
          )
          .eq('user_id', user.id)
          .order('first_solved_at', { ascending: false })
          .limit(100);
        problemSolves = data || [];
      }
    } catch (e) {
      console.error(
        'Error fetching problem solves (table may not exist):',
        e.message
      );
    }

    // Get recent submissions (ALL verdicts) - V2 or legacy
    try {
      if (useV2) {
        recentSubmissions = await getUserSubmissionsV2(user.id, { limit: 100 });
      } else {
        const { data } = await supabaseAdmin
          .from('problem_submissions')
          .select('*')
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(100);
        recentSubmissions = data || [];
      }
    } catch (e) {
      console.error(
        'Error fetching problem submissions (table may not exist):',
        e.message
      );
    }

    // Get contest history (from contest_history table, joined with platforms)
    // NOTE: No limit - fetch ALL contests so older platform data (like LeetCode from 2024) isn't cut off
    let contestHistoryData = [];
    let contestHistoryLoaded = false;
    try {
      const { data, error: contestError } = await supabaseAdmin
        .from('contest_history')
        .select(
          `
          *,
          platforms!inner(code, name)
        `
        )
        .eq('user_id', user.id)
        .order('contest_date', { ascending: false });

      if (contestError) {
        console.error(
          '[getProblemSolvingData] Contest history query error:',
          contestError
        );
      } else {
        contestHistoryLoaded = true;
      }

      contestHistoryData = data || [];
    } catch (e) {
      console.error(
        'Error fetching contest history (table may not exist):',
        e.message
      );
    }

    // Get rating history (from rating_history table, joined with platforms and contest_history)
    let ratingHistoryData = [];
    try {
      const { data } = await supabaseAdmin
        .from('rating_history')
        .select(
          `
          *,
          platforms!inner(code, name),
          contest_history(contest_name, external_contest_id, contest_url, rank, total_participants, problems_solved, problems_attempted, total_problems)
        `
        )
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(200);
      ratingHistoryData = data || [];
    } catch (e) {
      console.error(
        'Error fetching rating history (table may not exist):',
        e.message
      );
    }

    // Get latest sync status per platform from merged sync_jobs table.
    const syncCheckpoints = await getUserSyncStatusByPlatform(user.id);

    // Get solved counts per platform from user_solves table (unique problems solved)
    // This joins user_solves -> problems -> platforms to get accurate counts
    let platformSolvedCounts = {};
    let platformSolvedCountsLoaded = false;
    let solvedRowsForDashboard = [];
    try {
      if (useV2) {
        // V2 schema: user_solves -> problems -> platforms (paginated — no row cap)
        {
          const PAGE = 1000;
          let from = 0;
          while (true) {
            const { data: page, error } = await supabaseAdmin
              .from(V2_TABLES.USER_SOLVES)
              .select(
                'first_solved_at, problem_id, problems!inner(external_id, name, url, difficulty_rating, platform_id, platforms!inner(code))'
              )
              .eq('user_id', user.id)
              .range(from, from + PAGE - 1);
            if (error) throw error;
            if (!page || page.length === 0) break;
            solvedRowsForDashboard = solvedRowsForDashboard.concat(page);
            if (page.length < PAGE) break;
            from += PAGE;
          }
        }

        // Count unique solved problems per platform code
        const solvedByPlatform = {};
        solvedRowsForDashboard.forEach((solve) => {
          const platformCode = solve.problems?.platforms?.code;
          if (platformCode) {
            solvedByPlatform[platformCode] =
              (solvedByPlatform[platformCode] || 0) + 1;
          }
        });
        platformSolvedCounts = solvedByPlatform;
        platformSolvedCountsLoaded = true;
      } else {
        // V1 schema: user_solves -> problems -> platforms (paginated — no row cap)
        {
          const PAGE = 1000;
          let from = 0;
          while (true) {
            const { data: page, error } = await supabaseAdmin
              .from('user_solves')
              .select(
                'first_solved_at, problem_id, problems!inner(problem_id, problem_name, problem_url, difficulty_rating, platform_id, platforms!inner(code))'
              )
              .eq('user_id', user.id)
              .range(from, from + PAGE - 1);
            if (error) throw error;
            if (!page || page.length === 0) break;
            solvedRowsForDashboard = solvedRowsForDashboard.concat(page);
            if (page.length < PAGE) break;
            from += PAGE;
          }
        }

        // Count unique solved problems per platform code
        const solvedByPlatform = {};
        solvedRowsForDashboard.forEach((solve) => {
          const platformCode = solve.problems?.platforms?.code;
          if (platformCode) {
            solvedByPlatform[platformCode] =
              (solvedByPlatform[platformCode] || 0) + 1;
          }
        });
        platformSolvedCounts = solvedByPlatform;
        platformSolvedCountsLoaded = true;
      }
    } catch (e) {
      console.error('Error fetching platform solved counts:', e.message);
    }

    // Get total submissions per platform (paginated)
    let platformSubmissionCounts = {};
    let platformSubmissionCountsLoaded = false;
    try {
      const PAGE = 1000;
      let from = 0;
      while (true) {
        const { data: page, error } = await supabaseAdmin
          .from(V2_TABLES.SUBMISSIONS)
          .select('platform_id, platforms!inner(code)')
          .eq('user_id', user.id)
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!page || page.length === 0) break;
        page.forEach((sub) => {
          const platformCode = sub.platforms?.code;
          if (platformCode) {
            platformSubmissionCounts[platformCode] =
              (platformSubmissionCounts[platformCode] || 0) + 1;
          }
        });
        if (page.length < PAGE) break;
        from += PAGE;
      }
      platformSubmissionCountsLoaded = true;
    } catch (e) {
      console.error('Error fetching platform submission counts:', e.message);
    }

    const liveContestCountsByPlatform = {};
    (contestHistoryData || []).forEach((contest) => {
      const platformCode = contest.platforms?.code || contest.platform;
      if (!platformCode || !isLiveContestParticipation(contest)) return;

      liveContestCountsByPlatform[platformCode] =
        (liveContestCountsByPlatform[platformCode] || 0) + 1;
    });

    const summedPlatformSubmissions = Object.values(
      platformSubmissionCounts
    ).reduce((sum, count) => sum + getMaxNonNegativeCount(count), 0);

    const effectiveTotalSubmissions = getMaxNonNegativeCount(
      statistics?.total_submissions,
      statistics?.total_solutions,
      summedPlatformSubmissions
    );

    const dashboardMetrics = computeDashboardStatMetrics(
      solvedRowsForDashboard,
      effectiveTotalSubmissions,
      statistics
    );

    // Get user_platform_stats for per-platform rating/rank data (V3)
    let platformStatsMap = {};
    try {
      const { data } = await supabaseAdmin
        .from(V2_TABLES.USER_PLATFORM_STATS)
        .select(
          'platform_id, current_rating, max_rating, rank_title, total_submissions, contest_count, problems_solved, last_synced_at, platforms!inner(code)'
        )
        .eq('user_id', user.id);

      (data || []).forEach((ps) => {
        const code = ps.platforms?.code;
        if (code) platformStatsMap[code] = ps;
      });
    } catch (e) {
      console.error('Error fetching user_platform_stats:', e.message);
    }

    // Get user badges
    let userBadges = [];
    try {
      const { data } = await supabaseAdmin
        .from(V2_TABLES.USER_BADGES)
        .select(
          'id, earned_at, badge_definitions!inner(code, name, description, icon, category)'
        )
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      userBadges = (data || []).map((ub) => ({
        id: ub.id,
        earned_at: ub.earned_at,
        code: ub.badge_definitions?.code,
        name: ub.badge_definitions?.name,
        description: ub.badge_definitions?.description,
        icon_url: ub.badge_definitions?.icon,
        category: ub.badge_definitions?.category,
      }));
    } catch (e) {
      console.error('Error fetching user badges:', e.message);
    }

    // Get user tier stats (V3)
    let tierStatsMap = {};
    try {
      const { data } = await supabaseAdmin
        .from(V2_TABLES.USER_TIER_STATS)
        .select(
          'solved_count, difficulty_tiers!inner(min_rating, max_rating, tier_name)'
        )
        .eq('user_id', user.id);

      (data || []).forEach((ts) => {
        const minRating = ts.difficulty_tiers?.min_rating;
        if (minRating != null) tierStatsMap[minRating] = ts.solved_count || 0;
      });
    } catch (e) {
      console.error('Error fetching user_tier_stats:', e.message);
    }

    // Get user's leaderboard rank
    let userRank = null;
    try {
      const { data } = await supabaseAdmin
        .from(V2_TABLES.LEADERBOARD_CACHE)
        .select(
          'global_rank, weekly_rank, monthly_rank, total_score, weekly_score, monthly_score, total_solved, weekly_solved, monthly_solved'
        )
        .eq('user_id', user.id)
        .maybeSingle();
      userRank = data || null;
    } catch (e) {
      console.error('Error fetching user leaderboard rank:', e.message);
    }

    // Build tier-based difficulty breakdown
    // Prefer tier stats (V3), fall back to flat columns in user_stats
    const getSolvedForRating = (minRating) =>
      tierStatsMap[minRating] ?? statistics?.[`solved_${minRating}`] ?? 0;

    const easySolved = getSolvedForRating(800) + getSolvedForRating(900);
    const mediumSolved =
      getSolvedForRating(1000) +
      getSolvedForRating(1100) +
      getSolvedForRating(1200) +
      getSolvedForRating(1300);
    const hardSolved =
      getSolvedForRating(1400) +
      getSolvedForRating(1500) +
      getSolvedForRating(1600) +
      getSolvedForRating(1700);
    const expertSolved =
      getSolvedForRating(1800) +
      getSolvedForRating(1900) +
      getSolvedForRating(2000) +
      getSolvedForRating(2100) +
      getSolvedForRating(2200) +
      getSolvedForRating(2300) +
      getSolvedForRating(2400) +
      (tierStatsMap[2500] ??
        statistics?.solved_2500_plus ??
        statistics?.solved_2000_plus ??
        0);

    // Transform statistics to expected format
    const transformedStatistics = statistics
      ? {
          total_solved: statistics.total_solved || dashboardMetrics.total_solved,
          total_solutions: statistics.total_solutions || 0,
          total_submissions: effectiveTotalSubmissions,
          acceptance_rate: dashboardMetrics.acceptance_rate,
          current_streak: dashboardMetrics.current_streak,
          longest_streak: statistics.longest_streak || 0,

          // Difficulty breakdown (V3: from tier stats; fallback: flat columns)
          easy_solved: easySolved,
          medium_solved: mediumSolved,
          hard_solved: hardSolved,
          expert_solved: expertSolved,

          // Weekly/monthly — use direct columns added in migration 20260405040000
          solved_this_week: statistics.solved_this_week || 0,
          solved_this_month: statistics.solved_this_month || 0,
          weighted_score: dashboardMetrics.weighted_score,

          // Raw tier breakdown for detailed charts
          tier_breakdown: tierStatsMap,

          // Platform stats — use authoritative per-platform tables for counts;
          // checkpoints are status/timing only.
          platform_stats: (handles || []).reduce((acc, handle) => {
            const checkpoint = syncCheckpoints.find(
              (cp) => cp.platform === handle.platform
            );
            const ps = platformStatsMap[handle.platform];
            const solvedCount = platformSolvedCountsLoaded
              ? getMaxNonNegativeCount(platformSolvedCounts[handle.platform])
              : getMaxNonNegativeCount(
                  platformSolvedCounts[handle.platform],
                  ps?.problems_solved
                );
            const totalSubmissions = platformSubmissionCountsLoaded
              ? getMaxNonNegativeCount(
                  platformSubmissionCounts[handle.platform]
                )
              : getMaxNonNegativeCount(
                  platformSubmissionCounts[handle.platform],
                  ps?.total_submissions
                );

            acc[handle.platform] = {
              rating:
                ps?.current_rating ??
                handle.current_rating ??
                handle.rating ??
                0,
              max_rating: ps?.max_rating ?? handle.max_rating ?? 0,
              rank_title: ps?.rank_title ?? handle.rank_title ?? null,
              handle: handle.handle,
              is_verified: handle.is_verified || false,
              last_synced_at:
                ps?.last_synced_at ||
                checkpoint?.sync_completed_at ||
                checkpoint?.last_synced_at ||
                handle.last_synced_at,
              contest_count: contestHistoryLoaded
                ? liveContestCountsByPlatform[handle.platform] || 0
                : getMaxNonNegativeCount(ps?.contest_count),
              sync_status: checkpoint?.sync_status || 'pending',
              total_submissions: totalSubmissions,
              solved_count: solvedCount,
              error_message: checkpoint?.error_message || null,
            };
            return acc;
          }, {}),

          // Leaderboard rank
          global_rank: userRank?.global_rank || null,
          weekly_rank: userRank?.weekly_rank || null,
          monthly_rank: userRank?.monthly_rank || null,
        }
      : {
          total_solved: dashboardMetrics.total_solved,
          total_submissions: effectiveTotalSubmissions,
          acceptance_rate: dashboardMetrics.acceptance_rate,
          current_streak: dashboardMetrics.current_streak,
          weighted_score: dashboardMetrics.weighted_score,
          platform_stats: {},
        };

    // Load daily activity from user_daily_activity table (full history)
    let dailyActivity = [];
    try {
      if (useV2) {
        const { data: activityRows } = await supabaseAdmin
          .from(V2_TABLES.USER_DAILY_ACTIVITY)
          .select('activity_date, problems_solved')
          .eq('user_id', user.id)
          .order('activity_date', { ascending: true });
        dailyActivity = activityRows || [];
      } else {
        dailyActivity = generateDailyActivity(problemSolves || []);
      }
    } catch (e) {
      console.error('Error fetching daily activity:', e.message);
      dailyActivity = generateDailyActivity(problemSolves || []);
    }

    // Transform submissions: resolve platform code + problem name via JOIN
    const transformedSubmissions = (recentSubmissions || []).map((sub) => ({
      id: sub.id,
      platform: sub.platform || 'unknown',
      problem_id: sub.external_problem_id || sub.problem_id || '',
      problem_name: sub.problems?.name || sub.problem_name || '',
      problem_url: sub.problems?.url || sub.problem_url || '',
      submission_id: sub.external_submission_id || sub.submission_id || '',
      verdict: sub.verdict || 'UNKNOWN',
      language: sub.languages?.code || sub.language || '',
      submitted_at: sub.submitted_at,
      execution_time_ms: sub.execution_time_ms,
      memory_kb: sub.memory_kb,
      difficulty_rating:
        sub.problems?.difficulty_rating || sub.difficulty_rating,
      tags: sub.tags || [],
    }));

    // Transform contest history for ContestHistory component
    const transformedContests = transformContestHistory(contestHistoryData);

    // Transform rating history for RatingChart component
    const ratingHistory = transformRatingHistory(ratingHistoryData);

    return {
      success: true,
      data: {
        profile: profile || null,
        handles: handles || [],
        statistics: transformedStatistics,
        recentSolves: problemSolves || [],
        recentSolutions: recentSolutions || [],
        recentSubmissions: transformedSubmissions,
        dailyActivity,
        badges: userBadges,
        leaderboard: userRank,
        ratingHistory,
        contestHistory: transformedContests,
      },
    };
  } catch (error) {
    console.error('Error fetching member problem solving data:', error);
    return {
      success: false,
      error:
        error.message ||
        'Failed to fetch problem solving data. Please try again.',
    };
  }
}

/**
 * Get member's problem solving data (for viewing other users)
 */
export async function getMemberProblemSolvingDataByUsername(username) {
  try {
    // Get user by username
    const { data: user } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Use getMemberProblemSolvingData with the found user's ID
    const result = await getMemberProblemSolvingData(user.id);
    return result;
  } catch (error) {
    console.error('Error in getMemberProblemSolvingData:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch member problem solving data',
    };
  }
}

/**
 * Get member's problem solving data by user ID (NEW SCHEMA)
 */
export async function getMemberProblemSolvingData(targetUserId) {
  try {
    await requireRole('member');

    // Check if V2 schema is available
    const useV2 = await isV2SchemaAvailable();

    // Fetch data with individual error handling for missing tables
    let profile = null;
    let handles = [];
    let statistics = null;
    let recentSolves = [];
    let recentSubmissions = [];

    // Get user profile
    try {
      const { data } = await supabaseAdmin
        .from('users')
        .select('id, full_name, avatar_url, role')
        .eq('id', targetUserId)
        .single();
      profile = data;
    } catch (e) {
      console.error('Error fetching user profile:', e.message);
    }

    // Get user handles (ALL platforms) - V2 or legacy
    try {
      if (useV2) {
        handles = await getUserHandlesV2(targetUserId);
      } else {
        const { data } = await supabaseAdmin
          .from('user_handles')
          .select(
            'platform, handle, is_verified, rating, max_rating, last_synced_at'
          )
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: true });
        handles = data || [];
      }
    } catch (e) {
      console.error('Error fetching user handles:', e.message);
    }

    // Get user statistics - V2 or legacy
    try {
      if (useV2) {
        statistics = await getUserStatsV2(targetUserId);
      } else {
        const { data } = await supabaseAdmin
          .from('user_problem_stats')
          .select('*')
          .eq('user_id', targetUserId)
          .single();
        statistics = data;
      }
    } catch (e) {
      console.error(
        'Error fetching user stats (table may not exist):',
        e.message
      );
    }

    // Get recent problem solves - V2 or legacy
    try {
      if (useV2) {
        const solves = await getUserSolvesV2(targetUserId, { limit: 10 });
        // Transform to match expected shape with nested problems object
        recentSolves = solves.map((solve) => ({
          first_solved_at: solve.first_solved_at,
          problems: {
            platform: solve.platform,
            problem_id: solve.problem_id,
            problem_name: solve.problem_name,
            difficulty_rating: solve.difficulty_rating,
          },
        }));
      } else {
        const { data } = await supabaseAdmin
          .from('user_problem_solves')
          .select(
            `
            first_solved_at,
            problems!inner(platform, problem_id, problem_name, difficulty_rating)
          `
          )
          .eq('user_id', targetUserId)
          .order('first_solved_at', { ascending: false })
          .limit(10);
        recentSolves = data || [];
      }
    } catch (e) {
      console.error(
        'Error fetching problem solves (table may not exist):',
        e.message
      );
    }

    // Get recent submissions (ALL verdicts) - V2 or legacy
    try {
      if (useV2) {
        recentSubmissions = await getUserSubmissionsV2(targetUserId, {
          limit: 100,
        });
      } else {
        const { data } = await supabaseAdmin
          .from('problem_submissions')
          .select('*')
          .eq('user_id', targetUserId)
          .order('submitted_at', { ascending: false })
          .limit(100);
        recentSubmissions = data || [];
      }
    } catch (e) {
      console.error(
        'Error fetching problem submissions (table may not exist):',
        e.message
      );
    }

    // Get user badges
    let userBadges = [];
    try {
      const { data } = await supabaseAdmin
        .from(V2_TABLES.USER_BADGES)
        .select(
          'id, earned_at, badge_definitions!inner(code, name, description, icon, category)'
        )
        .eq('user_id', targetUserId)
        .order('earned_at', { ascending: false });

      userBadges = (data || []).map((ub) => ({
        id: ub.id,
        earned_at: ub.earned_at,
        code: ub.badge_definitions?.code,
        name: ub.badge_definitions?.name,
        description: ub.badge_definitions?.description,
        icon_url: ub.badge_definitions?.icon,
        category: ub.badge_definitions?.category,
      }));
    } catch (e) {
      console.error('Error fetching user badges:', e.message);
    }

    // Get contest history (from contest_history table, joined with platforms)
    // NOTE: No limit - fetch ALL contests so older platform data isn't cut off
    let contestHistoryData = [];
    let contestHistoryLoaded = false;
    try {
      const { data } = await supabaseAdmin
        .from('contest_history')
        .select(
          `
          *,
          platforms!inner(code, name)
        `
        )
        .eq('user_id', targetUserId)
        .order('contest_date', { ascending: false });
      contestHistoryData = data || [];
      contestHistoryLoaded = true;
    } catch (e) {
      console.error(
        'Error fetching contest history (table may not exist):',
        e.message
      );
    }

    // Get rating history (from rating_history table, joined with platforms and contest_history)
    let ratingHistoryData = [];
    try {
      const { data } = await supabaseAdmin
        .from('rating_history')
        .select(
          `
          *,
          platforms!inner(code, name),
          contest_history(contest_name, external_contest_id, contest_url, rank, total_participants, problems_solved, problems_attempted, total_problems)
        `
        )
        .eq('user_id', targetUserId)
        .order('recorded_at', { ascending: false })
        .limit(200);
      ratingHistoryData = data || [];
    } catch (e) {
      console.error(
        'Error fetching rating history (table may not exist):',
        e.message
      );
    }

    // Get latest sync status per platform from merged sync_jobs table.
    const syncCheckpoints = await getUserSyncStatusByPlatform(targetUserId);

    // Get solved counts per platform from user_solves table (paginated)
    let platformSolvedCounts = {};
    let platformSolvedCountsLoaded = false;
    try {
      const solvedByPlatform = {};
      const PAGE = 1000;
      let from = 0;
      while (true) {
        const { data: page, error } = await supabaseAdmin
          .from('user_solves')
          .select('problem_id, problems!inner(platform_id, platforms!inner(code))')
          .eq('user_id', targetUserId)
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!page || page.length === 0) break;
        page.forEach((solve) => {
          const platformCode = solve.problems?.platforms?.code;
          if (platformCode) {
            solvedByPlatform[platformCode] =
              (solvedByPlatform[platformCode] || 0) + 1;
          }
        });
        if (page.length < PAGE) break;
        from += PAGE;
      }
      platformSolvedCounts = solvedByPlatform;
      platformSolvedCountsLoaded = true;
    } catch (e) {
      console.error('Error fetching platform solved counts:', e.message);
    }

    // Get total submissions per platform (paginated)
    let platformSubmissionCounts = {};
    let platformSubmissionCountsLoaded = false;
    try {
      const countsByPlatform = {};
      const PAGE = 1000;
      let from = 0;
      while (true) {
        const { data: page, error } = await supabaseAdmin
          .from('submissions')
          .select('platform_id, platforms!inner(code)')
          .eq('user_id', targetUserId)
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!page || page.length === 0) break;
        page.forEach((sub) => {
          const platformCode = sub.platforms?.code;
          if (platformCode) {
            countsByPlatform[platformCode] =
              (countsByPlatform[platformCode] || 0) + 1;
          }
        });
        if (page.length < PAGE) break;
        from += PAGE;
      }
      platformSubmissionCounts = countsByPlatform;
      platformSubmissionCountsLoaded = true;
    } catch (e) {
      console.error('Error fetching platform submission counts:', e.message);
    }

    const liveContestCountsByPlatform = {};
    (contestHistoryData || []).forEach((contest) => {
      const platformCode = contest.platforms?.code || contest.platform;
      if (!platformCode || !isLiveContestParticipation(contest)) return;

      liveContestCountsByPlatform[platformCode] =
        (liveContestCountsByPlatform[platformCode] || 0) + 1;
    });

    const summedPlatformSubmissions = Object.values(
      platformSubmissionCounts
    ).reduce((sum, count) => sum + getMaxNonNegativeCount(count), 0);

    const effectiveTotalSubmissions = getMaxNonNegativeCount(
      statistics?.total_submissions,
      statistics?.total_solutions,
      summedPlatformSubmissions
    );

    // Transform statistics (same shape as getProblemSolvingData)
    const transformedStatistics = statistics
      ? {
          total_solved: statistics.total_solved || 0,
          total_solutions: statistics.total_solutions || 0,
          total_submissions: effectiveTotalSubmissions,
          acceptance_rate:
            statistics.total_solved > 0
              ? Math.round(
                  (statistics.total_solved /
                    Math.max(effectiveTotalSubmissions || 1, 1)) *
                    100
                )
              : 0,
          current_streak: statistics.current_streak || 0,
          longest_streak: statistics.longest_streak || 0,

          // Map difficulty ratings to names
          easy_solved:
            (statistics.solved_800 || 0) + (statistics.solved_900 || 0),
          medium_solved:
            (statistics.solved_1000 || 0) +
            (statistics.solved_1100 || 0) +
            (statistics.solved_1200 || 0) +
            (statistics.solved_1300 || 0),
          hard_solved:
            (statistics.solved_1400 || 0) +
            (statistics.solved_1500 || 0) +
            (statistics.solved_1600 || 0) +
            (statistics.solved_1700 || 0),
          expert_solved:
            (statistics.solved_1800 || 0) +
            (statistics.solved_1900 || 0) +
            (statistics.solved_2000 || 0) +
            (statistics.solved_2100 || 0) +
            (statistics.solved_2200 || 0) +
            (statistics.solved_2300 || 0) +
            (statistics.solved_2400 || 0) +
            (statistics.solved_2500_plus || statistics.solved_2000_plus || 0),

          solved_this_week: statistics.solved_this_week || 0,
          solved_this_month: statistics.solved_this_month || 0,
          weighted_score:
            statistics.weighted_score || calculateWeightedScore(statistics),

          // Raw tier breakdown (no V3 tier stats fetched for member view — use flat columns)
          tier_breakdown: {},

          // Platform stats (dynamically generated for ALL connected platforms)
          platform_stats: (handles || []).reduce((acc, handle) => {
            const checkpoint = syncCheckpoints.find(
              (cp) => cp.platform === handle.platform
            );

            acc[handle.platform] = {
              rating: handle.current_rating || handle.rating || 0,
              max_rating: handle.max_rating || 0,
              rank_title: handle.rank_title || null,
              handle: handle.handle,
              is_verified: handle.is_verified || false,
              last_synced_at:
                checkpoint?.sync_completed_at ||
                checkpoint?.last_synced_at ||
                handle.last_synced_at,
              contest_count: contestHistoryLoaded
                ? liveContestCountsByPlatform[handle.platform] || 0
                : 0,
              sync_status: checkpoint?.sync_status || 'pending',
              total_submissions: platformSubmissionCountsLoaded
                ? getMaxNonNegativeCount(
                    platformSubmissionCounts[handle.platform]
                  )
                : 0,
              solved_count: platformSolvedCountsLoaded
                ? getMaxNonNegativeCount(platformSolvedCounts[handle.platform])
                : 0,
              error_message: checkpoint?.error_message || null,
            };
            return acc;
          }, {}),

          global_rank: null,
          weekly_rank: null,
          monthly_rank: null,
        }
      : {
          total_solved: 0,
          platform_stats: {},
        };

    // Load daily activity from user_daily_activity table (full history)
    let dailyActivity = [];
    try {
      if (useV2) {
        const { data: activityRows } = await supabaseAdmin
          .from(V2_TABLES.USER_DAILY_ACTIVITY)
          .select('activity_date, problems_solved')
          .eq('user_id', targetUserId)
          .order('activity_date', { ascending: true });
        dailyActivity = activityRows || [];
      } else {
        dailyActivity = generateDailyActivity(recentSolves || []);
      }
    } catch (e) {
      console.error('Error fetching daily activity:', e.message);
      dailyActivity = generateDailyActivity(recentSolves || []);
    }

    // Transform recentSubmissions — V2 column is external_problem_id
    const transformedSubmissions = (recentSubmissions || []).map((sub) => ({
      id: sub.id,
      platform: sub.platform || 'unknown',
      problem_id: sub.external_problem_id || sub.problem_id || '',
      problem_name: sub.problem_name || '',
      problem_url: sub.problem_url || '',
      submission_id: sub.submission_id || '',
      verdict: sub.verdict || 'UNKNOWN',
      language: sub.language || '',
      submitted_at: sub.submitted_at,
      execution_time_ms: sub.execution_time_ms,
      memory_kb: sub.memory_kb,
      difficulty_rating: sub.difficulty_rating,
      tags: sub.tags || [],
    }));

    // Transform contest history for ContestHistory component
    const transformedContests = transformContestHistory(contestHistoryData);

    // Transform rating history for RatingChart component
    const ratingHistory = transformRatingHistory(ratingHistoryData);

    return {
      success: true,
      data: {
        profile: profile || null,
        handles: handles || [],
        statistics: transformedStatistics,
        recentSolves: recentSolves || [],
        recentSubmissions: transformedSubmissions, // All submissions with any verdict
        dailyActivity,
        badges: userBadges,
        leaderboard: null,
        ratingHistory,
        contestHistory: transformedContests,
      },
    };
  } catch (error) {
    console.error('Error fetching member problem solving data:', error);
    return {
      success: false,
      error:
        error.message ||
        'Failed to fetch problem solving data. Please try again.',
    };
  }
}

/**
 * Connect an online judge handle
 */
