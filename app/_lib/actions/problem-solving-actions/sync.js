/**
 * @file Sync actions: submissions, contest/rating history, full sync.
 * @module problem-solving-actions/sync
 */

'use server';

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { PROBLEM_SOLVING_PLATFORM_IDS } from '@/app/_lib/services/problem-solving-platforms';
import { ClistService, ProblemSolvingAggregator } from '@/app/_lib/services/problem-solving-services';
import { V2_TABLES, getPlatformId, getUserHandlesV2, isV2SchemaAvailable } from '@/app/_lib/services/problem-solving-v2-helpers';
import { revalidatePath } from 'next/cache';
import {
  buildSmartUpdate,
  rebuildLeaderboard,
} from './_helpers';

const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Sync user's submissions from all connected platforms
 * @param {boolean} forceFullSync - If true, fetches ALL submissions (not just new ones)
 */
export async function syncSubmissionsAction(forceFullSync = false) {
  try {
    const { user } = await requireRole('member');

    // Check rate limit (less strict for incremental syncs)
    const cooldown = forceFullSync ? SYNC_COOLDOWN_MS : 60 * 1000; // 1 min for incremental
    const { data: lastSync } = await supabaseAdmin
      .from('user_statistics')
      .select('last_updated')
      .eq('user_id', user.id)
      .single();

    if (lastSync?.last_updated) {
      const timeSinceSync =
        Date.now() - new Date(lastSync.last_updated).getTime();
      if (timeSinceSync < cooldown) {
        const waitTime = Math.ceil((cooldown - timeSinceSync) / 1000);
        return {
          success: false,
          error: `Please wait ${waitTime} seconds before syncing again`,
        };
      }
    }

    // Run sync (with or without full sync flag)
    const aggregator = new ProblemSolvingAggregator();
    const result = await aggregator.syncUserSubmissions(user.id, forceFullSync);

    // Update leaderboard
    await rebuildLeaderboard();

    return {
      success: true,
      data: {
        synced: result.synced,
        platforms: result.platforms,
        message: forceFullSync
          ? `Full sync completed: ${result.synced} total submissions`
          : `Synced ${result.synced} new submissions`,
      },
    };
  } catch (error) {
    console.error('Error syncing submissions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync submissions for a specific platform only
 * Syncs submissions, rating history, and contest history via CLIST with caching
 * @param {string} platform - Platform ID to sync
 * @param {boolean} forceFullSync - If true, fetches ALL submissions
 */
export async function syncPlatformAction(
  platform,
  forceFullSync = false,
  manualHtml = null
) {
  try {
    const { user } = await requireRole('member');

    // Validate platform
    if (!PROBLEM_SOLVING_PLATFORM_IDS.includes(platform)) {
      return { success: false, error: 'Invalid platform' };
    }

    const isLeetCode = platform === 'leetcode';

    // Check if V2 schema is available
    const useV2 = await isV2SchemaAvailable();
    const handlesTable = useV2 ? V2_TABLES.USER_HANDLES : 'user_handles';

    // Check if user has this platform connected
    let handle = null;
    if (useV2) {
      const platformId = await getPlatformId(platform);
      const { data } = await supabaseAdmin
        .from(handlesTable)
        .select('handle')
        .eq('user_id', user.id)
        .eq('platform_id', platformId)
        .single();
      handle = data;
    } else {
      const { data } = await supabaseAdmin
        .from(handlesTable)
        .select('handle')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .single();
      handle = data;
    }

    if (!handle) {
      return { success: false, error: `No ${platform} handle connected` };
    }
    // Initialize aggregator and CLIST service
    const aggregator = new ProblemSolvingAggregator();
    const clistService = new ClistService();
    const clistConfigured = clistService.isConfigured();

    // STEP 1: Sync submissions
    const submissionsResult = await aggregator.syncPlatformSubmissions(
      user.id,
      platform,
      forceFullSync,
      manualHtml
    );

    // Check for errors - syncPlatformSubmissions may return 'error' (string) or 'errors' (array)
    if (submissionsResult.error) {
      return { success: false, error: submissionsResult.error };
    }

    // For SPOJ: if Cloudflare blocked the sync and no manual HTML was provided,
    // return a clear error instead of silently succeeding with 0 submissions
    if (
      platform === 'spoj' &&
      !manualHtml &&
      submissionsResult.extensionRequired &&
      (submissionsResult.synced || 0) === 0
    ) {
      return {
        success: false,
        error:
          'SPOJ is protected by Cloudflare and cannot be synced automatically. Use the "Manual Import" button on the SPOJ card — visit your SPOJ profile, Select All (Ctrl+A), Copy (Ctrl+C), then paste it in.',
      };
    }

    // Facebook Hacker Cup currently depends on browser-extension extraction.
    if (
      platform === 'facebookhackercup' &&
      submissionsResult.extensionRequired &&
      (submissionsResult.synced || 0) === 0
    ) {
      return {
        success: false,
        error:
          'Facebook Hacker Cup sync tried CLIST first, but CLIST could not map your connected handle to an account. CLIST usually stores FBHC account handles as numeric IDs (not username aliases). Update your connected FBHC handle to the CLIST account handle if available, or use browser extension import from your Hacker Cup profile/competition history page, then refresh this dashboard.',
      };
    }

    const submissionsSynced = submissionsResult.synced || 0;

    // STEP 2: Sync rating history via CLIST with fallback
    let ratingHistorySynced = 0;
    if (clistConfigured) {
      try {
        const ratingHistory = await clistService.getRatingHistory(
          platform,
          handle.handle,
          user.id // Pass userId for caching
        );

        if (ratingHistory && ratingHistory.length > 0) {
          const ratingResult = await clistService.saveRatingHistory(
            user.id,
            ratingHistory,
            'clist'
          );
          ratingHistorySynced = ratingResult.saved || 0;
        }
      } catch (ratingError) {
        console.warn(
          `[syncPlatformAction] Rating sync failed for ${platform}:`,
          ratingError.message
        );
      }
    }

    // STEP 3: Sync contest history via CLIST with fallback
    let contestHistorySynced = 0;
    if (clistConfigured) {
      try {
        const contestHistory = await clistService.getContestHistory(
          platform,
          handle.handle,
          10000, // Fetch all contests
          user.id // Pass userId for caching
        );

        if (contestHistory && contestHistory.length > 0) {
          const contestResult = await clistService.saveContestHistory(
            user.id,
            contestHistory,
            'clist'
          );
          contestHistorySynced = contestResult.saved || 0;
        }
      } catch (contestError) {
        console.warn(
          `[syncPlatformAction] Contest sync failed for ${platform}:`,
          contestError.message
        );
      }
    }

    // Update user statistics with platform stats (this updates the platform card data)
    await aggregator.updateUserStatistics(user.id, true);

    // Update last_synced_at for this platform handle
    if (useV2) {
      const platformId = await getPlatformId(platform);
      await supabaseAdmin
        .from(V2_TABLES.USER_HANDLES)
        .update({ last_synced_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('platform_id', platformId);
    } else {
      await supabaseAdmin
        .from('user_handles')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('platform', platform);
    }

    // Update leaderboard
    await rebuildLeaderboard();

    // Revalidate all problem-solving related paths to clear Next.js cache
    revalidatePath('/account/member/problem-solving', 'page');
    revalidatePath('/api/problem-solving/problems', 'page');
    revalidatePath('/api/problem-solving/stats', 'page');

    let message = `Synced ${submissionsSynced} submissions, ${ratingHistorySynced} rating entries, ${contestHistorySynced} contest entries from ${platform}`;
    if (isLeetCode) {
      message +=
        ' For full LeetCode submission history, use the browser extension extractor.';
    }

    return {
      success: true,
      data: {
        synced: submissionsSynced,
        platform,
        ratingHistorySynced,
        contestHistorySynced,
        extensionRequired: submissionsResult.extensionRequired || false,
        message,
      },
    };
  } catch (error) {
    console.error(`Error syncing ${platform}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync contest history specifically (with force update to get problem badges)
 * This will update existing records with new problem data from CLIST
 */
export async function syncContestHistoryAction(forceUpdate = true) {
  try {
    const { user } = await requireRole('member');

    // Get user's connected handles (V2-aware)
    const useV2 = await isV2SchemaAvailable();
    let handles = [];

    if (useV2) {
      handles = await getUserHandlesV2(user.id);
    } else {
      const { data } = await supabaseAdmin
        .from('user_handles')
        .select('platform, handle')
        .eq('user_id', user.id);
      handles = data || [];
    }

    if (!handles || handles.length === 0) {
      return {
        success: false,
        error: 'No handles connected. Connect a platform first.',
      };
    }

    const clistService = new ClistService();

    if (!clistService.isConfigured()) {
      return {
        success: false,
        error: 'Contest history service is not configured.',
      };
    }

    // Starting contest history sync

    const allowedPlatforms = ['codeforces', 'codechef', 'atcoder', 'leetcode'];
    const handlesList = handles
      .filter((h) => allowedPlatforms.includes(h.platform))
      .map((h) => ({
        platform: h.platform,
        handle: h.handle,
      }));

    if (handlesList.length === 0) {
      return {
        success: true,
        data: {
          synced: 0,
          message: 'No contest history sync needed: none of the supported platforms (Codeforces, CodeChef, AtCoder, LeetCode) are connected.',
        },
      };
    }

    // Fetch contest history from CLIST
    const contestHistory = await clistService.getAggregatedContestHistory(
      handlesList,
      10000, // Fetch ALL contests
      false  // Skip native platform API enrichment - CLIST data is sufficient
    );

    if (!contestHistory || contestHistory.length === 0) {
      return {
        success: true,
        data: {
          synced: 0,
          message: 'No contest history found for your handles.',
        },
      };
    }

    // Contests fetched successfully

    // If forceUpdate is true, update existing records with new problem data
    let saved = 0;
    let updated = 0;

    if (forceUpdate) {
      // Get existing contest history for this user - fetch FULL records for smart merge
      const { data: existingContests } = await supabaseAdmin
        .from('contest_history')
        .select('*')
        .eq('user_id', user.id);

      // Map by composite key, storing full record for smart merge comparison
      const existingMap = new Map(
        (existingContests || []).map((c) => [
          `${c.platform_id}:${c.external_contest_id}`,
          c, // Store full record, not just id
        ])
      );

      // Separate new and existing records
      const newRecords = [];
      const updateRecords = [];

      for (const entry of contestHistory) {
        // Get platform_id from platform code
        const platformId = await getPlatformId(entry.platform);
        if (!platformId) {
          console.warn(
            `[syncContestHistoryAction] Unknown platform: ${entry.platform}`
          );
          continue;
        }

        const key = `${platformId}:${entry.contestId}`;

        const record = {
          user_id: user.id,
          platform_id: platformId,
          external_contest_id: entry.contestId?.toString(),
          contest_name: entry.name || entry.contestName,
          contest_url: entry.url || entry.contestUrl || null,
          contest_date: entry.date,
          contest_end_date: entry.endDate || null,
          duration_minutes: entry.durationMinutes || entry.duration || null,
          rank: entry.rank || null,
          total_participants: entry.totalParticipants || null,
          score: entry.score || null,
          max_score: entry.maxScore || null,
          problems_solved: entry.solved || entry.problemsSolved || 0,
          problems_attempted: entry.problemsAttempted || null,
          total_problems: entry.totalProblems || null,
          problems_data: entry.problems || null, // jsonb column - no need to stringify
          penalty: entry.penalty || null,
          platform_contest_id: entry.platformContestId || null,
          old_rating: entry.oldRating || null,
          new_rating: entry.newRating || null,
          rating_change: entry.ratingChange || null,
          is_rated: entry.isRated !== false,
          is_virtual: entry.isVirtual || false,
          division: entry.division || null,
        };

        // Check if totalParticipants is missing
        if (!record.total_participants && record.rank) {
          // Contest has rank but no totalParticipants
        } else if (record.total_participants && record.rank) {
          // Contest has both rank and totalParticipants
        }

        const existingRecord = existingMap.get(key);

        if (existingRecord) {
          // Store existing record with new data for smart merge
          updateRecords.push({ existingRecord, newData: record });
        } else {
          newRecords.push(record);
        }
      }

      // Insert new records
      if (newRecords.length > 0) {
        const { data, error: insertError } = await supabaseAdmin
          .from('contest_history')
          .insert(newRecords)
          .select('id');

        if (insertError) {
          console.error(
            '[syncContestHistoryAction] Insert error:',
            insertError.message
          );
        } else {
          saved = data?.length || newRecords.length;
        }
      }

      // Update existing records using SMART MERGE
      // Only update fields where new data is "better" than existing
      let updateErrors = 0;
      let _skippedUpdates = 0; // Tracked but not reported (smart merge optimization)

      for (const { existingRecord, newData } of updateRecords) {
        // Use smart merge to determine what actually needs updating
        const smartUpdate = buildSmartUpdate(existingRecord, newData);

        if (!smartUpdate) {
          // No updates needed - existing data is already good
          _skippedUpdates++;
          continue;
        }

        const { error: updateError } = await supabaseAdmin
          .from('contest_history')
          .update(smartUpdate)
          .eq('id', existingRecord.id);

        if (updateError) {
          updateErrors++;
          console.error(
            `[syncContestHistoryAction] Update error for contest ${existingRecord.id}:`,
            updateError.message
          );
        } else {
          updated++;
        }
      }

      if (updateErrors > 0) {
        console.warn(
          `[syncContestHistoryAction] ${updateErrors} update errors occurred`
        );
      }

      // Records saved and updated successfully
    } else {
      // Just save new records (default behavior)
      const result = await clistService.saveContestHistory(
        user.id,
        contestHistory,
        'clist'
      );
      saved = result.saved || 0;
    }

    // Update contest names with real names from CLIST API
    // This fixes any contests saved with generic "Contest #ID" names
    const nameUpdateResult = await clistService.updateContestNamesInDatabase(
      user.id
    );
    const namesUpdated = nameUpdateResult.updated || 0;

    // Update user statistics with platform stats after contest sync
    const aggregator = new ProblemSolvingAggregator();
    await aggregator.updateUserStatistics(user.id, true);

    // Revalidate problem-solving pages to show updated contest data
    revalidatePath('/account/member/problem-solving', 'page');
    revalidatePath('/api/problem-solving/stats', 'page');

    return {
      success: true,
      data: {
        synced: saved,
        updated: updated,
        namesUpdated: namesUpdated,
        total: contestHistory.length,
        message: `Synced ${saved} new, updated ${updated} existing contest${saved + updated !== 1 ? 's' : ''}${namesUpdated > 0 ? `, enriched ${namesUpdated} contest name${namesUpdated !== 1 ? 's' : ''}` : ''}`,
      },
    };
  } catch (error) {
    console.error('[syncContestHistoryAction] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync rating history specifically
 * Fetches rating history from CLIST for all connected handles of the allowed 4 platforms
 */
export async function syncRatingHistoryAction() {
  try {
    const { user } = await requireRole('member');

    // Get user's connected handles (V2-aware)
    const useV2 = await isV2SchemaAvailable();
    let handles = [];

    if (useV2) {
      handles = await getUserHandlesV2(user.id);
    } else {
      const { data } = await supabaseAdmin
        .from('user_handles')
        .select('platform, handle')
        .eq('user_id', user.id);
      handles = data || [];
    }

    if (handles.length === 0) {
      return {
        success: false,
        error: 'No handles connected. Connect a platform first.',
      };
    }

    const clistService = new ClistService();
    const clistConfigured = clistService.isConfigured();

    if (!clistConfigured) {
      return {
        success: false,
        error: 'CLIST service is not configured on the server.',
      };
    }

    const allowedPlatforms = ['codeforces', 'codechef', 'atcoder', 'leetcode'];
    const handlesList = handles
      .filter((h) => allowedPlatforms.includes(h.platform))
      .map((h) => ({
        platform: h.platform,
        handle: h.handle,
      }));

    if (handlesList.length === 0) {
      return {
        success: true,
        data: {
          synced: 0,
          message: 'No supported handles connected.',
        },
      };
    }

    let totalSaved = 0;
    for (const { platform, handle } of handlesList) {
      try {
        const ratingHistory = await clistService.getRatingHistory(
          platform,
          handle,
          user.id // Pass userId for caching
        );

        if (ratingHistory && ratingHistory.length > 0) {
          const ratingResult = await clistService.saveRatingHistory(
            user.id,
            ratingHistory,
            'clist'
          );
          totalSaved += ratingResult.saved || 0;
        }
      } catch (err) {
        console.error(
          `[syncRatingHistoryAction] Error syncing rating history for ${platform}/${handle}:`,
          err.message
        );
      }
    }

    // Revalidate problem-solving pages to show updated rating data
    revalidatePath('/account/member/problem-solving', 'page');
    revalidatePath('/api/problem-solving/stats', 'page');

    return {
      success: true,
      data: {
        synced: totalSaved,
        message: `Synced ${totalSaved} rating entries across platforms.`,
      },
    };
  } catch (error) {
    console.error('[syncRatingHistoryAction] Error:', error);
    return { success: false, error: error.message };
  }
}


/**
 * Update contest names in database with real names from CLIST API
 * This fixes contests that were saved with generic "Contest #ID" names
 * @param {boolean} allUsers - If true, update for all users; if false, only current user
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function updateContestNamesAction(allUsers = false) {
  'use server';
  try {
    const { user } = await requireRole('member');

    const clistService = new ClistService();

    if (!clistService.isConfigured()) {
      return {
        success: false,
        error: 'CLIST service is not configured.',
      };
    }

    // Only admins can update for all users
    let targetUserId = user.id;
    if (allUsers) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        targetUserId = user.id; // Non-admins can only update their own
      } else {
        targetUserId = null; // null means all users
      }
    }

    const result =
      await clistService.updateContestNamesInDatabase(targetUserId);

    // Revalidate problem-solving pages to show updated contest data
    revalidatePath('/account/member/problem-solving', 'page');

    return {
      success: true,
      data: {
        updated: result.updated,
        errors: result.errors,
        remaining: result.remaining,
        message: `Updated ${result.updated} contest name${result.updated !== 1 ? 's' : ''}${result.remaining > 0 ? `, ${result.remaining} remaining` : ''}`,
      },
    };
  } catch (error) {
    console.error('[updateContestNamesAction] Error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// LEADERBOARD
// ============================================

/**
 * Fetch platform statistics from external APIs and update user_problem_stats (NEW SCHEMA)
 * This function is deprecated in the Codeforces-only approach but kept for compatibility
 */
export async function fetchPlatformStatsAction() {
  try {
    const { user } = await requireRole('member');

    // In new schema, stats are calculated from actual problem solves
    // This function could trigger a recalculation instead of fetching from external APIs

    console.warn(
      'fetchPlatformStatsAction: This function is deprecated in new schema. Use Codeforces scraper instead.'
    );

    // Get current user stats
    const { data: currentStats } = await supabaseAdmin
      .from('user_problem_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!currentStats) {
      // Create empty stats record
      await supabaseAdmin
        .from('user_problem_stats')
        .insert({ user_id: user.id });
    }

    return {
      success: true,
      data: {
        message:
          'Use /api/problem-solving/import-codeforces for data import in new schema',
        stats: currentStats || {},
      },
    };
  } catch (error) {
    console.error('Error in fetchPlatformStatsAction:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync submissions AND fetch platform stats in one action
 * Use this for a full refresh of user data
 * @param {boolean} forceFullSync - If true, fetches ALL submissions (not just new ones)
 */
/**
 * Full sync action - syncs ALL platforms with submissions, rating history, and contest history
 * Uses CLIST API with fallbacks and caching for comprehensive data sync
 */
export async function fullSyncAction(forceFullSync = false) {
  try {
    const { user } = await requireRole('member');

    // Check rate limit using user_problem_stats table
    const { data: userStats } = await supabaseAdmin
      .from('user_problem_stats')
      .select('updated_at')
      .eq('user_id', user.id)
      .single();

    if (userStats?.updated_at) {
      const timeSinceSync =
        Date.now() - new Date(userStats.updated_at).getTime();
      const SYNC_COOLDOWN_MS = 60000; // 1 minute cooldown

      if (timeSinceSync < SYNC_COOLDOWN_MS && !forceFullSync) {
        const waitTime = Math.ceil((SYNC_COOLDOWN_MS - timeSinceSync) / 1000);
        return {
          success: false,
          error: `Please wait ${waitTime} seconds before syncing again.`,
        };
      }
    }

    // Get user handles for ALL platforms
    const useV2 = await isV2SchemaAvailable();
    let handles = [];

    if (useV2) {
      handles = await getUserHandlesV2(user.id);
    } else {
      const { data: legacyHandles } = await supabaseAdmin
        .from('user_handles')
        .select('platform, handle')
        .eq('user_id', user.id);
      handles = legacyHandles || [];
    }

    if (!handles || handles.length === 0) {
      return {
        success: false,
        error:
          'No platform handles connected. Please connect at least one platform handle first.',
      };
    }
    // Initialize aggregator and CLIST service
    const aggregator = new ProblemSolvingAggregator();
    const clistService = new ClistService();
    const clistConfigured = clistService.isConfigured();

    // Track results from all platforms
    let totalSubmissions = 0;
    let totalRatingHistorySynced = 0;
    let totalContestHistorySynced = 0;
    const platformResults = [];

    // Sync each platform
    for (const handleRecord of handles) {
      const { platform, handle } = handleRecord;

      try {
        // STEP 1: Sync submissions
        const submissionsResult = await aggregator.syncPlatformSubmissions(
          user.id,
          platform,
          forceFullSync
        );

        const submissionsSynced = submissionsResult.synced || 0;
        totalSubmissions += submissionsSynced;

        // STEP 2: Sync rating history via CLIST with fallback
        let ratingHistorySynced = 0;
        if (clistConfigured) {
          try {
            const ratingHistory = await clistService.getRatingHistory(
              platform,
              handle,
              user.id // Pass userId for caching
            );

            if (ratingHistory && ratingHistory.length > 0) {
              const ratingResult = await clistService.saveRatingHistory(
                user.id,
                ratingHistory,
                'clist'
              );
              ratingHistorySynced = ratingResult.saved || 0;
              totalRatingHistorySynced += ratingHistorySynced;
            }
          } catch (ratingError) {
            console.warn(
              `[fullSyncAction] Rating sync failed for ${platform}:`,
              ratingError.message
            );
          }
        }

        // STEP 3: Sync contest history via CLIST with fallback
        let contestHistorySynced = 0;
        if (clistConfigured) {
          try {
            const contestHistory = await clistService.getContestHistory(
              platform,
              handle,
              10000, // Fetch all contests
              user.id // Pass userId for caching
            );
            if (contestHistory && contestHistory.length > 0) {
              const contestResult = await clistService.saveContestHistory(
                user.id,
                contestHistory,
                'clist'
              );
              contestHistorySynced =
                (contestResult.saved || 0) + (contestResult.updated || 0);
              totalContestHistorySynced += contestHistorySynced;
            }
          } catch (contestError) {
            console.warn(
              `[fullSyncAction] Contest sync failed for ${platform}:`,
              contestError.message
            );
          }
        }

        platformResults.push({
          platform,
          synced: submissionsSynced,
          ratingHistorySynced,
          contestHistorySynced,
        });
      } catch (platformError) {
        console.error(
          `[fullSyncAction] Platform sync failed for ${platform}:`,
          platformError.message
        );
        platformResults.push({
          platform,
          synced: 0,
          error: platformError.message,
        });
      }
    }

    // Update user statistics with platform stats
    await aggregator.updateUserStatistics(user.id, true);

    // STEP 4: Run aggregated contest history sync with problem data enrichment
    // This fetches all contests across all platforms with comprehensive data
    let contestNamesUpdated = 0;
    if (clistConfigured) {
      try {
        // Format handles for getAggregatedContestHistory
        const handlesList = handles.map((h) => ({
          platform: h.platform,
          handle: h.handle,
        }));

        const aggregatedContests =
          await clistService.getAggregatedContestHistory(
            handlesList,
            10000, // Fetch ALL contests
            false  // Skip native platform API enrichment
          );

        if (aggregatedContests && aggregatedContests.length > 0) {
          // Save with comprehensive data (problems_data, total_problems, etc.)
          const aggregatedResult = await clistService.saveContestHistory(
            user.id,
            aggregatedContests,
            'clist'
          );
        }

        // Update contest names with real names from CLIST API
        const nameUpdateResult =
          await clistService.updateContestNamesInDatabase(user.id);
        contestNamesUpdated = nameUpdateResult.updated || 0;

        if (contestNamesUpdated > 0) {
        }
      } catch (aggregateError) {
        console.warn(
          '[fullSyncAction] Aggregated contest sync failed:',
          aggregateError.message
        );
      }
    }

    // Update last_synced_at for all synced platform handles
    if (useV2) {
      const platformIds = handles.map((h) => h.platform_id).filter(Boolean);
      if (platformIds.length > 0) {
        await supabaseAdmin
          .from(V2_TABLES.USER_HANDLES)
          .update({ last_synced_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .in('platform_id', platformIds);
      }
    } else {
      const platforms = handles.map((h) => h.platform);
      await supabaseAdmin
        .from('user_handles')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .in('platform', platforms);
    }

    // Update leaderboard
    await rebuildLeaderboard();

    // Revalidate all problem-solving related paths to clear Next.js cache
    revalidatePath('/account/member/problem-solving', 'page');
    revalidatePath('/api/problem-solving/problems', 'page');
    revalidatePath('/api/problem-solving/stats', 'page');

    const message = `Sync completed: ${totalSubmissions} submissions, ${totalRatingHistorySynced} rating entries, ${totalContestHistorySynced} contest entries from ${handles.length} platform(s)${contestNamesUpdated > 0 ? `, ${contestNamesUpdated} contest names enriched` : ''}`;
    return {
      success: true,
      data: {
        synced: totalSubmissions,
        platforms: platformResults,
        ratingHistorySynced: totalRatingHistorySynced,
        contestHistorySynced: totalContestHistorySynced,
        contestNamesUpdated,
        message,
      },
    };
  } catch (error) {
    console.error('Error in full sync:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get leaderboard data
 */
