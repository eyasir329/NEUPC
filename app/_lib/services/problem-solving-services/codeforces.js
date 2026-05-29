/**
 * @file codeforces — split from the problem-solving-services module.
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

// ============================================
// CODEFORCES SERVICE
// ============================================
export class CodeforcesService {
  constructor() {
    this.baseUrl = 'https://codeforces.com/api';
  }

  async getUserInfo(handle) {
    const cacheKey = `cf_user_${handle}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    const response = await fetchWithTimeout(
      `${this.baseUrl}/user.info?handles=${handle}`
    );
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Codeforces API error: ${data.comment}`);
    }

    await this.setCache(cacheKey, data.result[0], 300);
    return data.result[0];
  }

  async getSubmissions(handle, fromTimestamp = null) {
    const cacheKey = `cf_subs_${handle}_${fromTimestamp || 'all'}`;
    const cached = await this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch ALL submissions by paginating (Codeforces API returns max 10000 per call)
    let allSubmissions = [];
    let from = 1;
    let hasMore = true;
    let iterations = 0;
    const MAX_ITERATIONS = 100; // Safety limit to prevent infinite loops (1M submissions max)
    const BATCH_SIZE = 10000; // Fetch 10000 per request for efficiency

    while (hasMore && iterations < MAX_ITERATIONS) {
      iterations++;
      const url = `${this.baseUrl}/user.status?handle=${handle}&from=${from}&count=${BATCH_SIZE}`;
      try {
        const response = await fetchWithTimeout(url, {}, 60000, 3, 3000);
        const data = await response.json();

        if (data.status !== 'OK') {
          console.warn(`[CF] API error for ${handle}: ${data.comment}`);
          hasMore = false;
          break;
        }

        if (!data.result || data.result.length === 0) {
          hasMore = false;
          break;
        }
        const submissions = data.result.map((sub) => ({
          submission_id: sub.id.toString(),
          problem_id: `${sub.problem.contestId}${sub.problem.index}`,
          problem_name: sub.problem.name,
          problem_url: `https://codeforces.com/problemset/problem/${sub.problem.contestId}/${sub.problem.index}`,
          contest_id: sub.problem.contestId?.toString(),
          verdict: this.mapVerdict(sub.verdict),
          language: sub.programmingLanguage,
          execution_time_ms: sub.timeConsumedMillis,
          memory_kb: Math.round(sub.memoryConsumedBytes / 1024),
          submitted_at: new Date(sub.creationTimeSeconds * 1000).toISOString(),
          difficulty_rating: sub.problem.rating,
          tags: sub.problem.tags,
        }));

        allSubmissions = allSubmissions.concat(submissions);

        // Check if we fetched older submissions than fromTimestamp to break early
        if (fromTimestamp && submissions.length > 0) {
          const oldestSub = submissions[submissions.length - 1];
          if (new Date(oldestSub.submitted_at) <= new Date(fromTimestamp)) {
            hasMore = false;
            break;
          }
        }

        // If we got less than BATCH_SIZE, we've reached the end
        if (data.result.length < BATCH_SIZE) {
          hasMore = false;
        } else {
          from += BATCH_SIZE;
          // Add delay to respect Codeforces rate limits (5 requests per minute)
          await new Promise((resolve) => setTimeout(resolve, 12000)); // 12 seconds between requests
        }
      } catch (error) {
        console.error(
          `[CF] Error fetching submissions from ${from}:`,
          error.message
        );
        // If we've already fetched some submissions, return what we have
        // Otherwise, throw the error
        if (allSubmissions.length > 0) {
          console.warn(
            `[CF] Returning ${allSubmissions.length} submissions fetched before error`
          );
          hasMore = false;
        } else {
          throw error;
        }
      }
    }

    if (iterations >= MAX_ITERATIONS) {
      console.warn(
        `[CF] Reached maximum iterations (${MAX_ITERATIONS}) for ${handle}, returning ${allSubmissions.length} submissions`
      );
    }

    const filtered = fromTimestamp
      ? allSubmissions.filter(
          (s) => new Date(s.submitted_at) > new Date(fromTimestamp)
        )
      : allSubmissions;
    await this.setCache(cacheKey, filtered, 60);
    return filtered;
  }

  async getRatingHistory(handle) {
    const cacheKey = `cf_rating_${handle}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    const response = await fetchWithTimeout(
      `${this.baseUrl}/user.rating?handle=${handle}`
    );
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Codeforces API error: ${data.comment}`);
    }

    const contests = data.result.map((contest) => ({
      contest_id: contest.contestId.toString(),
      contest_name: contest.contestName,
      contest_url: `https://codeforces.com/contest/${contest.contestId}`,
      rank: contest.rank,
      old_rating: contest.oldRating,
      new_rating: contest.newRating,
      rating_change: contest.newRating - contest.oldRating,
      contest_date: new Date(
        contest.ratingUpdateTimeSeconds * 1000
      ).toISOString(),
    }));

    await this.setCache(cacheKey, contests, 3600);
    return contests;
  }

  mapVerdict(verdict) {
    const map = {
      OK: 'AC',
      WRONG_ANSWER: 'WA',
      TIME_LIMIT_EXCEEDED: 'TLE',
      MEMORY_LIMIT_EXCEEDED: 'MLE',
      RUNTIME_ERROR: 'RE',
      COMPILATION_ERROR: 'CE',
      PARTIAL: 'PARTIAL',
    };
    return map[verdict] || 'PENDING';
  }

  /**
   * Fetch contest problems from Codeforces API
   * @param {string} contestId - Codeforces contest ID
   * @returns {Array} - Array of problem objects with index, name, url
   */
  async getContestProblems(contestId) {
    const cacheKey = `cf_contest_problems_${contestId}`;
    const cached = await this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `${this.baseUrl}/contest.standings?contestId=${contestId}&from=1&count=1`;
      const response = await fetchWithTimeout(url, {}, 30000, 2, 3000);
      const data = await response.json();

      if (data.status !== 'OK' || !data.result?.problems) {
        console.warn(`[CF] Could not fetch problems for contest ${contestId}`);
        return [];
      }

      const problems = data.result.problems.map((p) => ({
        index: p.index,
        name: p.name,
        url: `https://codeforces.com/contest/${contestId}/problem/${p.index}`,
        rating: p.rating,
        tags: p.tags,
      }));

      // Cache for 7 days (contest problems don't change)
      await this.setCache(cacheKey, problems, 7 * 24 * 60 * 60);
      return problems;
    } catch (error) {
      console.error(
        `[CF] Error fetching contest problems for ${contestId}:`,
        error.message
      );
      return [];
    }
  }

  /**
   * Get contest timing info from Codeforces API
   * Returns startTimeSeconds and durationSeconds for accurate upsolve detection
   * @param {string} contestId - Codeforces contest ID
   * @returns {Object|null} - { startTime: Date, endTime: Date, durationMinutes: number } or null
   */
  async getContestTiming(contestId) {
    const cacheKey = `cf_contest_timing_${contestId}`;
    const cached = await this.getCache(cacheKey);
    if (cached) {
      return {
        startTime: new Date(cached.startTime),
        endTime: new Date(cached.endTime),
        durationMinutes: cached.durationMinutes,
      };
    }

    try {
      const url = `${this.baseUrl}/contest.standings?contestId=${contestId}&from=1&count=1`;
      const response = await fetchWithTimeout(url, {}, 30000, 2, 3000);
      const data = await response.json();

      if (data.status !== 'OK' || !data.result?.contest) {
        console.warn(`[CF] Could not fetch timing for contest ${contestId}`);
        return null;
      }

      const contest = data.result.contest;
      const startTime = new Date(contest.startTimeSeconds * 1000);
      const durationMinutes = Math.floor(contest.durationSeconds / 60);
      const endTime = new Date(
        startTime.getTime() + contest.durationSeconds * 1000
      );

      const result = {
        startTime,
        endTime,
        durationMinutes,
      };

      // Cache for 30 days (contest timing doesn't change)
      await this.setCache(
        cacheKey,
        {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMinutes,
        },
        30 * 24 * 60 * 60
      );
      return result;
    } catch (error) {
      console.error(
        `[CF] Error fetching contest timing for ${contestId}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Get total participants for a Codeforces contest
   * First tries contest.ratingChanges API (for rated contests)
   * Falls back to contest.standings API (for unrated/educational contests)
   * @param {string} contestId - Codeforces contest ID
   * @returns {number|null} - Total participants count or null if unavailable
   */
  async getContestParticipantCount(contestId) {
    const cacheKey = `cf_contest_participants_${contestId}`;
    const cached = await this.getCache(cacheKey);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    try {
      // First try ratingChanges API (faster, works for rated contests)
      const ratingUrl = `${this.baseUrl}/contest.ratingChanges?contestId=${contestId}`;
      const ratingResponse = await fetchWithTimeout(
        ratingUrl,
        {},
        30000,
        2,
        3000
      );
      const ratingData = await ratingResponse.json();

      if (ratingData.status === 'OK' && ratingData.result) {
        const count = ratingData.result.length;
        // Cache for 7 days (historical contest data doesn't change)
        await this.setCache(cacheKey, count, 7 * 24 * 60 * 60);
        return count;
      }

      // Fallback to standings API for unrated contests (educational, div3/4, etc.)
      const standingsUrl = `${this.baseUrl}/contest.standings?contestId=${contestId}&from=1&count=100000&showUnofficial=false`;
      const standingsResponse = await fetchWithTimeout(
        standingsUrl,
        {},
        60000,
        2,
        3000
      );
      const standingsData = await standingsResponse.json();

      if (standingsData.status === 'OK' && standingsData.result?.rows) {
        const count = standingsData.result.rows.length;
        // Cache for 7 days
        await this.setCache(cacheKey, count, 7 * 24 * 60 * 60);
        return count;
      }

      console.warn(
        `[CF] Could not fetch participant count for contest ${contestId} from any API`
      );
      return null;
    } catch (error) {
      console.error(
        `[CF] Error fetching participant count for ${contestId}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Get total participants for multiple Codeforces contests in batch
   * @param {Array<string>} contestIds - Array of Codeforces contest IDs
   * @returns {Object} - Map of contestId -> participantCount
   */
  async getContestParticipantCounts(contestIds) {
    const results = {};
    const uncachedIds = [];

    // Check cache first
    for (const contestId of contestIds) {
      const cacheKey = `cf_contest_participants_${contestId}`;
      const cached = await this.getCache(cacheKey);
      if (cached !== null && cached !== undefined) {
        results[contestId] = cached;
      } else {
        uncachedIds.push(contestId);
      }
    }

    // Fetch uncached contest participant counts
    // Note: We need to fetch one at a time due to CF API limitations
    // Add delays to respect rate limits (may make 2 API calls per contest for unrated ones)
    for (let i = 0; i < uncachedIds.length; i++) {
      const contestId = uncachedIds[i];
      const count = await this.getContestParticipantCount(contestId);
      if (count !== null) {
        results[contestId] = count;
      }
      // Add delay between contests to respect CF rate limits
      // Longer delay since getContestParticipantCount may make up to 2 requests
      if (i < uncachedIds.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  /**
   * Enrich contests with problem-level data from submissions
   * Includes ALL problems (solved, attempted, unattempted) and tracks upsolves
   * @param {Array} contests - Array of contest objects from CLIST
   * @param {string} handle - Codeforces handle
   * @returns {Array} - Contests enriched with problems array
   */
  async enrichContestsWithProblems(contests, handle) {
    if (!contests || contests.length === 0) return contests;
    // Fetch all submissions for this user
    const submissions = await this.getSubmissions(handle);
    // Group submissions by contest_id
    const submissionsByContest = {};
    submissions.forEach((sub) => {
      if (!sub.contest_id) return;
      if (!submissionsByContest[sub.contest_id]) {
        submissionsByContest[sub.contest_id] = [];
      }
      submissionsByContest[sub.contest_id].push(sub);
    });
    // Debug: Log sample of submission contest IDs
    const submissionContestIds = Object.keys(submissionsByContest).slice(0, 10);
    // Debug: Log sample of contest IDs we're trying to match
    const contestIds = contests
      .slice(0, 5)
      .map((c) => `${c.contestId}(p:${c.platformContestId})`);
    // Enrich each contest (process sequentially to respect rate limits)
    const enrichedContests = [];
    for (const contest of contests) {
      // Use platformContestId for matching with submissions (falls back to contestId if not set)
      const matchId = contest.platformContestId || contest.contestId;
      const contestSubs = submissionsByContest[matchId] || [];

      // Debug: Log contest ID matching info
      // Get accurate contest timing from Codeforces API
      // This is critical for correctly detecting solvedDuringContest vs upsolve
      const contestTiming = await this.getContestTiming(matchId);

      let contestStart, contestEnd;
      if (contestTiming) {
        // Use accurate timing from Codeforces API
        contestStart = contestTiming.startTime;
        contestEnd = contestTiming.endTime;
      } else if (contest.endDate) {
        // Fallback: Use explicit end date from CLIST if available
        contestStart = new Date(contest.date);
        contestEnd = new Date(contest.endDate);
      } else {
        // Last fallback: Use durationMinutes from CLIST, or duration field, or default 3 hours
        contestStart = new Date(contest.date);
        const durationMs =
          (contest.durationMinutes || contest.duration || 180) * 60 * 1000;
        contestEnd = new Date(contestStart.getTime() + durationMs);
      }

      // Fetch ALL problems for this contest from Codeforces API
      const contestProblems = await this.getContestProblems(matchId);

      // Build problem map from user's submissions
      const problemMap = {};
      contestSubs.forEach((sub) => {
        const problemIndex = sub.problem_id.replace(matchId, '');
        const subTime = new Date(sub.submitted_at);

        if (!problemMap[problemIndex]) {
          problemMap[problemIndex] = {
            label: problemIndex,
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

        problemMap[problemIndex].submissions.push(sub);
        problemMap[problemIndex].attempted = true;

        // Check if this attempt was during the contest
        if (subTime <= contestEnd) {
          problemMap[problemIndex].attemptedDuringContest = true;
        }

        if (sub.verdict === 'AC') {
          problemMap[problemIndex].solved = true;
          // Check if solved during contest or after (upsolve)
          // Priority: solvedDuringContest > upsolve (if solved during contest, don't mark as upsolve)
          if (subTime <= contestEnd) {
            problemMap[problemIndex].solvedDuringContest = true;
            // If we already marked it as upsolve but now found an earlier AC during contest, remove upsolve flag
            problemMap[problemIndex].upsolve = false;
          } else if (!problemMap[problemIndex].solvedDuringContest) {
            // Only mark as upsolve if not already solved during contest
            problemMap[problemIndex].upsolve = true;
          }
        }
      });

      // Add unattempted problems from the contest problem list
      contestProblems.forEach((cp) => {
        if (!problemMap[cp.index]) {
          problemMap[cp.index] = {
            label: cp.index,
            name: cp.name,
            url: cp.url,
            solved: false,
            solvedDuringContest: false,
            upsolve: false,
            attempted: false,
            attemptedDuringContest: false,
            submissions: [],
            rating: cp.rating,
            tags: cp.tags,
          };
        } else {
          // Update existing problem with additional data
          problemMap[cp.index].rating = cp.rating;
          problemMap[cp.index].tags = cp.tags;
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
      // Add delay between contests to respect Codeforces rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));

      enrichedContests.push({
        ...contest,
        problems,
        solved: solvedCount,
        upsolves: upsolveCount,
        totalProblems,
        // Include accurate timing data for database storage
        endDate: contestEnd.toISOString(),
        durationMinutes:
          contestTiming?.durationMinutes ||
          contest.durationMinutes ||
          Math.round((contestEnd - contestStart) / 60000),
      });
    }

    return enrichedContests;
  }

  mapDifficultyTier(rating) {
    if (!rating) return 'medium';
    if (rating < 1200) return 'easy';
    if (rating < 1600) return 'medium';
    if (rating < 2100) return 'hard';
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
