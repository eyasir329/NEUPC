/**
 * @file Leaderboard and tag statistics actions.
 * @module problem-solving-actions/leaderboard
 */

'use server';

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { ProblemTagService } from '@/app/_lib/services/problem-tag-service';

export async function getLeaderboardAction(
  type = 'global',
  limit = 50,
  offset = 0
) {
  try {
    await requireRole('member');

    const sortColumn =
      {
        global: 'global_rank',
        weekly: 'weekly_rank',
        monthly: 'monthly_rank',
      }[type] || 'global_rank';

    const {
      data: leaderboard,
      error,
      count,
    } = await supabaseAdmin
      .from('leaderboard_cache')
      .select(
        `
        *,
        users:user_id (
          id,
          full_name,
          avatar_url
        )
      `,
        { count: 'exact' }
      )
      .order(sortColumn, { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const formattedLeaderboard = (leaderboard || []).map((entry) => ({
      rank: entry[sortColumn],
      userId: entry.user_id,
      name: entry.users?.full_name || 'Unknown',
      avatar: entry.users?.avatar_url,
      score:
        type === 'global'
          ? entry.total_score
          : type === 'weekly'
            ? entry.weekly_score
            : entry.monthly_score,
      totalSolved: entry.total_solved,
      weeklySolved: entry.weekly_solved,
      monthlySolved: entry.monthly_solved,
    }));

    return {
      success: true,
      data: {
        type,
        leaderboard: formattedLeaderboard,
        pagination: {
          total: count,
          limit,
          offset,
          hasMore: offset + limit < count,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch leaderboard. Please try again.',
    };
  }
}

// ============================================
// TAG STATISTICS
// ============================================

/**
 * Get tag statistics for the current user
 * Returns aggregated counts of problems solved by tag
 */
export async function getTagStatisticsAction() {
  try {
    const { user } = await requireRole('member');

    const tagService = new ProblemTagService();
    const tagStats = await tagService.getTagStatistics(user.id);

    return {
      success: true,
      data: {
        tag_stats: tagStats,
        total_tags: Object.keys(tagStats).length,
      },
    };
  } catch (error) {
    console.error('Error fetching tag statistics:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch tag statistics',
    };
  }
}

/**
 * Update missing tags for problems that don't have tags
 * Uses AI detection when platform tags aren't available
 */
export async function updateMissingTagsAction(limit = 50) {
  try {
    const { user } = await requireRole('member');

    const tagService = new ProblemTagService();
    const result = await tagService.updateMissingTags(user.id, limit);

    return {
      success: true,
      data: {
        updated: result.updated,
        errors: result.errors,
        message: `Updated tags for ${result.updated} problems`,
      },
    };
  } catch (error) {
    console.error('Error updating missing tags:', error);
    return {
      success: false,
      error: error.message || 'Failed to update missing tags',
    };
  }
}

// ============================================
// UPCOMING CONTESTS (clist)
// ============================================

