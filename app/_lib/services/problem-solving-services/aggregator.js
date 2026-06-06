/**
 * @file aggregator — split from the problem-solving-services module.
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { PROBLEM_SOLVING_PLATFORM_IDS } from '@/app/_lib/services/problem-solving-platforms';
import {
  V2_TABLES,
  getPlatformCode,
  getPlatformId,
  isV2SchemaAvailable,
} from '@/app/_lib/services/problem-solving-v2-helpers';

import {
  isHeuristicLeetCodeSubmissionId,
  normalizeLeetCodeProblemSlug,
  normalizeSubmissionTimestamp,
  normalizeSubmissionVerdict,
} from './_shared';
import { AtCoderService } from './atcoder';
import { CFGymService } from './cfgym';
import { ClistService } from './clist';
import { CodeChefService } from './codechef';
import { CodeforcesService } from './codeforces';
import { CSAcademyService } from './csacademy';
import { CSESService } from './cses';
import { EOlympService } from './eolymp';
import { HackerRankService } from './hackerrank';
import { KattisService } from './kattis';
import { LeetCodeService } from './leetcode';
import { LightOJService } from './lightoj';
import { SPOJService } from './spoj';
import { TopCoderService } from './topcoder';
import { TophService } from './toph';
import { USACOService } from './usaco';
import { UVAService } from './uva';
import { VJudgeService } from './vjudge';

// ============================================
// UNIFIED DATA AGGREGATOR
// ============================================
export class ProblemSolvingAggregator {
  constructor() {
    // Core platforms
    this.codeforces = new CodeforcesService();
    this.atcoder = new AtCoderService();
    this.leetcode = new LeetCodeService();

    // Additional platforms
    this.toph = new TophService();
    this.cses = new CSESService();
    this.codechef = new CodeChefService();
    this.topcoder = new TopCoderService();
    this.hackerrank = new HackerRankService();
    this.kattis = new KattisService();
    this.lightoj = new LightOJService();
    this.uva = new UVAService();
    this.spoj = new SPOJService();
    this.vjudge = new VJudgeService();
    this.cfgym = new CFGymService();
    this.csacademy = new CSAcademyService();
    this.eolymp = new EOlympService();
    this.usaco = new USACOService();

    // Sync lock to prevent concurrent syncs for the same user
    this.activeSyncs = new Map(); // userId -> Set<platform>
  }

  // ============================================
  // SYNC LOCK MANAGEMENT
  // ============================================

  /**
   * Acquire a sync lock for a user+platform combination
   * Returns true if lock acquired, false if already locked
   */
  acquireSyncLock(userId, platform) {
    if (!this.activeSyncs.has(userId)) {
      this.activeSyncs.set(userId, new Set());
    }

    const userLocks = this.activeSyncs.get(userId);
    if (userLocks.has(platform)) {
      return false; // Already locked
    }

    userLocks.add(platform);
    return true; // Lock acquired
  }

  /**
   * Release a sync lock for a user+platform combination
   */
  releaseSyncLock(userId, platform) {
    const userLocks = this.activeSyncs.get(userId);
    if (userLocks) {
      userLocks.delete(platform);
      if (userLocks.size === 0) {
        this.activeSyncs.delete(userId);
      }
    }
  }

  /**
   * Check if a sync is already in progress
   */
  isSyncInProgress(userId, platform) {
    const userLocks = this.activeSyncs.get(userId);
    return userLocks ? userLocks.has(platform) : false;
  }

  // ============================================
  // SYNC CHECKPOINT MANAGEMENT
  // ============================================

  /**
   * Create or get existing sync checkpoint for a platform
   * Uses upsert to handle unique constraint on (user_id, platform)
   */
  async getOrCreateCheckpoint(userId, platform, forceNew = false) {
    try {
      const platformId = await getPlatformId(platform);
      if (!platformId) {
        console.error(`[CHECKPOINT] Unknown platform code: ${platform}`);
        return null;
      }

      // sync_checkpoints was merged into sync_jobs; fetch the latest submissions job.
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from(V2_TABLES.SYNC_JOBS)
        .select('*')
        .eq('user_id', userId)
        .eq('platform_id', platformId)
        .eq('job_type', 'submissions')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const toLegacyCheckpoint = (job) => {
        if (!job) return null;
        return {
          id: job.id,
          user_id: job.user_id,
          platform,
          sync_status: job.status,
          sync_started_at: job.started_at,
          sync_completed_at: job.completed_at,
          total_inserted: job.inserted_items,
          last_submission_date: job.last_processed_id,
          last_synced_at: job.last_processed_at || job.completed_at,
          error_message: job.error_message,
        };
      };

      // If existing checkpoint found
      if (existing && !fetchError) {
        // If it's in_progress and we're not forcing new, just resume it
        if (existing.status === 'in_progress' && !forceNew) {
          return toLegacyCheckpoint(existing);
        }

        // Otherwise, update the existing checkpoint to start a new sync
        const { data: updated, error: updateError } = await supabaseAdmin
          .from(V2_TABLES.SYNC_JOBS)
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
            completed_at: null,
            error_message: null,
            last_processed_id: null,
            last_processed_at: null,
            inserted_items: 0,
            processed_items: 0,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          console.error(
            `[CHECKPOINT] Error updating existing checkpoint:`,
            updateError
          );
          return toLegacyCheckpoint(existing); // Return existing checkpoint even if update failed
        }
        return toLegacyCheckpoint(updated);
      }

      // No existing checkpoint found, create new one
      const { data: checkpoint, error } = await supabaseAdmin
        .from(V2_TABLES.SYNC_JOBS)
        .insert({
          user_id: userId,
          platform_id: platformId,
          job_type: 'submissions',
          status: 'in_progress',
          scheduled_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        // Handle race condition - another request may have created checkpoint
        if (error.code === '23505') {
          // Unique constraint violation
          const { data: raceCheckpoint } = await supabaseAdmin
            .from(V2_TABLES.SYNC_JOBS)
            .select('*')
            .eq('user_id', userId)
            .eq('platform_id', platformId)
            .eq('job_type', 'submissions')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          return toLegacyCheckpoint(raceCheckpoint);
        }
        console.error(`[CHECKPOINT] Error creating checkpoint:`, error);
        return null;
      }
      return toLegacyCheckpoint(checkpoint);
    } catch (error) {
      console.error(`[CHECKPOINT] Error in getOrCreateCheckpoint:`, error);
      return null;
    }
  }

  /**
   * Update checkpoint with progress
   */
  async updateCheckpoint(checkpointId, updates) {
    try {
      const mappedUpdates = {
        last_processed_at: new Date().toISOString(),
      };

      if (updates?.total_inserted != null) {
        mappedUpdates.inserted_items = updates.total_inserted;
        mappedUpdates.processed_items = updates.total_inserted;
      }

      if (updates?.last_submission_date) {
        mappedUpdates.last_processed_id = updates.last_submission_date;
      }

      const { error } = await supabaseAdmin
        .from(V2_TABLES.SYNC_JOBS)
        .update(mappedUpdates)
        .eq('id', checkpointId);

      if (error) {
        console.error(`[CHECKPOINT] Error updating checkpoint:`, error);
      }
    } catch (error) {
      console.error(`[CHECKPOINT] Exception updating checkpoint:`, error);
    }
  }

  /**
   * Mark checkpoint as completed
   */
  async completeCheckpoint(checkpointId, totalInserted) {
    try {
      const { error } = await supabaseAdmin
        .from(V2_TABLES.SYNC_JOBS)
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          last_processed_at: new Date().toISOString(),
          inserted_items: totalInserted,
          processed_items: totalInserted,
        })
        .eq('id', checkpointId);

      if (error) {
        console.error(`[CHECKPOINT] Error completing checkpoint:`, error);
      }
    } catch (error) {
      console.error(`[CHECKPOINT] Exception completing checkpoint:`, error);
    }
  }

  /**
   * Mark checkpoint as failed
   */
  async failCheckpoint(checkpointId, errorMessage, errorDetails = null) {
    try {
      const { error } = await supabaseAdmin
        .from(V2_TABLES.SYNC_JOBS)
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          last_processed_at: new Date().toISOString(),
          error_message: errorMessage,
          // Keep short, stable identifier in merged schema field.
          last_processed_id: errorDetails?.name || null,
        })
        .eq('id', checkpointId);

      if (error) {
        console.error(`[CHECKPOINT] Error failing checkpoint:`, error);
      }
    } catch (error) {
      console.error(`[CHECKPOINT] Exception failing checkpoint:`, error);
    }
  }

  /**
   * Clean up old completed/failed checkpoints (keep last 10 per platform)
   */
  async cleanupOldCheckpoints(userId, platform) {
    try {
      const platformId = await getPlatformId(platform);
      if (!platformId) return;

      const { data: checkpoints } = await supabaseAdmin
        .from(V2_TABLES.SYNC_JOBS)
        .select('id')
        .eq('user_id', userId)
        .eq('platform_id', platformId)
        .eq('job_type', 'submissions')
        .in('status', ['completed', 'failed'])
        .order('created_at', { ascending: false });

      if (checkpoints && checkpoints.length > 10) {
        const toDelete = checkpoints.slice(10).map((c) => c.id);
        await supabaseAdmin
          .from(V2_TABLES.SYNC_JOBS)
          .delete()
          .in('id', toDelete);
      }
    } catch (error) {
      console.error(`[CHECKPOINT] Error cleaning up checkpoints:`, error);
    }
  }

  /**
   * SPOJ fallback via VJudge's public solved-problems API.
   * Used when native SPOJ sync is blocked by Cloudflare.
   */
  async getSpojSubmissionsFromVJudge(
    userId,
    fromTimestamp = null,
    useV2 = null
  ) {
    try {
      const resolvedUseV2 =
        typeof useV2 === 'boolean' ? useV2 : await isV2SchemaAvailable();

      let vjHandle = null;

      if (resolvedUseV2) {
        const vjPlatformId = await getPlatformId('vjudge');
        if (vjPlatformId) {
          const { data } = await supabaseAdmin
            .from(V2_TABLES.USER_HANDLES)
            .select('handle')
            .eq('user_id', userId)
            .eq('platform_id', vjPlatformId)
            .maybeSingle();
          vjHandle = data?.handle || null;
        }
      } else {
        const { data } = await supabaseAdmin
          .from('user_handles')
          .select('handle')
          .eq('user_id', userId)
          .eq('platform', 'vjudge')
          .maybeSingle();
        vjHandle = data?.handle || null;
      }

      if (!vjHandle) {
        return [];
      }

      const response = await fetch(
        `https://vjudge.net/user/solveDetail/${encodeURIComponent(vjHandle)}`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const payload = await response.json();
      const spojSolves = Array.isArray(payload?.acRecords?.SPOJ)
        ? payload.acRecords.SPOJ
        : [];

      if (spojSolves.length === 0) {
        return [];
      }

      // VJudge solve details don't include actual submission timestamps.
      const syntheticSubmittedAt =
        normalizeSubmissionTimestamp(fromTimestamp) || new Date().toISOString();

      return spojSolves
        .map((code) => String(code || '').trim())
        .filter(Boolean)
        .map((problemCode) => ({
          submission_id: `vj_spoj_${problemCode}`,
          problem_id: problemCode,
          problem_name: problemCode,
          problem_url: `https://www.spoj.com/problems/${problemCode}/`,
          verdict: 'AC',
          language: 'Unknown',
          submitted_at: syntheticSubmittedAt,
        }));
    } catch (error) {
      console.warn(`[SPOJ] VJudge fallback failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Universal fallback to fetch submissions/solved problems using Clist API's contest statistics.
   * This handles platforms that don't have a dedicated scraper/API client.
   */
  async getSubmissionsFromClist(platform, handle, fromTimestamp = null) {
    const clistService = new ClistService();
    if (!clistService.isConfigured()) {
      console.warn(`[Clist Fallback] Clist API not configured.`);
      return [];
    }
    // Fetch all contests for this user on this platform
    const contests = await clistService.getContestStatistics(
      platform,
      handle,
      10000
    );
    if (!contests || contests.length === 0) return [];

    let submissions = [];

    for (const contest of contests) {
      if (!contest.problems || !Array.isArray(contest.problems)) continue;

      const contestTime = contest.date
        ? new Date(contest.date).getTime()
        : new Date().getTime();
      const fromTime = fromTimestamp ? new Date(fromTimestamp).getTime() : 0;

      // If the contest happened before our fromTimestamp, we can skip it
      if (fromTimestamp && contestTime <= fromTime) {
        continue;
      }

      for (const prob of contest.problems) {
        const resultStr = prob.result != null ? String(prob.result) : '';
        const numResult = parseFloat(resultStr);
        const isSolved =
          prob.solved ||
          resultStr.includes('+') ||
          resultStr === 'AC' ||
          (!isNaN(numResult) && numResult > 0);
        if (isSolved) {
          submissions.push({
            submission_id: `clist_${contest.contestId}_${prob.label}`,
            problem_id:
              prob.name || prob.label || `${contest.contestId}_${prob.label}`,
            problem_name:
              prob.name ||
              `${contest.contestName || 'Contest'} - ${prob.label}`,
            problem_url: prob.url || null,
            contest_id: contest.contestId?.toString(),
            verdict: 'AC',
            language: 'Unknown',
            // Use contest date as an approximation of submission date
            submitted_at: contest.date || new Date().toISOString(),
          });
        }
      }
    }

    return submissions;
  }

  async syncUserSubmissions(userId, forceFullSync = false, manualHtml = null) {
    // Add timeout protection for the entire sync operation
    const SYNC_TIMEOUT_MS = 600000; // 10 minutes timeout
    const syncPromise = this._syncUserSubmissionsInternal(
      userId,
      forceFullSync,
      manualHtml
    );

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error('Sync operation timed out after 10 minutes')),
        SYNC_TIMEOUT_MS
      );
    });

    try {
      return await Promise.race([syncPromise, timeoutPromise]);
    } catch (error) {
      console.error(`Sync timeout or error for user ${userId}:`, error);
      return {
        synced: 0,
        platforms: [],
        error: error.message,
      };
    }
  }

  async _syncUserSubmissionsInternal(
    userId,
    forceFullSync = false,
    manualHtml = null
  ) {
    // Fetch user handles from new schema
    const { data: v2Handles, error: handlesError } = await supabaseAdmin
      .from(V2_TABLES.USER_HANDLES)
      .select('*, platforms(code)')
      .eq('user_id', userId);

    if (handlesError) {
      console.error(
        `[SYNC] Error fetching handles for user ${userId}:`,
        handlesError
      );
      return { synced: 0, platforms: [], error: handlesError.message };
    }

    // Transform handles to include platform code for compatibility
    const handles =
      v2Handles?.map((h) => ({
        ...h,
        platform: h.platforms?.code || '',
      })) || [];

    if (!handles || handles.length === 0) {
      return { synced: 0, platforms: [] };
    }
    const results = [];

    for (const handle of handles) {
      // Check if sync is already in progress for this platform
      if (this.isSyncInProgress(userId, handle.platform)) {
        console.warn(
          `[SYNC] ${handle.platform}: Sync already in progress, skipping`
        );
        results.push({
          platform: handle.platform,
          handle: handle.handle,
          skipped: true,
          error: 'Sync already in progress for this platform',
        });
        continue;
      }

      // Acquire sync lock
      if (!this.acquireSyncLock(userId, handle.platform)) {
        console.warn(
          `[SYNC] ${handle.platform}: Failed to acquire sync lock, skipping`
        );
        results.push({
          platform: handle.platform,
          handle: handle.handle,
          skipped: true,
          error: 'Failed to acquire sync lock',
        });
        continue;
      }

      // Create or get checkpoint for this sync
      let checkpoint = null;
      try {
        checkpoint = await this.getOrCreateCheckpoint(
          userId,
          handle.platform,
          forceFullSync
        );
      } catch (checkpointError) {
        console.error(
          `[SYNC] ${handle.platform}: Error creating checkpoint:`,
          checkpointError
        );
      }

      try {
        // Add per-platform timeout (5 minutes per platform)
        const PLATFORM_TIMEOUT_MS = 300000; // 5 minutes

        const platformSyncPromise = (async () => {
          // If forceFullSync is true, fetch all submissions (don't use fromTimestamp)
          // Otherwise, check checkpoint for resume point or get last submission
          let fromTimestamp = null;
          if (!forceFullSync) {
            // Try to resume from checkpoint if it exists
            if (checkpoint?.last_submission_date) {
              fromTimestamp = checkpoint.last_submission_date;
            } else {
              const lastSubmission = await this.getLastSubmission(
                userId,
                handle.platform
              );
              fromTimestamp = lastSubmission?.submitted_at;
            }
          } else {
          }

          let submissions = [];
          let extensionRequired = false;
          switch (handle.platform) {
            case 'codeforces':
              submissions = await this.codeforces.getSubmissions(
                handle.handle,
                fromTimestamp
              );
              break;
            case 'atcoder':
              submissions = await this.atcoder.getSubmissions(
                handle.handle,
                fromTimestamp
              );
              break;
            case 'leetcode':
              // LeetCode submission ingestion is extension-only.
              // API extraction is intentionally disabled to avoid mismatches.
              submissions = [];
              break;
            case 'toph':
              submissions = await this.toph.getSubmissions(
                handle.handle,
                fromTimestamp
              );
              break;
            case 'cses':
              submissions = await this.cses.getSubmissions(
                handle.handle,
                fromTimestamp
              );
              break;
            case 'codechef':
              submissions = await this.codechef.getSubmissions(
                handle.handle,
                fromTimestamp
              );
              break;
            case 'topcoder':
              submissions = await this.topcoder.getSubmissions(
                handle.handle,
                fromTimestamp
              );
              break;
            case 'hackerrank':
              submissions = await this.hackerrank.getSubmissions(
                handle.handle,
                fromTimestamp
              );
              break;
            case 'kattis':
              submissions = await this.kattis.getSubmissions(
                handle.handle,
                fromTimestamp
              );
              break;
            case 'lightoj':
              submissions = await this.lightoj.getSubmissions(
                handle.handle,
                fromTimestamp
              );
              break;
            case 'uva':
              submissions = await this.uva.getSubmissions(
                handle.handle,
                fromTimestamp
              );
              break;
            case 'spoj':
              if (manualHtml) {
                submissions = this.spoj.parseSolvedProblems(manualHtml);
                if (!submissions || submissions.length === 0) {
                  return {
                    platform: handle.platform,
                    synced: 0,
                    handle: handle.handle,
                    success: false,
                    error:
                      'Could not parse any solved problems from the pasted content. Make sure you copied from your SPOJ profile page.',
                  };
                }
              } else {
                try {
                  submissions = await this.spoj.getSubmissions(
                    handle.handle,
                    fromTimestamp
                  );
                } catch (spojError) {
                  console.warn(
                    `[SPOJ] Native sync unavailable: ${spojError.message}`
                  );
                  submissions = [];
                }
                if (!submissions || submissions.length === 0) {
                  extensionRequired = true;
                  submissions = [];
                  console.warn(
                    '[SPOJ] No reliable server-side submissions due to Cloudflare. Use browser extension import.'
                  );
                }
              }
              break;
            case 'facebookhackercup':
              // Try CLIST contest statistics first; fall back to extension guidance if empty.
              try {
                submissions = await this.getSubmissionsFromClist(
                  handle.platform,
                  handle.handle,
                  fromTimestamp
                );
              } catch (fbhcError) {
                console.warn(`[FBHC] CLIST sync failed: ${fbhcError.message}`);
                submissions = [];
              }

              if (!submissions || submissions.length === 0) {
                extensionRequired = true;
                submissions = [];
                console.warn(
                  '[FBHC] No submissions from CLIST. Use browser extension import.'
                );
              }
              break;
            case 'vjudge':
              submissions = await this.vjudge.getSubmissions(
                handle.handle,
                fromTimestamp
              );
              break;
            case 'cfgym':
              submissions = await this.cfgym.getSubmissions(
                handle.handle,
                fromTimestamp
              );
              break;
            case 'csacademy':
              submissions = await this.csacademy.getSubmissions(
                handle.handle,
                fromTimestamp
              );
              break;
            case 'eolymp':
              submissions = await this.eolymp.getSubmissions(
                handle.handle,
                fromTimestamp
              );
              break;
            case 'usaco':
              submissions = await this.usaco.getSubmissions(
                handle.handle,
                fromTimestamp
              );
              break;
            default:
              submissions = await this.getSubmissionsFromClist(
                handle.platform,
                handle.handle,
                fromTimestamp
              );
              break;
          }
          if (!submissions || !Array.isArray(submissions)) {
            console.warn(
              `[SYNC] ${handle.platform}: Invalid submissions response:`,
              typeof submissions
            );
            submissions = [];
          }

          const insertResult = await this.insertSubmissions(
            userId,
            handle.platform,
            submissions
          );
          if (!insertResult.success) {
            console.error(
              `[SYNC] ${handle.platform}: Insert had errors:`,
              insertResult.errors
            );
          }

          // Update checkpoint with progress
          if (checkpoint) {
            const lastProcessedTimestamp =
              submissions.length > 0
                ? submissions[submissions.length - 1]?.submitted_at
                : null;

            await this.updateCheckpoint(checkpoint.id, {
              total_inserted: insertResult.inserted,
              last_submission_date: lastProcessedTimestamp,
              error_details: {
                total_fetched: submissions.length,
                success: insertResult.success,
                extension_required: extensionRequired,
                errors: insertResult.errors,
                batches: insertResult.batches,
              },
            });
          }

          // Only update solves if we successfully inserted some data
          if (insertResult.inserted > 0) {
            await this.updateSolves(userId, handle.platform);
            await this.updateDailyActivity(userId);

            // Backfill tags for any existing solves that might be missing tags
            await this.backfillTagsForUser(userId);
          }

          // Mark checkpoint as completed
          if (checkpoint) {
            await this.completeCheckpoint(checkpoint.id, insertResult.inserted);
            await this.cleanupOldCheckpoints(userId, handle.platform);
          }
          return {
            platform: handle.platform,
            synced: insertResult.inserted,
            total: insertResult.total,
            handle: handle.handle,
            success: insertResult.success,
            extensionRequired,
            errors: insertResult.errors,
            batches: insertResult.batches,
          };
        })();

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () =>
              reject(
                new Error(
                  `Platform ${handle.platform} sync timed out after 5 minutes`
                )
              ),
            PLATFORM_TIMEOUT_MS
          );
        });

        const result = await Promise.race([
          platformSyncPromise,
          timeoutPromise,
        ]);
        results.push(result);

        // Release sync lock on success
        this.releaseSyncLock(userId, handle.platform);
      } catch (error) {
        console.error(
          `[SYNC] Error syncing ${handle.platform} for user ${userId}:`,
          error.message
        );

        // Mark checkpoint as failed
        if (checkpoint) {
          await this.failCheckpoint(checkpoint.id, error.message, {
            stack: error.stack,
            name: error.name,
          });
        }

        results.push({
          platform: handle.platform,
          error: error.message,
          handle: handle.handle,
        });

        // Release sync lock on error
        this.releaseSyncLock(userId, handle.platform);
      } finally {
        // Ensure lock is always released
        if (this.isSyncInProgress(userId, handle.platform)) {
          console.warn(
            `[SYNC] ${handle.platform}: Cleaning up stuck lock in finally block`
          );
          this.releaseSyncLock(userId, handle.platform);
        }
      }
    }

    // Update user statistics
    await this.updateUserStatistics(userId, true);

    const totalSynced = results.reduce((acc, r) => acc + (r.synced || 0), 0);
    return {
      synced: totalSynced,
      platforms: results,
    };
  }

  /**
   * Sync submissions for a specific platform only
   * @param {string} userId - User ID
   * @param {string} platform - Platform ID to sync
   * @param {boolean} forceFullSync - If true, fetch ALL submissions
   */
  async syncPlatformSubmissions(
    userId,
    platform,
    forceFullSync = false,
    manualHtml = null
  ) {
    const useV2 = await isV2SchemaAvailable();

    // Get the handle for this platform
    const platformId = await getPlatformId(platform);
    const { data } = await supabaseAdmin
      .from(V2_TABLES.USER_HANDLES)
      .select('*, platforms(code)')
      .eq('user_id', userId)
      .eq('platform_id', platformId)
      .single();

    const handle = data
      ? { ...data, platform: data.platforms?.code || platform }
      : null;

    if (!handle) {
      return { synced: 0, error: `No handle connected for ${platform}` };
    }

    try {
      // Get last submission timestamp if not full sync
      let fromTimestamp = null;
      if (!forceFullSync) {
        const lastSubmission = await this.getLastSubmission(userId, platform);
        fromTimestamp = lastSubmission?.submitted_at;
      }

      let submissions = [];
      let extensionRequired = false;

      // Fetch submissions based on platform
      switch (platform) {
        case 'codeforces':
          submissions = await this.codeforces.getSubmissions(
            handle.handle,
            fromTimestamp
          );
          break;
        case 'atcoder':
          submissions = await this.atcoder.getSubmissions(
            handle.handle,
            fromTimestamp
          );
          break;
        case 'leetcode':
          // LeetCode submission ingestion is extension-only.
          // API extraction is intentionally disabled to avoid mismatches.
          submissions = [];
          break;
        case 'toph':
          submissions = await this.toph.getSubmissions(
            handle.handle,
            fromTimestamp
          );
          break;
        case 'cses':
          submissions = await this.cses.getSubmissions(
            handle.handle,
            fromTimestamp
          );
          break;
        case 'codechef':
          submissions = await this.codechef.getSubmissions(
            handle.handle,
            fromTimestamp
          );
          if (!submissions || submissions.length === 0) {
            try {
              const clistService = new ClistService();
              if (clistService.isConfigured()) {
                const account = await clistService.findAccount(
                  'codechef',
                  handle.handle
                );
                if (account) {
                  const data = await clistService.fetchApi('statistics', {
                    account_id: account.id,
                    with_problems: true,
                    limit: 100000,
                  });
                  if (data && data.objects) {
                    submissions = [];
                    let ccClistCount = 0;
                    for (const stat of data.objects) {
                      if (stat.problems && typeof stat.problems === 'object') {
                        for (const [probCode, probData] of Object.entries(
                          stat.problems
                        )) {
                          const solveContext = probData.upsolving || probData;
                          const isSolved =
                            solveContext && (
                              solveContext.result === 100 ||
                              solveContext.verdict === 'AC' ||
                              solveContext.verdict === 'OK' ||
                              (solveContext.result != null && (
                                String(solveContext.result).includes('+') ||
                                (!isNaN(parseFloat(solveContext.result)) && parseFloat(solveContext.result) > 0)
                              ))
                            );
                          if (solveContext && isSolved) {
                            const subTime = solveContext.submission_time
                              ? new Date(
                                  solveContext.submission_time * 1000
                                ).toISOString()
                              : stat.date || new Date().toISOString();

                            // Filter logic (if fromTimestamp is provided)
                            if (
                              fromTimestamp &&
                              new Date(subTime) < new Date(fromTimestamp)
                            ) {
                              continue;
                            }

                            submissions.push({
                              submission_id: `clist_cc_${stat.contest_id}_${probCode}`,
                              problem_id: probCode,
                              problem_name: probCode,
                              problem_url: `https://www.codechef.com/problems/${probCode}`,
                              contest_id: `clist_${stat.contest_id}`,
                              verdict: 'AC',
                              language: solveContext.language || 'Unknown',
                              submitted_at: subTime,
                            });
                            ccClistCount++;
                          }
                        }
                      }
                    }
                  }
                }
              }
            } catch (fallbackError) {
              console.warn(
                `[CodeChef] CLIST fallback failed: ${fallbackError.message}`
              );
            }
          }
          break;
        case 'topcoder':
          submissions = await this.topcoder.getSubmissions(
            handle.handle,
            fromTimestamp
          );
          break;
        case 'hackerrank':
          submissions = await this.hackerrank.getSubmissions(
            handle.handle,
            fromTimestamp
          );
          break;
        case 'kattis':
          submissions = await this.kattis.getSubmissions(
            handle.handle,
            fromTimestamp
          );
          break;
        case 'lightoj':
          submissions = await this.lightoj.getSubmissions(
            handle.handle,
            fromTimestamp
          );
          break;
        case 'uva':
          submissions = await this.uva.getSubmissions(
            handle.handle,
            fromTimestamp
          );
          break;
        case 'spoj':
          if (manualHtml) {
            submissions = this.spoj.parseSolvedProblems(manualHtml);
            if (!submissions || submissions.length === 0) {
              return {
                platform: handle.platform,
                synced: 0,
                handle: handle.handle,
                success: false,
                error:
                  'Could not parse any solved problems from the pasted content. Make sure you copied from your SPOJ profile page.',
              };
            }
          } else {
            try {
              submissions = await this.spoj.getSubmissions(
                handle.handle,
                fromTimestamp
              );
            } catch (spojError) {
              console.warn(
                `[SPOJ] Native sync unavailable: ${spojError.message}`
              );
              submissions = [];
            }
            if (!submissions || submissions.length === 0) {
              extensionRequired = true;
              submissions = [];
              console.warn(
                '[SPOJ] No reliable server-side submissions due to Cloudflare. Use browser extension import.'
              );
            }
          }
          break;
        case 'facebookhackercup':
          // Try CLIST contest statistics first; fall back to extension guidance if empty.
          try {
            submissions = await this.getSubmissionsFromClist(
              platform,
              handle.handle,
              fromTimestamp
            );
          } catch (fbhcError) {
            console.warn(`[FBHC] CLIST sync failed: ${fbhcError.message}`);
            submissions = [];
          }

          if (!submissions || submissions.length === 0) {
            extensionRequired = true;
            submissions = [];
            console.warn(
              '[FBHC] No submissions from CLIST. Use browser extension import.'
            );
          }
          break;
        case 'vjudge':
          submissions = await this.vjudge.getSubmissions(
            handle.handle,
            fromTimestamp
          );
          break;
        case 'cfgym':
          submissions = await this.cfgym.getSubmissions(
            handle.handle,
            fromTimestamp
          );
          break;
        case 'csacademy':
          submissions = await this.csacademy.getSubmissions(
            handle.handle,
            fromTimestamp
          );
          break;
        case 'eolymp':
          submissions = await this.eolymp.getSubmissions(
            handle.handle,
            fromTimestamp
          );
          break;
        case 'usaco':
          submissions = await this.usaco.getSubmissions(
            handle.handle,
            fromTimestamp
          );
          break;
        default:
          submissions = await this.getSubmissionsFromClist(
            platform,
            handle.handle,
            fromTimestamp
          );
          if (!submissions || submissions.length === 0) {
            console.warn(
              `[SYNC] Unknown platform or no submissions from Clist: ${platform}`
            );
          }
          break;
      }

      const insertResult = await this.insertSubmissions(
        userId,
        platform,
        submissions
      );

      if (!insertResult.success) {
        console.warn(
          `[SYNC] ${platform}: insert completed with errors`,
          insertResult.errors
        );
      }

      const insertedCount = insertResult.inserted || 0;

      await this.updateSolves(userId, platform);
      await this.updateDailyActivity(userId);
      await this.updateUserStatistics(userId);

      // Backfill tags for any existing solves that might be missing tags
      await this.backfillTagsForUser(userId);

      return {
        synced: insertedCount,
        total: insertResult.total || submissions.length,
        success: insertResult.success,
        extensionRequired,
        errors: insertResult.errors,
        platform,
        handle: handle.handle,
      };
    } catch (error) {
      console.error(`Error syncing ${platform} for user ${userId}:`, error);
      return {
        synced: 0,
        platform,
        error: error.message,
      };
    }
  }

  async getLastSubmission(userId, platform) {
    const platformId = await getPlatformId(platform);

    if (!platformId) return null;

    const { data } = await supabaseAdmin
      .from(V2_TABLES.SUBMISSIONS)
      .select('submitted_at')
      .eq('user_id', userId)
      .eq('platform_id', platformId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();
    return data;
  }

  async insertSubmissions(userId, platform, submissions) {
    // Defensive check: ensure submissions is an array
    if (!submissions) return { success: true, inserted: 0, errors: [] };
    if (!Array.isArray(submissions)) {
      console.warn(
        `insertSubmissions received non-array for ${platform}:`,
        typeof submissions
      );
      // Try to extract submissions array if it's an object with submissions property
      if (submissions.submissions && Array.isArray(submissions.submissions)) {
        submissions = submissions.submissions;
      } else {
        return { success: true, inserted: 0, errors: [] };
      }
    }
    if (submissions.length === 0)
      return { success: true, inserted: 0, errors: [] };

    const errors = [];
    let totalInserted = 0;

    // Check for V2 schema
    const useV2 = await isV2SchemaAvailable();

    try {
      // ── CLEANUP: Delete stale synthetic/inferred placeholder rows ──────────────
      // Old syncs may have persisted `lc_synthetic_*` (Unknown LeetCode Problem) or
      // `lc_inferred_*` problem rows. If the new Source 4 provides real guesses,
      // we need to remove these old entries first so they don't persist on the UI.
      if (platform === 'leetcode') {
        const submissionsTable = useV2
          ? V2_TABLES.SUBMISSIONS
          : 'problem_submissions';

        let cleanupQuery;
        if (useV2) {
          const { getPlatformId } =
            await import('@/app/_lib/services/problem-solving-v2-helpers');
          const platformId = await getPlatformId('leetcode');
          // V2 schema uses external_submission_id and external_problem_id
          cleanupQuery = supabaseAdmin
            .from(submissionsTable)
            .delete()
            .eq('user_id', userId)
            .eq('platform_id', platformId)
            .or(
              'external_submission_id.like.lc_synthetic_%,external_submission_id.like.lc_inferred_%,external_problem_id.like.lc-unknown-%'
            );
        } else {
          cleanupQuery = supabaseAdmin
            .from(submissionsTable)
            .delete()
            .eq('user_id', userId)
            .eq('platform', 'leetcode')
            .or(
              'submission_id.like.lc_synthetic_%,submission_id.like.lc_inferred_%,problem_id.like.lc-unknown-%'
            );
        }

        const { error: cleanupError } = await cleanupQuery;

        if (cleanupError) {
          console.warn(
            '[LC] Cleanup of old synthetic rows failed (non-fatal):',
            cleanupError.message
          );
          errors.push({ type: 'cleanup', message: cleanupError.message });
        }
      }
      // ──────────────────────────────────────────────────────────────────────────

      // Filter out invalid submissions (bad data protection)
      const validSubmissions = submissions
        .map((sub) => {
          const submissionId = sub.submission_id
            ? String(sub.submission_id).trim()
            : '';

          if (!submissionId) return null;

          const problemIdRaw = sub.problem_id
            ? String(sub.problem_id).trim()
            : '';
          if (!problemIdRaw) return null;

          const submittedAt = normalizeSubmissionTimestamp(sub.submitted_at);
          if (!submittedAt) return null;

          if (platform === 'leetcode') {
            if (isHeuristicLeetCodeSubmissionId(submissionId)) {
              return null;
            }

            const normalizedProblemSlug =
              normalizeLeetCodeProblemSlug(problemIdRaw);
            if (!normalizedProblemSlug) {
              return null;
            }

            return {
              ...sub,
              submission_id: submissionId,
              problem_id: normalizedProblemSlug,
              submitted_at: submittedAt,
            };
          }

          return {
            ...sub,
            submission_id: submissionId,
            problem_id: problemIdRaw,
            submitted_at: submittedAt,
          };
        })
        .filter(Boolean)
        .filter((sub) => {
          // Reject submissions with acRecords/failRecords patterns (bad data from old buggy code)
          if (
            sub.submission_id.includes('acRecords') ||
            sub.submission_id.includes('failRecords') ||
            sub.problem_id?.includes('acRecords') ||
            sub.problem_id?.includes('failRecords')
          ) {
            console.warn(
              `Skipping invalid submission with bad pattern: ${sub.submission_id}`
            );
            return false;
          }

          return true;
        });

      if (validSubmissions.length === 0) {
        return { success: true, inserted: 0, errors };
      }

      // Get platform_id for V2
      let platformId = null;
      if (useV2) {
        const { getPlatformId } =
          await import('@/app/_lib/services/problem-solving-v2-helpers');
        platformId = await getPlatformId(platform);
        if (!platformId) {
          console.error(
            `[${platform}] Could not find platform_id for V2 insert`
          );
          return {
            success: false,
            inserted: 0,
            errors: [
              {
                type: 'platform_not_found',
                message: `Platform ${platform} not found in cp_platforms`,
              },
            ],
          };
        }
      }

      // Normalize submission data to match database schema
      // For V2 schema, we need to lookup language_id from language string
      const { getLanguageId, ensureLanguageCacheLoaded } =
        await import('@/app/_lib/services/problem-solving-v2-helpers');

      // Pre-load language cache once before processing all submissions
      // This prevents many concurrent fetch requests
      if (useV2) {
        await ensureLanguageCacheLoaded();
      }

      const toInsert = await Promise.all(
        validSubmissions.map(async (sub) => {
          const normalizedVerdict = normalizeSubmissionVerdict(
            sub.verdict || 'PENDING'
          );

          if (useV2) {
            // V2 schema: submissions table has specific columns
            // id, user_id, problem_id (uuid FK), platform_id, external_submission_id,
            // external_problem_id, problem_name, verdict, language_id, execution_time_ms,
            // memory_kb, submitted_at, created_at
            const languageId = await getLanguageId(sub.language);

            return {
              user_id: userId,
              platform_id: platformId,
              external_submission_id: sub.submission_id,
              external_problem_id: sub.problem_id,
              problem_name: sub.problem_name || null,
              verdict: normalizedVerdict,
              language_id: languageId,
              execution_time_ms:
                sub.runtime_ms || sub.execution_time_ms || null,
              memory_kb: sub.memory_kb || null,
              submitted_at: sub.submitted_at,
            };
          } else {
            // Legacy schema
            return {
              user_id: userId,
              platform,
              submission_id: sub.submission_id,
              problem_id: sub.problem_id,
              problem_name: sub.problem_name || null,
              problem_url: sub.problem_url || sub.original_url || null,
              contest_id: sub.contest_id || null,
              verdict: normalizedVerdict,
              language: sub.language || null,
              execution_time_ms:
                sub.runtime_ms || sub.execution_time_ms || null,
              memory_kb: sub.memory_kb || null,
              difficulty_rating:
                sub.difficulty || sub.difficulty_rating || null,
              tags: sub.tags && sub.tags.length > 0 ? sub.tags : null,
              submitted_at: sub.submitted_at,
            };
          }
        })
      );

      // Batch upserts to avoid statement timeout (100 records per batch)
      const BATCH_SIZE = 100;
      const batches = [];

      for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
        batches.push(toInsert.slice(i, i + BATCH_SIZE));
      }
      // Track successful batches for potential rollback
      const successfulBatches = [];
      const submissionsTable = useV2
        ? V2_TABLES.SUBMISSIONS
        : 'problem_submissions';
      const conflictColumn = useV2
        ? 'user_id,platform_id,external_submission_id'
        : 'user_id,platform,submission_id';

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        try {
          const { data, error } = await supabaseAdmin
            .from(submissionsTable)
            .upsert(batch, {
              onConflict: conflictColumn,
              ignoreDuplicates: false, // Update existing records with new data
            })
            .select();

          if (error) {
            // Schema fallback: some local databases may not yet have the expected
            // composite unique constraint for ON CONFLICT.
            if (error.code === '42P10') {
              console.warn(
                `[${platform}] Missing ON CONFLICT constraint (${conflictColumn}); falling back to manual dedupe + insert for batch ${i + 1}/${batches.length}`
              );

              try {
                let rowsToInsert = batch;

                if (useV2) {
                  const candidateIds = [
                    ...new Set(
                      batch
                        .map((row) => row.external_submission_id)
                        .filter(Boolean)
                    ),
                  ];

                  if (candidateIds.length > 0) {
                    const { data: existingRows, error: existingError } =
                      await supabaseAdmin
                        .from(submissionsTable)
                        .select('external_submission_id')
                        .eq('user_id', userId)
                        .eq('platform_id', platformId)
                        .in('external_submission_id', candidateIds);

                    if (existingError) {
                      throw existingError;
                    }

                    const existingSet = new Set(
                      (existingRows || [])
                        .map((row) => row.external_submission_id)
                        .filter(Boolean)
                    );

                    rowsToInsert = batch.filter(
                      (row) => !existingSet.has(row.external_submission_id)
                    );
                  }
                } else {
                  const candidateIds = [
                    ...new Set(
                      batch.map((row) => row.submission_id).filter(Boolean)
                    ),
                  ];

                  if (candidateIds.length > 0) {
                    const { data: existingRows, error: existingError } =
                      await supabaseAdmin
                        .from(submissionsTable)
                        .select('submission_id')
                        .eq('user_id', userId)
                        .eq('platform', platform)
                        .in('submission_id', candidateIds);

                    if (existingError) {
                      throw existingError;
                    }

                    const existingSet = new Set(
                      (existingRows || [])
                        .map((row) => row.submission_id)
                        .filter(Boolean)
                    );

                    rowsToInsert = batch.filter(
                      (row) => !existingSet.has(row.submission_id)
                    );
                  }
                }

                if (rowsToInsert.length === 0) {
                  successfulBatches.push(i);
                  continue;
                }

                const { data: insertedRows, error: insertError } =
                  await supabaseAdmin
                    .from(submissionsTable)
                    .insert(rowsToInsert)
                    .select();

                if (insertError) {
                  throw insertError;
                }

                const insertedCount =
                  insertedRows?.length || rowsToInsert.length;
                totalInserted += insertedCount;
                successfulBatches.push(i);
                continue;
              } catch (fallbackError) {
                console.error(
                  `[${platform}] Fallback insert failed for batch ${i + 1}/${batches.length}: ${fallbackError.message}`
                );
                errors.push({
                  type: 'batch_insert_fallback',
                  batch: i + 1,
                  message: fallbackError.message,
                });
                continue;
              }
            }

            const errorMsg = `Batch ${i + 1}/${batches.length} failed: ${error.message}`;
            console.error(`[${platform}] ${errorMsg}`);
            errors.push({
              type: 'batch_insert',
              batch: i + 1,
              message: error.message,
              code: error.code,
              details: error.details,
            });

            // If this is a critical error (not a constraint violation), attempt rollback
            if (error.code !== '23505' && successfulBatches.length > 0) {
              console.warn(
                `[${platform}] Critical error detected, considering rollback...`
              );
              // Note: Supabase doesn't support transactions across multiple calls,
              // so we log this for manual intervention if needed
              errors.push({
                type: 'rollback_needed',
                message: `Failed at batch ${i + 1}/${batches.length}, ${successfulBatches.length} batches were successful`,
                successfulBatches: successfulBatches.length,
              });
            }

            // Continue with remaining batches (partial success is better than total failure)
            continue;
          }

          const insertedCount = data?.length || 0;
          totalInserted += insertedCount;
          successfulBatches.push(i);
        } catch (batchError) {
          const errorMsg = `Batch ${i + 1}/${batches.length} exception: ${batchError.message}`;
          console.error(`[${platform}] ${errorMsg}`);
          errors.push({
            type: 'batch_exception',
            batch: i + 1,
            message: batchError.message,
          });
        }
      }

      const success =
        errors.length === 0 ||
        (totalInserted > 0 &&
          !errors.some((e) => e.type === 'rollback_needed'));
      return {
        success,
        inserted: totalInserted,
        total: toInsert.length,
        errors,
        batches: {
          total: batches.length,
          successful: successfulBatches.length,
          failed: batches.length - successfulBatches.length,
        },
      };
    } catch (error) {
      console.error(
        `[${platform}] Critical error in insertSubmissions:`,
        error
      );
      return {
        success: false,
        inserted: totalInserted,
        errors: [
          {
            type: 'critical',
            message: error.message,
            stack: error.stack,
          },
        ],
      };
    }
  }

  async updateSolves(userId, platform) {
    // Check for V2 schema
    const useV2 = await isV2SchemaAvailable();

    let submissions = [];
    let platformId = null;

    if (useV2) {
      // V2: Get platform_id and query from submissions_v2
      const { getPlatformId } =
        await import('@/app/_lib/services/problem-solving-v2-helpers');
      platformId = await getPlatformId(platform);

      if (!platformId) {
        console.error(
          `[${platform}] Could not find platform_id for V2 updateSolves`
        );
        return;
      }

      const { data } = await supabaseAdmin
        .from(V2_TABLES.SUBMISSIONS)
        .select('*')
        .eq('user_id', userId)
        .eq('platform_id', platformId)
        .order('submitted_at', { ascending: true });

      submissions = (data || []).filter(
        (sub) => normalizeSubmissionVerdict(sub.verdict) === 'AC'
      );
    } else {
      // Legacy: Query from problem_submissions
      const { data } = await supabaseAdmin
        .from('problem_submissions')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', platform)
        .order('submitted_at', { ascending: true });

      submissions = (data || []).filter(
        (sub) => normalizeSubmissionVerdict(sub.verdict) === 'AC'
      );
    }

    // Build solves map - use external_problem_id for V2, problem_id for legacy
    const solvesByProblem = {};
    for (const sub of submissions) {
      // V2 schema uses external_problem_id, legacy uses problem_id
      const rawProblemKey = useV2 ? sub.external_problem_id : sub.problem_id;
      const problemKey = rawProblemKey ? String(rawProblemKey).trim() : '';
      const submittedAt =
        sub.submitted_at && Number.isFinite(Date.parse(sub.submitted_at))
          ? sub.submitted_at
          : null;

      if (!problemKey) {
        continue;
      }

      // Skip bad data with acRecords/failRecords patterns
      if (
        problemKey?.includes('acRecords') ||
        problemKey?.includes('failRecords')
      ) {
        continue;
      }

      if (!solvesByProblem[problemKey]) {
        solvesByProblem[problemKey] = {
          user_id: userId,
          platform,
          platform_id: platformId,
          problem_id: problemKey,
          problem_name: sub.problem_name,
          // V2 submissions table doesn't have these fields; they're on the problems table
          // For V2, these will be fetched/set separately when creating problem records
          problem_url: useV2 ? null : sub.problem_url,
          contest_id: useV2 ? null : sub.contest_id,
          difficulty_rating: useV2 ? null : sub.difficulty_rating,
          difficulty_tier: useV2
            ? null
            : this.mapDifficultyTier(platform, sub.difficulty_rating),
          first_solved_at: submittedAt,
          attempt_count: 1,
          tags: useV2
            ? null
            : sub.tags && sub.tags.length > 0
              ? sub.tags
              : null,
        };
      } else {
        solvesByProblem[problemKey].attempt_count++;
        if (
          submittedAt &&
          (!solvesByProblem[problemKey].first_solved_at ||
            !Number.isFinite(
              Date.parse(solvesByProblem[problemKey].first_solved_at)
            ) ||
            Date.parse(submittedAt) <
              Date.parse(solvesByProblem[problemKey].first_solved_at))
        ) {
          solvesByProblem[problemKey].first_solved_at = submittedAt;
        }
        if (
          !useV2 &&
          sub.tags &&
          sub.tags.length > 0 &&
          !solvesByProblem[problemKey].tags
        ) {
          solvesByProblem[problemKey].tags = sub.tags;
        }
      }
    }

    // V2 cleanup: remove stale solves (and linked solutions) for this platform
    // so verdict corrections cannot leave orphaned solved-problem entries.
    if (useV2) {
      const validProblemKeys = new Set(Object.keys(solvesByProblem));

      try {
        const { data: existingSolveRows, error: existingSolveError } =
          await supabaseAdmin
            .from(V2_TABLES.USER_SOLVES)
            .select('id, problems!inner(external_id, platform_id)')
            .eq('user_id', userId)
            .eq('problems.platform_id', platformId);

        if (existingSolveError) {
          console.warn(
            `[${platform.toUpperCase()}] V2 stale solve lookup failed:`,
            existingSolveError.message
          );
        } else {
          const orphanSolveIds = (existingSolveRows || [])
            .filter((row) => {
              const joinedProblem = Array.isArray(row.problems)
                ? row.problems[0]
                : row.problems;
              const externalId = String(
                joinedProblem?.external_id || ''
              ).trim();
              return !externalId || !validProblemKeys.has(externalId);
            })
            .map((row) => row.id)
            .filter(Boolean);

          if (orphanSolveIds.length > 0) {
            const { error: deleteSolutionsError } = await supabaseAdmin
              .from(V2_TABLES.SOLUTIONS)
              .delete()
              .in('user_solve_id', orphanSolveIds);

            if (deleteSolutionsError) {
              console.warn(
                `[${platform.toUpperCase()}] V2 stale solution cleanup failed:`,
                deleteSolutionsError.message
              );
            }

            const { error: deleteSolvesError } = await supabaseAdmin
              .from(V2_TABLES.USER_SOLVES)
              .delete()
              .in('id', orphanSolveIds);

            if (deleteSolvesError) {
              console.warn(
                `[${platform.toUpperCase()}] V2 stale solve cleanup failed:`,
                deleteSolvesError.message
              );
            }
          }
        }
      } catch (cleanupError) {
        console.warn(
          `[${platform.toUpperCase()}] V2 stale solve cleanup exception:`,
          cleanupError.message
        );
      }
    }

    if (!submissions || submissions.length === 0) return;

    const solves = Object.values(solvesByProblem);
    const BATCH_SIZE = 100;

    if (useV2) {
      // ═══════════════════════════════════════════════════════════════════════
      // V2 SCHEMA: Sync to problems_v2 + user_solves_v2
      // ═══════════════════════════════════════════════════════════════════════
      for (let i = 0; i < solves.length; i += BATCH_SIZE) {
        const batch = solves.slice(i, i + BATCH_SIZE);

        for (const solve of batch) {
          try {
            const difficultyRating = solve.difficulty_rating
              ? Math.round(Number(solve.difficulty_rating))
              : null;

            // Step 1: Upsert into problems table (V2 schema uses 'external_id' not 'problem_id')
            const { data: existingProblem } = await supabaseAdmin
              .from(V2_TABLES.PROBLEMS)
              .select('id')
              .eq('platform_id', platformId)
              .eq('external_id', solve.problem_id)
              .maybeSingle();

            let problemDbId = existingProblem?.id;

            if (!problemDbId) {
              // Create new problem record in V2
              // V2 problems table: id, platform_id, external_id, contest_id, name, url,
              // difficulty_rating, difficulty_tier_id, time_limit_ms, memory_limit_kb, created_at, updated_at
              const problemData = {
                platform_id: platformId,
                external_id: solve.problem_id,
                name: solve.problem_name || `Problem ${solve.problem_id}`,
                url: solve.problem_url || null,
                contest_id: solve.contest_id || null,
                difficulty_rating: difficultyRating,
              };

              const { data: newProblem, error: createError } =
                await supabaseAdmin
                  .from(V2_TABLES.PROBLEMS)
                  .insert(problemData)
                  .select('id')
                  .single();

              if (createError) {
                if (createError.code === '23505') {
                  // Race condition - fetch existing
                  const { data: existingAfterConflict } = await supabaseAdmin
                    .from(V2_TABLES.PROBLEMS)
                    .select('id')
                    .eq('platform_id', platformId)
                    .eq('external_id', solve.problem_id)
                    .maybeSingle();
                  problemDbId = existingAfterConflict?.id;
                } else {
                  console.warn(
                    `[${platform.toUpperCase()}] V2 Error creating problem ${solve.problem_id}:`,
                    createError.message
                  );
                  continue;
                }
              } else {
                problemDbId = newProblem?.id;
              }
            } else {
              // Update existing problem with latest info
              const updateData = { updated_at: new Date().toISOString() };
              if (solve.problem_name) updateData.name = solve.problem_name;
              if (solve.problem_url) updateData.url = solve.problem_url;
              if (solve.contest_id) updateData.contest_id = solve.contest_id;
              if (difficultyRating !== null)
                updateData.difficulty_rating = difficultyRating;

              await supabaseAdmin
                .from(V2_TABLES.PROBLEMS)
                .update(updateData)
                .eq('id', problemDbId);
            }

            if (!problemDbId) {
              console.warn(
                `[${platform.toUpperCase()}] V2 Could not get problem ID for ${solve.problem_id}`
              );
              continue;
            }

            // Step 2: Upsert into user_solves_v2 table
            const { data: existingSolve } = await supabaseAdmin
              .from(V2_TABLES.USER_SOLVES)
              .select('id, solve_count')
              .eq('user_id', userId)
              .eq('problem_id', problemDbId)
              .maybeSingle();

            const solveCount = solve.attempt_count || 1;

            if (existingSolve) {
              await supabaseAdmin
                .from(V2_TABLES.USER_SOLVES)
                .update({
                  solve_count: solveCount,
                  attempt_count: solveCount,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingSolve.id);
            } else {
              const { error: solveError } = await supabaseAdmin
                .from(V2_TABLES.USER_SOLVES)
                .insert({
                  user_id: userId,
                  problem_id: problemDbId,
                  first_solved_at: solve.first_solved_at,
                  solve_count: solveCount,
                  attempt_count: solveCount,
                });

              if (solveError && solveError.code !== '23505') {
                console.warn(
                  `[${platform.toUpperCase()}] V2 Error creating user_solve for ${solve.problem_id}:`,
                  solveError.message
                );
              }
            }
          } catch (syncError) {
            console.warn(
              `[${platform.toUpperCase()}] V2 Error syncing solve ${solve.problem_id}:`,
              syncError.message
            );
          }
        }
      }
    } else {
      // ═══════════════════════════════════════════════════════════════════════
      // LEGACY SCHEMA: Sync to problem_solves + problems + user_problem_solves
      // ═══════════════════════════════════════════════════════════════════════

      // ── CLEANUP ORPHANED SOLVES ──────────────────────────────────────────────
      const { data: existingSolves } = await supabaseAdmin
        .from('problem_solves')
        .select('problem_id')
        .eq('user_id', userId)
        .eq('platform', platform);

      if (existingSolves) {
        const validProblemIds = new Set(Object.keys(solvesByProblem));
        const orphanedIds = existingSolves
          .map((s) => s.problem_id)
          .filter((id) => !validProblemIds.has(id));

        if (orphanedIds.length > 0) {
          for (let i = 0; i < orphanedIds.length; i += 100) {
            const batch = orphanedIds.slice(i, i + 100);
            await supabaseAdmin
              .from('problem_solves')
              .delete()
              .eq('user_id', userId)
              .eq('platform', platform)
              .in('problem_id', batch);
          }
        }
      }

      if (solves.length > 0) {
        // Upsert to problem_solves (legacy)
        for (let i = 0; i < solves.length; i += BATCH_SIZE) {
          const batch = solves.slice(i, i + BATCH_SIZE);
          const { error } = await supabaseAdmin
            .from('problem_solves')
            .upsert(batch, {
              onConflict: 'user_id,platform,problem_id',
              ignoreDuplicates: false,
            });

          if (error) {
            if (error.code === 'PGRST204' && error.message?.includes('tags')) {
              const batchWithoutTags = batch.map(({ tags, ...rest }) => rest);
              await supabaseAdmin
                .from('problem_solves')
                .upsert(batchWithoutTags, {
                  onConflict: 'user_id,platform,problem_id',
                  ignoreDuplicates: false,
                });
            } else {
              console.error(`Error upserting solves batch:`, error);
            }
          }
        }

        // Also sync to problems + user_problem_solves (intermediate schema)
        for (let i = 0; i < solves.length; i += BATCH_SIZE) {
          const batch = solves.slice(i, i + BATCH_SIZE);

          for (const solve of batch) {
            try {
              const difficultyRating = solve.difficulty_rating
                ? Math.round(Number(solve.difficulty_rating))
                : null;
              const tags =
                solve.tags && Array.isArray(solve.tags) && solve.tags.length > 0
                  ? solve.tags
                  : null;

              // Step 1: Upsert into problems table
              const { data: existingProblem } = await supabaseAdmin
                .from('problems')
                .select('id')
                .eq('platform', solve.platform)
                .eq('problem_id', solve.problem_id)
                .maybeSingle();

              let problemDbId = existingProblem?.id;

              if (!problemDbId) {
                const problemData = {
                  platform: solve.platform,
                  problem_id: solve.problem_id,
                  problem_name:
                    solve.problem_name || `Problem ${solve.problem_id}`,
                  problem_url: solve.problem_url || null,
                  contest_id: solve.contest_id || null,
                  difficulty_rating: difficultyRating,
                  tags: tags,
                };

                const { data: newProblem, error: createError } =
                  await supabaseAdmin
                    .from('problems')
                    .insert(problemData)
                    .select('id')
                    .single();

                if (createError) {
                  if (createError.code === '23505') {
                    const { data: existingAfterConflict } = await supabaseAdmin
                      .from('problems')
                      .select('id')
                      .eq('platform', solve.platform)
                      .eq('problem_id', solve.problem_id)
                      .maybeSingle();
                    problemDbId = existingAfterConflict?.id;
                  } else {
                    continue;
                  }
                } else {
                  problemDbId = newProblem?.id;
                }
              } else {
                const updateData = { updated_at: new Date().toISOString() };
                if (solve.problem_name)
                  updateData.problem_name = solve.problem_name;
                if (solve.problem_url)
                  updateData.problem_url = solve.problem_url;
                if (solve.contest_id) updateData.contest_id = solve.contest_id;
                if (difficultyRating !== null)
                  updateData.difficulty_rating = difficultyRating;
                if (tags) updateData.tags = tags;

                await supabaseAdmin
                  .from('problems')
                  .update(updateData)
                  .eq('id', problemDbId);
              }

              if (!problemDbId) continue;

              // Step 2: Upsert into user_problem_solves table
              const { data: existingSolve } = await supabaseAdmin
                .from('user_problem_solves')
                .select('id, solve_count')
                .eq('user_id', userId)
                .eq('problem_id', problemDbId)
                .maybeSingle();

              const solveCount = solve.attempt_count || 1;

              if (existingSolve) {
                await supabaseAdmin
                  .from('user_problem_solves')
                  .update({
                    solve_count: solveCount,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', existingSolve.id);
              } else {
                const { error: solveError } = await supabaseAdmin
                  .from('user_problem_solves')
                  .insert({
                    user_id: userId,
                    problem_id: problemDbId,
                    first_solved_at: solve.first_solved_at,
                    solve_count: solveCount,
                  });

                if (solveError && solveError.code !== '23505') {
                  console.warn(
                    `[${platform.toUpperCase()}] Error creating user_problem_solve:`,
                    solveError.message
                  );
                }
              }
            } catch (syncError) {
              console.warn(
                `[${platform.toUpperCase()}] Error syncing solve to new schema:`,
                syncError.message
              );
            }
          }
        }
      }
    }
  }

  /**
   * Backfill tags from problem_submissions to problem_solves
   * Call this to update existing solves with tags from their submissions
   */
  async backfillTagsForUser(userId) {
    try {
      // Get all submissions with tags
      const { data: submissions } = await supabaseAdmin
        .from('problem_submissions')
        .select('platform, problem_id, tags')
        .eq('user_id', userId)
        .not('tags', 'is', null);

      if (!submissions || submissions.length === 0) return 0;

      // Group tags by problem (use latest non-empty tags)
      const tagsByProblem = {};
      for (const sub of submissions) {
        if (sub.tags && sub.tags.length > 0) {
          const key = `${sub.platform}-${sub.problem_id}`;
          tagsByProblem[key] = {
            platform: sub.platform,
            problem_id: sub.problem_id,
            tags: sub.tags,
          };
        }
      }

      // Update problem_solves with tags
      let updatedCount = 0;
      for (const data of Object.values(tagsByProblem)) {
        const { error } = await supabaseAdmin
          .from('problem_solves')
          .update({ tags: data.tags })
          .eq('user_id', userId)
          .eq('platform', data.platform)
          .eq('problem_id', data.problem_id);

        if (error) {
          // If tags column doesn't exist, skip backfill silently
          if (error.code === 'PGRST204' && error.message?.includes('tags')) {
            console.warn(
              'Tags column not found in problem_solves, skipping backfill. Run the migration: scripts/sql/problem-tags-migration.sql'
            );
            return 0;
          }
        } else {
          updatedCount++;
        }
      }

      return updatedCount;
    } catch (error) {
      console.error('Error in backfillTagsForUser:', error);
      return 0;
    }
  }

  async updateDailyActivity(userId) {
    const { data: solves } = await supabaseAdmin
      .from('problem_solves')
      .select('first_solved_at, platform')
      .eq('user_id', userId);

    if (!solves) return;

    const byDate = {};
    for (const solve of solves) {
      if (!solve.first_solved_at) continue;
      const date = solve.first_solved_at.split('T')[0];
      if (!byDate[date]) {
        byDate[date] = { count: 0, platforms: new Set() };
      }
      byDate[date].count++;
      byDate[date].platforms.add(solve.platform);
    }

    const activities = Object.entries(byDate).map(([date, data]) => ({
      user_id: userId,
      activity_date: date,
      problems_solved: data.count,
      platforms_active: Array.from(data.platforms),
    }));

    if (activities.length > 0) {
      await supabaseAdmin
        .from('daily_activity')
        .upsert(activities, { onConflict: 'user_id,activity_date' });
    }
  }

  async updateUserStatistics(userId, fetchPlatformStats = false) {
    const statsTable = V2_TABLES.USER_STATS;

    // V2/V3: join user_solves → problems → difficulty_tiers for proper tier counts
    const { data: solves } = await supabaseAdmin
      .from(V2_TABLES.USER_SOLVES)
      .select(
        `first_solved_at,
         problems(
           difficulty_rating,
           difficulty_tier_id,
           platform_id,
           difficulty_tiers(id, min_rating, max_rating),
           platforms(code)
         )`
      )
      .eq('user_id', userId);

    if (!solves) return;

    const totalSolved = solves.length;
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const solvedThisWeek = solves.filter(
      (s) => new Date(s.first_solved_at) >= weekAgo
    ).length;
    const solvedThisMonth = solves.filter(
      (s) => new Date(s.first_solved_at) >= monthAgo
    ).length;

    // Per-tier counts keyed by min_rating (e.g. 800, 900, …)
    const tierCounts = {};
    // Per-tier counts keyed by tier id (for user_tier_stats upsert)
    const tierIdCounts = {};
    // Per-platform counts
    const platformCounts = {};

    solves.forEach((s) => {
      const minRating = s.problems?.difficulty_tiers?.min_rating;
      const tierId = s.problems?.difficulty_tier_id;
      const platCode = s.problems?.platforms?.code;

      if (minRating != null) {
        tierCounts[minRating] = (tierCounts[minRating] || 0) + 1;
      }
      if (tierId != null) {
        tierIdCounts[tierId] = (tierIdCounts[tierId] || 0) + 1;
      }
      if (platCode) {
        platformCounts[platCode] = (platformCounts[platCode] || 0) + 1;
      }
    });

    // Helper: solved for a specific rating bracket (inclusive lower bound)
    const sc = (r) => tierCounts[r] || 0;

    // Flat columns in user_stats (kept for backward compat)
    const easy_solved = sc(800) + sc(900);
    const medium_solved = sc(1000) + sc(1100) + sc(1200) + sc(1300);
    const hard_solved = sc(1400) + sc(1500) + sc(1600) + sc(1700);
    const expert_solved =
      sc(1800) +
      sc(1900) +
      sc(2000) +
      sc(2100) +
      sc(2200) +
      sc(2300) +
      sc(2400) +
      (tierCounts[2500] || 0);

    // Calculate weighted score from per-rating tier counts
    const ratingWeights = {
      800: 1,
      900: 1.2,
      1000: 1.5,
      1100: 1.8,
      1200: 2,
      1300: 2.5,
      1400: 3,
      1500: 3.5,
      1600: 4,
      1700: 4.5,
      1800: 5,
      1900: 6,
      2000: 7,
      2100: 8,
      2200: 9,
      2300: 10,
      2400: 12,
      2500: 15,
    };
    const weightedScore = Object.entries(ratingWeights).reduce(
      (sum, [rating, w]) => sum + (tierCounts[Number(rating)] || 0) * w,
      0
    );

    // Calculate streak
    const currentStreak = await this.calculateStreak(userId);

    // --- 1. Update user_stats ---
    const updateData = {
      user_id: userId,
      total_solved: totalSolved,
      easy_solved,
      medium_solved,
      hard_solved,
      expert_solved,
      // Flat rating-bracket columns (V2 compat)
      solved_800: sc(800),
      solved_900: sc(900),
      solved_1000: sc(1000),
      solved_1100: sc(1100),
      solved_1200: sc(1200),
      solved_1300: sc(1300),
      solved_1400: sc(1400),
      solved_1500: sc(1500),
      solved_1600: sc(1600),
      solved_1700: sc(1700),
      solved_1800: sc(1800),
      solved_1900: sc(1900),
      solved_2000: sc(2000),
      solved_2100: sc(2100),
      solved_2200: sc(2200),
      solved_2300: sc(2300),
      solved_2400: sc(2400),
      solved_2500_plus: tierCounts[2500] || 0,
      current_streak: currentStreak,
      solved_this_week: solvedThisWeek,
      solved_this_month: solvedThisMonth,
      weighted_score: weightedScore,
      updated_at: new Date().toISOString(),
    };

    await supabaseAdmin
      .from(statsTable)
      .upsert(updateData, { onConflict: 'user_id' });

    // --- 2. Populate user_tier_stats (V3) ---
    const tierRows = Object.entries(tierIdCounts).map(([tierId, count]) => ({
      user_id: userId,
      difficulty_tier_id: parseInt(tierId, 10),
      solved_count: count,
      updated_at: new Date().toISOString(),
    }));

    if (tierRows.length > 0) {
      await supabaseAdmin
        .from(V2_TABLES.USER_TIER_STATS)
        .upsert(tierRows, { onConflict: 'user_id,difficulty_tier_id' });
    }

    // --- 3. Update user_platform_stats (V3) ---
    // Fetch per-platform handle data for rating info
    const { data: handles } = await supabaseAdmin
      .from(V2_TABLES.USER_HANDLES)
      .select(
        'platform_id, current_rating, max_rating, rank_title, platforms!inner(code)'
      )
      .eq('user_id', userId);

    if (handles && handles.length > 0) {
      const parseNonNegativeNumber = (value) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) return 0;
        return parsed;
      };

      const parseProblemsPayload = (value) => {
        if (!value) return null;

        let parsed = value;
        if (typeof parsed === 'string') {
          const raw = parsed.trim();
          if (!raw || raw === '[]' || raw === '{}') return null;

          try {
            parsed = JSON.parse(raw);
          } catch {
            return null;
          }
        }

        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch {
            return null;
          }
        }

        return parsed;
      };

      const hasAttemptInProblemEntry = (problem) => {
        if (!problem || typeof problem !== 'object') return false;

        if (problem.attempted === true) return true;
        if (problem.solved === true || problem.solvedDuringContest === true) {
          return true;
        }

        if (problem.time !== null && problem.time !== undefined) return true;

        if (
          Array.isArray(problem.submissions) &&
          problem.submissions.length > 0
        ) {
          return true;
        }

        const result = problem.result;
        if (typeof result === 'string') {
          const normalized = result.trim();
          if (
            normalized &&
            normalized !== '-' &&
            normalized !== '?' &&
            normalized.toLowerCase() !== 'n/a'
          ) {
            return true;
          }
        } else if (typeof result === 'number' && Number.isFinite(result)) {
          return true;
        }

        return false;
      };

      const hasAttemptInProblemsPayload = (value) => {
        const payload = parseProblemsPayload(value);
        if (!payload) return false;

        if (Array.isArray(payload)) {
          return payload.some((problem) => hasAttemptInProblemEntry(problem));
        }

        if (typeof payload === 'object') {
          return Object.values(payload).some((problem) =>
            hasAttemptInProblemEntry(problem)
          );
        }

        return false;
      };

      const isActiveContestParticipation = (contest) => {
        if (!contest || contest.is_virtual === true) return false;

        const attempted = parseNonNegativeNumber(contest.problems_attempted);
        if (attempted > 0) return true;

        const solved = parseNonNegativeNumber(contest.problems_solved);
        if (solved > 0) return true;

        const score = parseNonNegativeNumber(contest.score);
        if (score > 0) return true;

        return hasAttemptInProblemsPayload(contest.problems_data);
      };

      // Count active contests per platform (submission attempt during contest time)
      const { data: contests } = await supabaseAdmin
        .from(V2_TABLES.CONTEST_HISTORY)
        .select(
          'platform_id, is_virtual, problems_attempted, problems_solved, score, problems_data'
        )
        .eq('user_id', userId);

      const contestsByPlatform = {};
      (contests || []).forEach((contest) => {
        if (!isActiveContestParticipation(contest)) return;

        contestsByPlatform[contest.platform_id] =
          (contestsByPlatform[contest.platform_id] || 0) + 1;
      });

      // Count total submissions per platform.
      // Supabase/PostgREST returns paged results; fetch all pages to avoid
      // under-counting users with >1000 submissions.
      const subsByPlatform = {};
      const SUBMISSIONS_PAGE_SIZE = 1000;
      for (let offset = 0; ; offset += SUBMISSIONS_PAGE_SIZE) {
        const { data: subsPage, error: subsPageError } = await supabaseAdmin
          .from(V2_TABLES.SUBMISSIONS)
          .select('platform_id')
          .eq('user_id', userId)
          .range(offset, offset + SUBMISSIONS_PAGE_SIZE - 1);

        if (subsPageError) {
          console.warn(
            `[STATS] Failed to fetch submissions page at offset ${offset}:`,
            subsPageError.message
          );
          break;
        }

        if (!subsPage || subsPage.length === 0) {
          break;
        }

        subsPage.forEach((s) => {
          subsByPlatform[s.platform_id] =
            (subsByPlatform[s.platform_id] || 0) + 1;
        });

        if (subsPage.length < SUBMISSIONS_PAGE_SIZE) {
          break;
        }
      }

      const platformStatRows = handles.map((h) => ({
        user_id: userId,
        platform_id: h.platform_id,
        problems_solved: platformCounts[h.platforms?.code] || 0,
        current_rating: h.current_rating,
        max_rating: h.max_rating,
        rank_title: h.rank_title,
        contest_count: contestsByPlatform[h.platform_id] || 0,
        total_submissions: subsByPlatform[h.platform_id] || 0,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await supabaseAdmin
        .from(V2_TABLES.USER_PLATFORM_STATS)
        .upsert(platformStatRows, { onConflict: 'user_id,platform_id' });
    }
  }

  async calculateStreak(userId) {
    const { data: activities } = await supabaseAdmin
      .from('daily_activity')
      .select('activity_date, problems_solved')
      .eq('user_id', userId)
      .gt('problems_solved', 0)
      .order('activity_date', { ascending: false })
      .limit(365);

    if (!activities || activities.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Check if most recent activity is today or yesterday
    const mostRecent = activities[0].activity_date;
    if (mostRecent !== today && mostRecent !== yesterday) {
      return 0;
    }

    let streak = 1;
    let currentDate = new Date(mostRecent);

    for (let i = 1; i < activities.length; i++) {
      const expectedDate = new Date(currentDate - 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      if (activities[i].activity_date === expectedDate) {
        streak++;
        currentDate = new Date(expectedDate);
      } else {
        break;
      }
    }

    return streak;
  }

  mapDifficultyTier(platform, rating) {
    if (!rating) return 'medium';

    switch (platform) {
      case 'codeforces':
      case 'vjudge': // VJudge uses Codeforces-style ratings for most problems
      case 'cfgym':
        if (rating < 1200) return 'easy';
        if (rating < 1600) return 'medium';
        if (rating < 2100) return 'hard';
        return 'expert';
      case 'atcoder':
        if (rating <= 100) return 'easy';
        if (rating <= 300) return 'medium';
        if (rating <= 500) return 'hard';
        return 'expert';
      case 'leetcode':
        // LeetCode uses 1-3 difficulty scale
        if (rating === 1) return 'easy';
        if (rating === 2) return 'medium';
        return 'hard';
      case 'codechef':
        // CodeChef uses star-based rating
        if (rating < 1000) return 'easy';
        if (rating < 1500) return 'medium';
        if (rating < 2000) return 'hard';
        return 'expert';
      case 'spoj':
      case 'lightoj':
      case 'uva':
        // These use problem-specific difficulty numbers, normalize them
        if (rating < 3) return 'easy';
        if (rating < 5) return 'medium';
        if (rating < 7) return 'hard';
        return 'expert';
      default:
        return 'medium';
    }
  }

  /**
   * Fetch all-time platform statistics for a user from external APIs
   * Returns solved counts, ratings, and other platform-specific stats
   */
  async getPlatformStats(userId) {
    // Check for V2 schema
    const useV2 = await isV2SchemaAvailable();
    let handles = [];

    if (useV2) {
      const { data: v2Handles } = await supabaseAdmin
        .from(V2_TABLES.USER_HANDLES)
        .select('*, cp_platforms(code)')
        .eq('user_id', userId)
        .eq('is_verified', true);

      handles =
        v2Handles?.map((h) => ({
          ...h,
          platform: h.cp_platforms?.code || '',
        })) || [];
    } else {
      const { data: legacyHandles } = await supabaseAdmin
        .from('user_handles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_verified', true);
      handles = legacyHandles || [];
    }

    if (!handles || handles.length === 0) {
      return {};
    }

    const platformStats = {};

    // Helper function to get solved count from database as fallback
    const solvesTable = useV2 ? V2_TABLES.USER_SOLVES : 'problem_solves';
    const getDbSolvedCount = async (platform) => {
      const { count } = await supabaseAdmin
        .from(solvesTable)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('platform', platform);
      return count || 0;
    };

    for (const handle of handles) {
      try {
        let stats = null;

        switch (handle.platform) {
          case 'codeforces': {
            const cfInfo = await this.codeforces.getUserInfo(handle.handle);
            const cfRating = await this.codeforces
              .getRatingHistory(handle.handle)
              .catch(() => []);
            const cfSolved = await getDbSolvedCount('codeforces');
            stats = {
              solved: cfSolved,
              rating: cfInfo?.rating || 0,
              max_rating: cfInfo?.maxRating || 0,
              contests: cfRating?.length || 0,
            };
            break;
          }

          case 'atcoder': {
            const acStats = await this.atcoder.getUserStats(handle.handle);
            const acDbSolvedCount = await getDbSolvedCount('atcoder');
            // Get total participants from contest_history DB (populated by CLIST sync)
            const { data: acContests } = await supabaseAdmin
              .from('contest_history')
              .select('total_participants')
              .eq('user_id', userId)
              .eq('platform', 'atcoder')
              .not('total_participants', 'is', null);
            const dbTotalParticipants = acContests
              ? acContests.reduce(
                  (sum, c) => sum + (c.total_participants || 0),
                  0
                )
              : 0;
            stats = {
              solved: Math.max(acStats?.ac_count || 0, acDbSolvedCount),
              rating: acStats?.rating || 0,
              max_rating: acStats?.max_rating || 0,
              contests: acStats?.contests || 0,
              total_participants: Math.max(
                acStats?.total_participants || 0,
                dbTotalParticipants
              ),
            };
            break;
          }

          case 'leetcode': {
            const lcProfile = await this.leetcode.getUserProfile(handle.handle);
            const lcDbSolvedCount = await getDbSolvedCount('leetcode');
            stats = {
              solved: Math.max(lcProfile?.total_solved || 0, lcDbSolvedCount),
              easy: lcProfile?.easy || 0,
              medium: lcProfile?.medium || 0,
              hard: lcProfile?.hard || 0,
              ranking: lcProfile?.ranking || 0,
              contest_rating: lcProfile?.contest_rating || 0,
              contests: lcProfile?.contests_attended || 0,
              total_participants: lcProfile?.total_participants || 0,
              global_ranking: lcProfile?.global_ranking || 0,
              top_percentage: lcProfile?.top_percentage || 0,
            };
            break;
          }

          case 'toph': {
            const tophProfile = await this.toph.getUserProfile(handle.handle);
            stats = {
              solved: tophProfile?.totalSolved || 0,
              rating: tophProfile?.rating || 0,
            };
            break;
          }

          case 'cses': {
            const csesProfile = await this.cses.getUserProfile(handle.handle);
            stats = {
              solved: csesProfile?.totalSolved || 0,
            };
            break;
          }

          case 'codechef': {
            const ccProfile = await this.codechef.getUserProfile(handle.handle);
            stats = {
              solved: ccProfile?.totalSolved || 0,
              rating: ccProfile?.rating || 0,
              max_rating: ccProfile?.maxRating || ccProfile?.highestRating || 0,
              stars: ccProfile?.stars || 0,
            };
            break;
          }

          case 'topcoder': {
            const tcProfile = await this.topcoder.getUserProfile(handle.handle);
            stats = {
              solved: tcProfile?.competitions || 0,
              rating: tcProfile?.rating || 0,
            };
            break;
          }

          case 'hackerrank': {
            const hrProfile = await this.hackerrank.getUserProfile(
              handle.handle
            );
            // badges is an array, count it
            const badgeCount = Array.isArray(hrProfile?.badges)
              ? hrProfile.badges.length
              : hrProfile?.badges || 0;
            stats = {
              solved: hrProfile?.totalSolved || 0,
              badges: badgeCount,
            };
            break;
          }

          case 'kattis': {
            const kattisProfile = await this.kattis.getUserProfile(
              handle.handle
            );
            stats = {
              solved: kattisProfile?.totalSolved || 0,
              score: kattisProfile?.score || 0,
              rank: kattisProfile?.rank || 0,
            };
            break;
          }

          case 'lightoj': {
            const lojProfile = await this.lightoj.getUserProfile(handle.handle);
            stats = {
              solved: lojProfile?.totalSolved || 0,
            };
            break;
          }

          case 'uva': {
            const uvaProfile = await this.uva.getUserProfile(handle.handle);
            stats = {
              solved: uvaProfile?.totalSolved || 0,
              submissions: uvaProfile?.totalSubmissions || 0,
            };
            break;
          }

          case 'spoj': {
            const spojProfile = await this.spoj.getUserProfile(handle.handle);
            stats = {
              solved: spojProfile?.totalSolved || 0,
              rank: spojProfile?.rank || 0,
            };
            break;
          }

          case 'vjudge': {
            const vjProfile = await this.vjudge.getUserProfile(handle.handle);
            // Don't include acRecords as it's too large - just count OJs
            stats = {
              solved: vjProfile?.totalSolved || 0,
              oj_count: Array.isArray(vjProfile?.ojs)
                ? vjProfile.ojs.length
                : 0,
            };
            break;
          }

          case 'cfgym': {
            const cfGymSolved = await getDbSolvedCount('cfgym');
            stats = {
              solved: cfGymSolved,
            };
            break;
          }

          case 'csacademy': {
            const csaProfile = await this.csacademy.getUserProfile(
              handle.handle
            );
            stats = {
              solved: csaProfile?.totalSolved || 0,
              rating: csaProfile?.rating || 0,
            };
            break;
          }

          case 'eolymp': {
            const eolympProfile = await this.eolymp.getUserProfile(
              handle.handle
            );
            stats = {
              solved: eolympProfile?.totalSolved || 0,
              rating: eolympProfile?.rating || 0,
            };
            break;
          }

          case 'usaco': {
            const usacoProfile = await this.usaco.getUserProfile(handle.handle);
            stats = {
              solved: usacoProfile?.totalSolved || 0,
              division: usacoProfile?.division || null,
            };
            break;
          }
        }

        if (stats) {
          platformStats[handle.platform] = stats;
        }
      } catch (error) {
        console.error(
          `Error fetching ${handle.platform} stats for ${handle.handle}:`,
          error.message
        );
        // Fallback: get solved count from database
        const dbSolved = await getDbSolvedCount(handle.platform);
        platformStats[handle.platform] = {
          solved: dbSolved,
          error: error.message,
        };
      }
    }

    return platformStats;
  }
}

export default ProblemSolvingAggregator;
