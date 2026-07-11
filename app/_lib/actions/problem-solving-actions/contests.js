/**
 * @file Upcoming contests action.
 * @module problem-solving-actions/contests
 */

'use server';

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { ClistService } from '@/app/_lib/services/problem-solving-services';

const UPCOMING_CONTEST_PLATFORMS = [
  'codeforces',
  'atcoder',
  'leetcode',
  'codechef',
];
const UPCOMING_CONTESTS_STALE_MS = 6 * 60 * 60 * 1000;

/**
 * Get upcoming CP contests (Codeforces, AtCoder, LeetCode, CodeChef) for the
 * problem-solving "Upcoming Contests" feed. Reads from external_contests, and
 * refreshes from the clist API when the cached feed is empty or stale (or when
 * forceRefresh is requested). clist responses are themselves cached by the
 * service, so refreshes stay within rate limits.
 *
 * @param {boolean} forceRefresh - Force a clist re-sync regardless of freshness
 */
export async function getUpcomingContestsAction(forceRefresh = false) {
  try {
    await requireRole('member');

    const {
      getUpcomingExternalContests,
      getExternalContestsSyncedAt,
      upsertExternalContests,
    } = await import('@/app/_lib/services/data/external-contests');

    let shouldSync = forceRefresh;
    if (!shouldSync) {
      const syncedAt = await getExternalContestsSyncedAt();
      shouldSync =
        !syncedAt ||
        Date.now() - new Date(syncedAt).getTime() > UPCOMING_CONTESTS_STALE_MS;
    }

    if (shouldSync) {
      try {
        const clist = new ClistService();
        if (clist.isConfigured()) {
          const contests = await clist.getUpcomingContests(
            UPCOMING_CONTEST_PLATFORMS
          );
          if (contests.length > 0) {
            const now = new Date().toISOString();
            await upsertExternalContests(
              contests.map((c) => ({
                clist_id: c.clistId,
                platform: c.platform,
                resource: c.resource,
                name: c.name,
                url: c.url,
                start_time: c.startTime,
                end_time: c.endTime,
                duration_seconds: c.durationSeconds,
                synced_at: now,
              }))
            );
          }
        }
      } catch (syncError) {
        // Network/clist failures shouldn't break the page — serve whatever
        // upcoming contests are already cached in the DB.
        console.error(
          '[getUpcomingContestsAction] clist sync failed:',
          syncError.message
        );
      }
    }

    const rows = await getUpcomingExternalContests(50);
    return {
      success: true,
      data: rows.map((c) => ({
        id: c.id,
        platform: c.platform,
        name: c.name,
        url: c.url,
        startTime: c.start_time,
        endTime: c.end_time,
        durationSeconds: c.duration_seconds,
      })),
    };
  } catch (error) {
    console.error('[getUpcomingContestsAction] error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to load upcoming contests',
      data: [],
    };
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Normalize platform handle input (supports LeetCode URL/@ formats)
 */
