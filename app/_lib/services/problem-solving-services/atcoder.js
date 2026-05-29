/**
 * @file atcoder — split from the problem-solving-services module.
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { PROBLEM_SOLVING_PLATFORM_IDS } from '@/app/_lib/services/problem-solving-platforms';
import {
  V2_TABLES,
  getPlatformCode,
  getPlatformId,
  isV2SchemaAvailable,
} from '@/app/_lib/services/problem-solving-v2-helpers';

import { fetchWithTimeout } from './_shared';
import { ClistService } from './clist';

// ============================================
// ATCODER SERVICE
// ============================================
export class AtCoderService {
  constructor() {
    this.apiBase = 'https://kenkoooo.com/atcoder/atcoder-api/v3';
    this.officialBase = 'https://atcoder.jp';
  }

  async getSubmissions(handle, fromTimestamp = null) {
    const cacheKey = `ac_subs_${handle}_${fromTimestamp || 'all'}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    let submissions = [];

    // Try Kenkoooo API first
    try {
      // v3 API requires from_second parameter — use 0 for "all submissions"
      const fromSeconds = fromTimestamp
        ? Math.floor(new Date(fromTimestamp).getTime() / 1000)
        : 0;
      const url = `${this.apiBase}/user/submissions?user=${handle}&from_second=${fromSeconds}`;

      const response = await fetchWithTimeout(url);

      if (response.ok) {
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          // Pre-fetch problem catalog for name resolution
          const allProblems = await this.getAllProblems();

          submissions = data.map((sub) => ({
            submission_id: sub.id.toString(),
            problem_id: sub.problem_id,
            problem_name: allProblems[sub.problem_id]?.name || sub.problem_id,
            problem_url: `https://atcoder.jp/contests/${sub.contest_id}/tasks/${sub.problem_id}`,
            contest_id: sub.contest_id,
            verdict: sub.result === 'AC' ? 'AC' : this.mapVerdict(sub.result),
            language: sub.language,
            execution_time_ms: sub.execution_time,
            submitted_at: new Date(sub.epoch_second * 1000).toISOString(),
            difficulty_rating: sub.point,
          }));
        }
      } else {
        console.warn(
          `[AC] Kenkoooo API returned ${response.status} for ${handle}, will try CLIST fallback`
        );
      }
    } catch (error) {
      console.warn(
        `[AC] Kenkoooo API error for ${handle}: ${error.message}, will try CLIST fallback`
      );
    }

    // FALLBACK: Use CLIST contest statistics to extract solved problems
    if (submissions.length === 0) {
      try {
        const clistService = new ClistService();
        if (clistService.isConfigured()) {
          // Get account first
          const account = await clistService.findAccount('atcoder', handle);
          if (account?.id) {
            const data = await clistService.fetchApi('statistics', {
              account_id: account.id,
              order_by: '-date',
              with_problems: true,
              limit: 10000,
            });

            if (data?.objects) {
              const allProblems = await this.getAllProblems();

              for (const stat of data.objects) {
                if (
                  !stat.addition?.problems ||
                  typeof stat.addition.problems !== 'object'
                )
                  continue;

                const contestUrl = stat.contest?.url;
                let contestId = null;
                if (contestUrl) {
                  const match = contestUrl.match(/\/contests\/([^/]+)/);
                  if (match) contestId = match[1];
                }

                const contestDate = stat.contest?.start || stat.date;

                // Apply fromTimestamp filter
                if (fromTimestamp && contestDate) {
                  if (
                    new Date(contestDate).getTime() <=
                    new Date(fromTimestamp).getTime()
                  ) {
                    continue;
                  }
                }

                for (const [label, value] of Object.entries(
                  stat.addition.problems
                )) {
                  const isSolved =
                    value?.result?.includes('+') || value?.result === 'AC';
                  if (!isSolved) continue;

                  // Try to derive problem_id from contest_id and label
                  const problemId = contestId
                    ? `${contestId}_${label.toLowerCase()}`
                    : `${stat.contest_id}_${label}`;

                  submissions.push({
                    submission_id: `clist_ac_${stat.contest_id}_${label}`,
                    problem_id: problemId,
                    problem_name:
                      value?.name ||
                      allProblems[problemId]?.name ||
                      `${stat.contest?.title || 'Contest'} - ${label}`,
                    problem_url:
                      value?.url ||
                      (contestId
                        ? `https://atcoder.jp/contests/${contestId}/tasks/${problemId}`
                        : null),
                    contest_id: contestId || stat.contest_id?.toString(),
                    verdict: 'AC',
                    language: 'Unknown',
                    submitted_at: contestDate || new Date().toISOString(),
                  });
                }
              }
            }
          }
        }
      } catch (clistError) {
        console.error('[AC] CLIST fallback error:', clistError.message);
      }
    }

    if (submissions.length > 0) {
      await this.setCache(cacheKey, submissions, 120);
    }
    return submissions;
  }

  async getUserStats(handle) {
    const cacheKey = `ac_stats_${handle}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    try {
      // Get rating history from official AtCoder API (this still works)
      const ratingHistory = await fetchWithTimeout(
        `${this.officialBase}/users/${handle}/history/json`
      )
        .then((r) => {
          if (!r.ok) throw new Error('User not found');
          return r.json();
        })
        .catch(() => []);

      // Count unique AC'd problems from submissions API (reliable)
      // The old ac_count endpoint was deprecated and returns 404
      const submissions = await this.getSubmissions(handle);
      const acProblems = new Set();
      submissions.forEach((sub) => {
        if (sub.verdict === 'AC') acProblems.add(sub.problem_id);
      });
      const acCount = acProblems.size;

      const stats = {
        ac_count: acCount,
        rating:
          ratingHistory.length > 0
            ? ratingHistory[ratingHistory.length - 1].NewRating
            : 0,
        max_rating:
          ratingHistory.length > 0
            ? Math.max(...ratingHistory.map((r) => r.NewRating))
            : 0,
        contests: ratingHistory.filter((r) => r.IsRated).length,
        total_contests: ratingHistory.length,
        // Extract total participants from each contest's Place field
        // Place = user's rank, so the contest had at least that many participants
        total_participants:
          ratingHistory.length > 0
            ? ratingHistory.reduce((sum, r) => sum + (r.Place || 0), 0)
            : 0,
        rating_history: ratingHistory.slice(-20), // Last 20 contests
      };

      await this.setCache(cacheKey, stats, 3600);
      return stats;
    } catch (error) {
      console.error('AtCoder stats error:', error.message);
      return {
        ac_count: 0,
        rating: 0,
        max_rating: 0,
        contests: 0,
        total_contests: 0,
      };
    }
  }

  /**
   * Get rating history for a user (standalone method for sync)
   * @param {string} handle - AtCoder handle
   * @returns {Array} - Rating history entries
   */
  async getRatingHistory(handle) {
    const cacheKey = `ac_rating_history_${handle}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchWithTimeout(
        `${this.officialBase}/users/${handle}/history/json`
      );

      if (!response.ok) {
        console.warn(`[AC] Rating history not found for ${handle}`);
        return [];
      }

      const ratingHistory = await response.json();

      // Transform to standard format
      const history = ratingHistory.map((entry) => ({
        contest_id: entry.ContestScreenName || entry.ContestName,
        contest_name: entry.ContestName,
        rank: entry.Place,
        old_rating: entry.OldRating,
        new_rating: entry.NewRating,
        rating_change: entry.NewRating - entry.OldRating,
        is_rated: entry.IsRated,
        date: entry.EndTime,
      }));

      await this.setCache(cacheKey, history, 3600);
      return history;
    } catch (error) {
      console.error('[AC] Rating history error:', error.message);
      return [];
    }
  }

  /**
   * Fetch all AtCoder problems (cached)
   * @returns {Object} - Map of problem_id -> problem data
   */
  async getAllProblems() {
    const cacheKey = 'atcoder_all_problems';
    const cached = await this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = 'https://kenkoooo.com/atcoder/resources/problems.json';
      const response = await fetchWithTimeout(url, {}, 60000, 2, 3000);
      const problems = await response.json();

      // Convert to map for faster lookup
      const problemMap = {};
      problems.forEach((p) => {
        problemMap[p.id] = {
          id: p.id,
          contest_id: p.contest_id,
          name: p.title,
          url: `https://atcoder.jp/contests/${p.contest_id}/tasks/${p.id}`,
        };
      });

      // Cache for 1 day
      await this.setCache(cacheKey, problemMap, 24 * 60 * 60);
      return problemMap;
    } catch (error) {
      console.error('[AC] Error fetching all problems:', error.message);
      return {};
    }
  }

  /**
   * Get problems for a specific contest
   * @param {string} contestId - AtCoder contest ID (e.g., "abc123")
   * @returns {Array} - Array of problem objects
   */
  async getContestProblems(contestId) {
    const allProblems = await this.getAllProblems();

    // Filter problems for this contest
    const contestProblems = Object.values(allProblems).filter(
      (p) => p.contest_id === contestId
    );

    // Sort by problem ID (which typically gives correct order)
    return contestProblems.sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * Enrich contests with problem-level data from submissions
   * Includes ALL problems (solved, attempted, unattempted) and tracks upsolves
   * @param {Array} contests - Array of contest objects from CLIST
   * @param {string} handle - AtCoder handle
   * @returns {Array} - Contests enriched with problems array
   */
  async enrichContestsWithProblems(contests, handle) {
    if (!contests || contests.length === 0) return contests;
    // Fetch all submissions for this user
    const submissions = await this.getSubmissions(handle);
    // Pre-fetch all problems (single API call, cached)
    await this.getAllProblems();

    // Group submissions by contest_id
    const submissionsByContest = {};
    submissions.forEach((sub) => {
      if (!sub.contest_id) return;
      if (!submissionsByContest[sub.contest_id]) {
        submissionsByContest[sub.contest_id] = [];
      }
      submissionsByContest[sub.contest_id].push(sub);
    });
    // Enrich each contest
    const enrichedContests = [];
    for (const contest of contests) {
      // Use platformContestId for matching with submissions (falls back to contestId if not set)
      const matchId = contest.platformContestId || contest.contestId;
      const contestSubs = submissionsByContest[matchId] || [];

      // Calculate contest end time using endDate if available, otherwise estimate from duration
      const contestStart = new Date(contest.date);
      let contestEnd;
      if (contest.endDate) {
        contestEnd = new Date(contest.endDate);
      } else {
        // Fallback: Use durationMinutes from CLIST, or duration field, or default 120 minutes
        const durationMs =
          (contest.durationMinutes || contest.duration || 120) * 60 * 1000;
        contestEnd = new Date(contestStart.getTime() + durationMs);
      }
      // Fetch ALL problems for this contest
      const contestProblems = await this.getContestProblems(matchId);

      // Build problem map from user's submissions
      const problemMap = {};
      contestSubs.forEach((sub) => {
        const problemId = sub.problem_id;
        const subTime = new Date(sub.submitted_at);

        if (!problemMap[problemId]) {
          // Extract problem label from problem_id (e.g., "abc123_a" -> "A")
          const label = problemId.split('_').pop().toUpperCase();

          problemMap[problemId] = {
            label,
            name: sub.problem_name,
            url: sub.problem_url,
            solved: false,
            solvedDuringContest: false,
            upsolve: false,
            attempted: false,
            attemptedDuringContest: false,
            submissions: [],
          };
        }

        problemMap[problemId].submissions.push(sub);
        problemMap[problemId].attempted = true;

        // Check if this attempt was during the contest
        if (subTime <= contestEnd) {
          problemMap[problemId].attemptedDuringContest = true;
        }

        if (sub.verdict === 'AC') {
          problemMap[problemId].solved = true;
          // Check if solved during contest or after (upsolve)
          // Priority: solvedDuringContest > upsolve (if solved during contest, don't mark as upsolve)
          if (subTime <= contestEnd) {
            problemMap[problemId].solvedDuringContest = true;
            // If we already marked it as upsolve but now found an earlier AC during contest, remove upsolve flag
            problemMap[problemId].upsolve = false;
          } else if (!problemMap[problemId].solvedDuringContest) {
            // Only mark as upsolve if not already solved during contest
            problemMap[problemId].upsolve = true;
          }
        }
      });

      // Add unattempted problems from the contest problem list
      contestProblems.forEach((cp) => {
        if (!problemMap[cp.id]) {
          const label = cp.id.split('_').pop().toUpperCase();
          problemMap[cp.id] = {
            label,
            name: cp.name,
            url: cp.url,
            solved: false,
            solvedDuringContest: false,
            upsolve: false,
            attempted: false,
            attemptedDuringContest: false,
            submissions: [],
          };
        }
      });

      // Convert to array and sort by label (A, B, C, ...)
      const problems = Object.values(problemMap).sort((a, b) =>
        a.label.localeCompare(b.label)
      );

      const solvedCount = problems.filter((p) => p.solvedDuringContest).length;
      const upsolveCount = problems.filter(
        (p) => p.upsolve && !p.solvedDuringContest
      ).length;
      const attemptedCount = problems.filter((p) => p.attempted).length;
      const totalProblems = problems.length;
      enrichedContests.push({
        ...contest,
        problems,
        solved: solvedCount,
        upsolves: upsolveCount,
        totalProblems,
      });
    }

    return enrichedContests;
  }

  mapVerdict(result) {
    const map = {
      AC: 'AC',
      WA: 'WA',
      TLE: 'TLE',
      MLE: 'MLE',
      RE: 'RE',
      CE: 'CE',
    };
    return map[result] || 'WA';
  }

  mapDifficultyTier(point) {
    if (point <= 100) return 'easy';
    if (point <= 300) return 'medium';
    if (point <= 500) return 'hard';
    return 'expert';
  }

  async getCache(key) {
    const { data } = await supabaseAdmin
      .from('api_cache')
      .select('cache_value')
      .eq('cache_key', key)
      .gt('expires_at', new Date().toISOString())
      .single();
    return data?.cache_value;
  }

  async setCache(key, value, ttlSeconds) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    await supabaseAdmin.from('api_cache').upsert({
      cache_key: key,
      cache_value: value,
      expires_at: expiresAt,
    });
  }
}
