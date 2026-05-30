/**
 * @file clist — split from the problem-solving-services module.
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
  CLIST_NETWORK_COOLDOWN_MS,
  NetworkError,
  clistRateLimiter,
  fetchWithTimeout,
} from './_shared';
import { AtCoderService } from './atcoder';
import { CodeChefService } from './codechef';
import { CodeforcesService } from './codeforces';
import { LeetCodeService } from './leetcode';

// ============================================
// CLIST SERVICE - Unified API for all platforms
// ============================================

/**
 * ClistService fetches competitive programming stats from clist.by API
 * This provides unified access to rating history, contest stats, and account info
 * across multiple platforms (Codeforces, AtCoder, LeetCode, CodeChef, etc.)
 *
 * API Docs: https://clist.by/api/v4/doc/
 * Rate limit: 10 requests per minute (standard)
 */
export class ClistService {
  constructor() {
    this.baseUrl = 'https://clist.by/api/v4';
    this.apiKey = process.env.CLIST_API_KEY;
    this.apiUsername = process.env.CLIST_API_USERNAME;

    // Map our platform IDs to clist resource IDs/hosts
    this.platformMap = {
      codeforces: 'codeforces.com',
      atcoder: 'atcoder.jp',
      leetcode: 'leetcode.com',
      codechef: 'codechef.com',
      topcoder: 'topcoder.com',
      hackerrank: 'hackerrank.com',
      hackerearth: 'hackerearth.com',
      csacademy: 'csacademy.com',
      toph: 'toph.co',
      eolymp: 'eolymp.com',
      dmoj: 'dmoj.ca',
      kattis: 'open.kattis.com',
      spoj: 'spoj.com',
      cses: 'cses.fi',
      cfgym: 'codeforces.com/gyms',
      // Group 1: Fix existing platform definitions
      lightoj: 'lightoj.com',
      uva: 'uva.onlinejudge.org',
      usaco: 'usaco.org',
      // Group 2: Major global platforms
      googlecodejam: 'codingcompetitions.withgoogle.com',
      facebookhackercup: 'facebook.com/hackercup',
      geeksforgeeks: 'geeksforgeeks.org',
      codingame: 'codingame.com',
      beecrowd: 'beecrowd.com.br',
      // Group 3: Regional/national platforms
      luogu: 'luogu.com.cn',
      nowcoder: 'ac.nowcoder.com',
      codedrills: 'codedrills.io',
      yandex: 'contest.yandex.ru',
      nerc: 'nerc.itmo.ru/archive',
      tlx: 'tlx.toki.id',
      yukicoder: 'yukicoder.me',
      acmp: 'acmp.ru',
      timus: 'acm.timus.ru',
      hsin: 'hsin.hr/coci',
      // Group 4: Classic/educational platforms
      ioi: 'ioinformatics.org',
      algotester: 'algotester.com',
      cphof: 'cphof.org',
      opencup: 'opencup.ru',
      robocontest: 'robocontest.uz',
      ucup: 'ucup.ac',
      acmu: 'acm.university',
    };
  }

  /**
   * Check if clist API credentials are configured
   */
  isConfigured() {
    return !!(this.apiKey && this.apiUsername);
  }

  /**
   * Get authorization header for clist API
   */
  getAuthHeader() {
    if (!this.isConfigured()) {
      return {};
    }
    // clist.by uses ApiKey authorization format: "ApiKey username:api_key"
    return {
      Authorization: `ApiKey ${this.apiUsername}:${this.apiKey}`,
    };
  }

  /**
   * Make authenticated request to clist API with rate limiting and retry logic
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {number} maxRetries - Maximum retry attempts for rate limit errors (default 3)
   */
  async fetchApi(endpoint, params = {}, maxRetries = 3) {
    if (!this.isConfigured()) {
      console.warn(
        'CLIST API not configured. Set CLIST_API_KEY and CLIST_API_USERNAME'
      );
      return null;
    }

    const now = Date.now();
    if (clistNetworkUnavailableUntil > now) {
      if (now - clistLastCooldownWarnAt > 15000) {
        const remainingMs = clistNetworkUnavailableUntil - now;
        console.warn(
          `[CLIST] Skipping ${endpoint} call due to recent network outage (${Math.ceil(
            remainingMs / 1000
          )}s cooldown remaining)`
        );
        clistLastCooldownWarnAt = now;
      }
      return null;
    }

    const cacheKey = `clist_${endpoint}_${JSON.stringify(params)}`;
    const cached = await this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Add format=json to params
    const allParams = { ...params, format: 'json' };
    const queryParams = new URLSearchParams(allParams).toString();
    const url = `${this.baseUrl}/${endpoint}/?${queryParams}`;

    // Use the request queue to handle concurrent requests properly
    return await clistRateLimiter.enqueueRequest(async () => {
      let lastError = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const queueStatus = clistRateLimiter.getQueueStatus();
          const isAccountLookup = endpoint === 'account';
          const response = await fetchWithTimeout(
            url,
            {
              headers: {
                ...this.getAuthHeader(),
                Accept: 'application/json',
              },
            },
            isAccountLookup ? 10000 : 30000, // Account lookup should fail fast on network issues
            isAccountLookup ? 1 : 3, // Avoid long blocks for account discovery
            isAccountLookup ? 1000 : 2000 // 2s delay between network retries
          );

          if (response.ok) {
            const data = await response.json();
            await this.setCache(cacheKey, data, 1800); // Cache for 30 minutes
            return data;
          }

          // Handle specific error codes
          if (response.status === 401) {
            console.error('CLIST API: Invalid credentials');
            throw new Error('CLIST API: Invalid credentials');
          }

          if (response.status === 429) {
            console.warn(
              `CLIST API: Rate limit hit on attempt ${attempt}/${maxRetries}`
            );
            lastError = new Error('CLIST API: Rate limit exceeded');

            if (attempt < maxRetries) {
              // Exponential backoff: 30s, 60s, 120s
              const backoffDelay = 30000 * Math.pow(2, attempt - 1);
              await new Promise((resolve) => setTimeout(resolve, backoffDelay));
              continue;
            }
          } else {
            const errorText = await response
              .text()
              .catch(() => 'No error body');
            console.error(
              `CLIST API error: ${response.status} ${response.statusText}`
            );
            console.error(`CLIST API error body: ${errorText}`);
            throw new Error(`CLIST API error: ${response.status}`);
          }
        } catch (error) {
          lastError = error;
          const message = String(error?.message || '');
          const isNetworkFailure =
            /\[NetworkError\]|network connection failed|enotfound|econnreset|econnrefused|etimedout|request timeout/i.test(
              message
            );

          if (isNetworkFailure) {
            clistNetworkUnavailableUntil =
              Date.now() + CLIST_NETWORK_COOLDOWN_MS;
            clistLastCooldownWarnAt = 0;
            console.warn(
              `[CLIST] Network outage detected; entering cooldown for ${Math.round(
                CLIST_NETWORK_COOLDOWN_MS / 1000
              )}s`
            );
          }

          if (error.message.includes('Rate limit') && attempt < maxRetries) {
            // Already handled above, continue to next attempt
            continue;
          }
          console.error(
            `CLIST API fetch error for ${endpoint}:`,
            error.message
          );
          console.error('CLIST API params:', params);

          // Don't retry on non-rate-limit errors
          if (!error.message.includes('Rate limit')) {
            return null;
          }
        }
      }

      console.error(
        `CLIST API: All ${maxRetries} attempts failed for ${endpoint}`
      );
      return null;
    }); // End of enqueueRequest callback
  }

  /**
   * Get clist resource host for a platform
   */
  getClistHost(platform) {
    return this.platformMap[platform] || null;
  }

  /**
   * Get ordered CLIST resource host candidates for a platform.
   * FBHC can appear under multiple resource slugs depending on CLIST ingestion.
   */
  getClistHosts(platform) {
    const primary = this.getClistHost(platform);
    if (!primary) return [];

    if (platform !== 'facebookhackercup') {
      return [primary];
    }

    return Array.from(
      new Set([
        primary,
        'facebook.com/codingcompetitions/hacker-cup',
        'facebook.com/codingcompetitions',
        'www.facebook.com/codingcompetitions/hacker-cup',
        'www.facebook.com/codingcompetitions',
      ])
    );
  }

  /**
   * Find account ID on clist for a given handle and platform
   * Returns the account object with id, handle, rating, etc.
   * Tries multiple search methods to handle variations
   */
  async findAccount(platform, handle, userId = null) {
    const isFbhc = platform === 'facebookhackercup';
    const accountLookupRetries = isFbhc ? 1 : 2;

    // If userId provided, check cache first
    if (userId) {
      try {
        const { supabaseAdmin } =
          await import('@/app/_lib/integrations/supabase');
        const { getPlatformId } =
          await import('@/app/_lib/services/problem-solving-v2-helpers');

        const platformId = await getPlatformId(platform);
        if (platformId) {
          const { data: userHandle } = await supabaseAdmin
            .from('user_handles')
            .select('clist_account_id')
            .eq('user_id', userId)
            .eq('platform_id', platformId)
            .eq('handle', handle)
            .single();

          if (userHandle?.clist_account_id) {
            // Fetch the account details using the cached ID
            const data = await this.fetchApi(
              'account',
              {
                id: userHandle.clist_account_id,
                limit: 1,
              },
              accountLookupRetries
            );
            if (data?.objects?.length > 0) {
              return data.objects[0];
            }
          }
        }
      } catch (error) {
        console.warn(
          `CLIST: Cache lookup failed for ${handle}:`,
          error.message
        );
      }
    }

    const hosts = this.getClistHosts(platform);
    if (hosts.length === 0) {
      console.warn(`CLIST: No host mapping for platform ${platform}`);
      return null;
    }
    for (const host of hosts) {
      // Method 1: Exact handle match
      let data = await this.fetchApi(
        'account',
        {
          resource: host,
          handle: handle,
          limit: 1,
        },
        accountLookupRetries
      );

      if (data?.objects?.length > 0) {
        await this.cacheAccountId(userId, platform, handle, data.objects[0].id);
        return data.objects[0];
      }

      // Method 2 removed: CLIST account API does not support handle__icontains.
      // Keep lookups deterministic to avoid false-positive account matches.
    }

    // Method 3 removed: broad unfiltered scans are expensive and may cause false matches.

    console.warn(
      `CLIST: No account found for ${handle} on ${platform} after all search methods`
    );
    return null;
  }

  /**
   * Cache CLIST account ID in user_handles table
   * @private
   */
  async cacheAccountId(userId, platform, handle, accountId) {
    if (!userId || !accountId) return;

    try {
      const { supabaseAdmin } =
        await import('@/app/_lib/integrations/supabase');
      const { getPlatformId } =
        await import('@/app/_lib/services/problem-solving-v2-helpers');

      const platformId = await getPlatformId(platform);
      if (!platformId) return;

      const { error } = await supabaseAdmin
        .from('user_handles')
        .update({ clist_account_id: accountId })
        .eq('user_id', userId)
        .eq('platform_id', platformId)
        .eq('handle', handle);

      if (error) {
        console.warn(
          `CLIST: Failed to cache account ID for ${handle}:`,
          error.message
        );
      } else {
      }
    } catch (error) {
      console.warn(`CLIST: Cache update failed for ${handle}:`, error.message);
    }
  }

  /**
   * Get account statistics from clist
   * Returns rating, n_contests, last_activity, etc.
   */
  async getAccountStats(platform, handle, userId = null) {
    const account = await this.findAccount(platform, handle, userId);
    if (!account) return null;

    return {
      id: account.id,
      handle: account.handle,
      name: account.name,
      rating: account.rating,
      n_contests: account.n_contests,
      resource: account.resource,
      resource_id: account.resource_id,
      last_activity: account.last_activity,
      created: account.created,
      url: account.url,
    };
  }

  /**
   * Get contest statistics (participation history) for a handle
   * This is the key method for getting rating history
   * Note: Statistics endpoint requires account_id, so we first fetch the account
   * @param {string} platform - Platform name
   * @param {string} handle - User handle
   * @param {number} limit - Max results (default: 10000 to fetch ALL contests)
   * @param {string} userId - Optional user ID for caching CLIST account ID
   */
  async getContestStatistics(platform, handle, limit = 10000, userId = null) {
    const hosts = this.getClistHosts(platform);
    if (hosts.length === 0) {
      console.warn(`CLIST: No host mapping for platform ${platform}`);
      return [];
    }

    const baseStatsParams = {
      order_by: '-date',
      with_problems: true,
      limit: limit,
    };

    // First, get the account to obtain account_id (required by statistics endpoint)
    const account = await this.findAccount(platform, handle, userId);
    if (!account?.id) {
      console.warn(
        `CLIST: Could not find account for ${handle} on ${platform}`
      );
      return [];
    }

    const data = await this.fetchApi('statistics', {
      account_id: account.id,
      ...baseStatsParams,
    });

    if (!data?.objects) {
      console.warn(
        `CLIST: No contest statistics found for ${handle} on ${platform}`
      );
      return [];
    }

    return data.objects.map((stat) => {
      const contestId = stat.contest_id?.toString();
      const contestName =
        stat.contest?.title ||
        stat.contest_title ||
        (contestId ? `Contest #${contestId}` : null);

      // Extract total problems from CLIST problems field or contest data
      let totalProblems = null;
      if (stat.problems && typeof stat.problems === 'object') {
        totalProblems = Object.keys(stat.problems).length;
      } else if (stat.addition?.problems) {
        totalProblems = Object.keys(stat.addition.problems).length;
      } else if (stat.contest?.n_problems) {
        totalProblems = stat.contest.n_problems;
      }

      // Extract problems data. CLIST may return it either at top-level `problems`
      // or under `addition.problems` depending on resource/contest.
      let problems = null;
      const rawProblems =
        stat.problems && typeof stat.problems === 'object'
          ? stat.problems
          : stat.addition?.problems &&
              typeof stat.addition.problems === 'object'
            ? stat.addition.problems
            : null;

      if (rawProblems && typeof rawProblems === 'object') {
        problems = Object.entries(rawProblems).map(([key, value]) => {
          const isSolved = value?.result?.includes('+') || false;
          return {
            label: key,
            solved: isSolved,
            // CLIST data is from contest standings, so if solved, it was during contest
            solvedDuringContest: isSolved,
            upsolve: false, // CLIST doesn't track upsolves
            attempted: value?.result ? true : false,
            result: value?.result,
            time: value?.time,
            url: value?.url,
            name: value?.name || value?.short,
          };
        });
      }

      // If we have totalProblems but problems array is smaller, add unattempted placeholders
      // This ensures all problem badges are shown (green for solved, gray for unattempted)
      if (totalProblems && problems && problems.length < totalProblems) {
        const existingLabels = new Set(problems.map((p) => p.label));
        // Generate labels for missing problems (A, B, C, ... or 1, 2, 3, ...)
        const isNumeric =
          problems.length > 0 && /^\d+$/.test(problems[0].label);
        for (let i = problems.length; i < totalProblems; i++) {
          let label;
          if (isNumeric) {
            label = (i + 1).toString();
          } else {
            // Generate letter labels: A, B, C, ... Z, A1, B1, ...
            label =
              String.fromCharCode(65 + (i % 26)) +
              (i >= 26 ? Math.floor(i / 26).toString() : '');
          }
          if (!existingLabels.has(label)) {
            problems.push({
              label,
              solved: false,
              solvedDuringContest: false,
              upsolve: false,
              attempted: false,
            });
          }
        }
        // Sort problems by label
        problems.sort((a, b) =>
          a.label.localeCompare(b.label, undefined, { numeric: true })
        );
      }

      // Debug: Log problem extraction for non-CF platforms
      if (platform !== 'codeforces') {
      }

      // Extract platform-specific contest ID from URL
      const contestUrl = stat.contest?.url;
      let platformContestId = null;
      if (contestUrl && platform === 'codeforces') {
        const match = contestUrl.match(/\/contests?\/(\d+)/);
        if (match) {
          platformContestId = match[1];
        }
      } else if (contestUrl && platform === 'atcoder') {
        const match = contestUrl.match(/\/contests\/([^/]+)/);
        if (match) {
          platformContestId = match[1];
        }
      } else if (contestUrl && platform === 'codechef') {
        // CodeChef URLs are like: https://www.codechef.com/START142 or https://www.codechef.com/APRIL20
        const match = contestUrl.match(/codechef\.com\/([A-Z0-9]+)/i);
        if (match) {
          platformContestId = match[1].toUpperCase();
        }
      }

      // Calculate contest duration in minutes from start/end times
      let durationMinutes = null;
      if (stat.contest?.start && stat.contest?.end) {
        const startTime = new Date(stat.contest.start).getTime();
        const endTime = new Date(stat.contest.end).getTime();
        if (!isNaN(startTime) && !isNaN(endTime) && endTime > startTime) {
          durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
        }
      }

      // Extract penalty from addition field (common in ICPC-style contests)
      const penalty = stat.addition?.penalty || stat.penalty || null;

      // Calculate problems attempted from problems data
      let problemsAttempted = null;
      if (problems && problems.length > 0) {
        problemsAttempted = problems.filter((p) => p.attempted).length;
      }

      // Determine if this is a virtual participation
      const isVirtual =
        stat.addition?.is_virtual ||
        stat.is_virtual ||
        stat.addition?.participationType === 'VIRTUAL' ||
        false;

      // Extract division info if available
      const division =
        stat.addition?.division ||
        stat.contest?.title?.match(/Div\.\s*(\d+)/i)?.[0] ||
        null;

      return {
        contestId,
        contestName,
        contestUrl,
        platformContestId,
        date: stat.contest?.start || stat.date,
        endDate: stat.contest?.end,
        platform: platform,
        rank: stat.place,
        totalParticipants: stat.contest?.n_statistics,
        score: stat.score || stat.solving || null,
        solved: stat.solved,
        totalProblems,
        problems,
        problemsAttempted,
        durationMinutes,
        penalty,
        oldRating: stat.old_rating,
        newRating: stat.new_rating || stat.rating,
        ratingChange:
          stat.new_rating && stat.old_rating
            ? stat.new_rating - stat.old_rating
            : stat.rating_change,
        isRated: stat.new_rating != null || stat.rating != null,
        isVirtual,
        division,
        addition: stat.addition, // Contains extra platform-specific data
      };
    });
  }

  /**
   * Get rating history derived from contest statistics
   * Falls back to platform-specific APIs when CLIST fails
   */
  async getRatingHistory(platform, handle, userId = null) {
    let stats = await this.getContestStatistics(
      platform,
      handle,
      10000,
      userId
    );
    // If CLIST returns no stats, try platform-specific APIs as fallback
    if (stats.length === 0) {
      try {
        // Codeforces fallback
        if (platform === 'codeforces') {
          const cfService = new CodeforcesService();
          const ratingHistory = await cfService.getRatingHistory(handle);

          if (ratingHistory.length > 0) {
            return ratingHistory.map((entry) => ({
              platform: 'codeforces',
              date: entry.contest_date,
              rating: entry.new_rating,
              change: entry.rating_change,
              contestId: entry.contest_id,
              contestName: entry.contest_name,
              url: entry.contest_url,
              rank: entry.rank,
            }));
          }
        }

        // AtCoder fallback
        if (platform === 'atcoder') {
          const atService = new AtCoderService();
          const ratingHistory = await atService.getRatingHistory(handle);

          if (ratingHistory.length > 0) {
            return ratingHistory.map((entry) => ({
              platform: 'atcoder',
              date: entry.date,
              rating: entry.new_rating,
              change: entry.rating_change,
              contestId: entry.contest_id,
              contestName: entry.contest_name,
              url: `https://atcoder.jp/contests/${entry.contest_id}`,
              rank: entry.rank,
            }));
          }
        }

        // LeetCode fallback
        if (platform === 'leetcode') {
          const leetcodeService = new LeetCodeService();
          const contestData = await leetcodeService.getContestRanking(handle);

          if (contestData.contests && contestData.contests.length > 0) {
            // Transform LeetCode contest data to match expected format
            return contestData.contests
              .filter((c) => c.rating && c.rating > 0)
              .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
              .map((c, idx, arr) => {
                const prevRating = idx > 0 ? arr[idx - 1].rating : 0;
                return {
                  platform: 'leetcode',
                  date: c.startTime,
                  rating: Math.round(c.rating),
                  change: idx > 0 ? Math.round(c.rating - prevRating) : 0,
                  contestId: c.title?.replace(/\s+/g, '-').toLowerCase(),
                  contestName: c.title,
                  url: `https://leetcode.com/contest/${c.title?.replace(/\s+/g, '-').toLowerCase()}`,
                  rank: c.ranking,
                };
              });
          }
        }
      } catch (error) {
        console.error(
          `[getRatingHistory] ${platform} direct API fallback failed:`,
          error.message
        );
      }
    }

    // Filter to only rated contests (where we have a rating value)
    const ratedContests = stats.filter((s) => {
      const hasRating =
        s.newRating !== null && s.newRating !== undefined && s.newRating !== 0;
      const hasOldRating =
        s.oldRating !== null && s.oldRating !== undefined && s.oldRating !== 0;
      return hasRating || hasOldRating;
    });
    // Sort by date and map to frontend format
    return ratedContests
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((s) => ({
        platform,
        date: s.date,
        rating: s.newRating || s.oldRating,
        change: s.ratingChange || 0,
        contestId: s.contestId,
        contestName: s.contestName,
        url: s.contestUrl,
        rank: s.rank,
      }));
  }

  /**
   * Get contest history with full details
   * Falls back to platform-specific APIs when CLIST fails
   * @param {string} platform - Platform name
   * @param {string} handle - User handle
   * @param {number} limit - Max results (default: 10000 to fetch ALL contests)
   */
  async getContestHistory(platform, handle, limit = 10000, userId = null) {
    let stats = await this.getContestStatistics(
      platform,
      handle,
      limit,
      userId
    );
    // If CLIST returns no stats, try platform-specific APIs as fallback
    if (stats.length === 0) {
      try {
        // Codeforces fallback
        if (platform === 'codeforces') {
          const cfService = new CodeforcesService();
          const ratingHistory = await cfService.getRatingHistory(handle);

          if (ratingHistory.length > 0) {
            return ratingHistory.slice(0, limit).map((entry) => ({
              platform: 'codeforces',
              contestId: entry.contest_id,
              platformContestId: entry.contest_id,
              name: entry.contest_name,
              url: entry.contest_url,
              date: entry.contest_date,
              endDate: null,
              rank: entry.rank,
              totalParticipants: null,
              score: null,
              solved: null,
              totalProblems: null,
              problems: null,
              problemsAttempted: null,
              durationMinutes: null,
              penalty: null,
              ratingChange: entry.rating_change,
              newRating: entry.new_rating,
              oldRating: entry.old_rating,
              isRated: true,
              isVirtual: false,
              division: null,
              addition: null,
            }));
          }
        }

        // AtCoder fallback
        if (platform === 'atcoder') {
          const atService = new AtCoderService();
          const ratingHistory = await atService.getRatingHistory(handle);

          if (ratingHistory.length > 0) {
            return ratingHistory.slice(0, limit).map((entry) => ({
              platform: 'atcoder',
              contestId: entry.contest_id,
              platformContestId: entry.contest_id,
              name: entry.contest_name,
              url: `https://atcoder.jp/contests/${entry.contest_id}`,
              date: entry.date,
              endDate: null,
              rank: entry.rank,
              totalParticipants: null,
              score: null,
              solved: null,
              totalProblems: null,
              problems: null,
              problemsAttempted: null,
              durationMinutes: null,
              penalty: null,
              ratingChange: entry.rating_change,
              newRating: entry.new_rating,
              oldRating: entry.old_rating,
              isRated: entry.is_rated,
              isVirtual: false,
              division: null,
              addition: null,
            }));
          }
        }

        // LeetCode fallback
        if (platform === 'leetcode') {
          const leetcodeService = new LeetCodeService();
          const contestData = await leetcodeService.getContestRanking(handle);
          if (contestData.contests && contestData.contests.length > 0) {
            // Transform LeetCode contest data to match expected format
            return contestData.contests
              .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
              .slice(0, limit)
              .map((c, idx, arr) => {
                const sortedByDate = [...arr].sort(
                  (x, y) => new Date(x.startTime) - new Date(y.startTime)
                );
                const idxInSorted = sortedByDate.findIndex(
                  (x) => x.title === c.title
                );
                const prevRating =
                  idxInSorted > 0 ? sortedByDate[idxInSorted - 1].rating : 0;

                return {
                  platform: 'leetcode',
                  contestId: c.title?.replace(/\s+/g, '-').toLowerCase(),
                  platformContestId: c.title
                    ?.replace(/\s+/g, '-')
                    .toLowerCase(),
                  name: c.title,
                  url: `https://leetcode.com/contest/${c.title?.replace(/\s+/g, '-').toLowerCase()}`,
                  date: c.startTime,
                  endDate: null,
                  rank: c.ranking,
                  totalParticipants: contestData.totalParticipants || null,
                  score: c.problemsSolved,
                  solved: c.problemsSolved,
                  totalProblems: c.totalProblems || 4,
                  problems: null,
                  problemsAttempted: null,
                  durationMinutes: 90, // LeetCode contests are typically 90 minutes
                  penalty: null,
                  ratingChange:
                    idxInSorted > 0 ? Math.round(c.rating - prevRating) : 0,
                  newRating: Math.round(c.rating),
                  oldRating: idxInSorted > 0 ? Math.round(prevRating) : null,
                  isRated: true,
                  isVirtual: false,
                  division: null,
                  addition: null,
                };
              });
          }
        }
      } catch (error) {
        console.error(
          `[getContestHistory] ${platform} direct API fallback failed:`,
          error.message
        );
      }
    }

    return stats.map((s) => ({
      platform,
      contestId: s.contestId,
      platformContestId: s.platformContestId,
      name: s.contestName,
      url: s.contestUrl,
      date: s.date,
      endDate: s.endDate,
      rank: s.rank,
      totalParticipants: s.totalParticipants,
      score: s.score,
      solved: s.solved,
      totalProblems: s.totalProblems,
      problems: s.problems,
      problemsAttempted: s.problemsAttempted,
      durationMinutes: s.durationMinutes,
      penalty: s.penalty,
      ratingChange: s.ratingChange || 0,
      newRating: s.newRating,
      oldRating: s.oldRating,
      isRated: s.isRated,
      isVirtual: s.isVirtual,
      division: s.division,
      addition: s.addition, // Include addition for raw problem data
    }));
  }

  /**
   * Get all available stats for a handle across a platform
   * Combines account info + contest stats
   */
  async getFullStats(platform, handle) {
    const [accountStats, contestStats] = await Promise.all([
      this.getAccountStats(platform, handle),
      this.getContestStatistics(platform, handle, 20),
    ]);

    if (!accountStats && contestStats.length === 0) {
      return null;
    }

    const ratingHistory = contestStats
      .filter((s) => s.newRating !== null)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((s) => ({
        date: s.date,
        rating: s.newRating,
        change: s.ratingChange,
      }));

    return {
      ...accountStats,
      contests: accountStats?.n_contests || contestStats.length,
      rating:
        accountStats?.rating ||
        ratingHistory[ratingHistory.length - 1]?.rating ||
        0,
      max_rating: Math.max(0, ...ratingHistory.map((r) => r.rating)),
      rating_history: ratingHistory,
      recent_contests: contestStats.slice(0, 10),
    };
  }

  /**
   * Fetch stats for multiple platforms at once
   * @param {Array} handles - Array of {platform, handle} objects
   */
  async getMultiPlatformStats(handles) {
    const results = {};

    // Process sequentially to respect rate limits
    for (const { platform, handle } of handles) {
      try {
        const stats = await this.getFullStats(platform, handle);
        if (stats) {
          results[platform] = stats;
        }
      } catch (error) {
        console.error(
          `Error fetching clist stats for ${platform}/${handle}:`,
          error.message
        );
      }
      // Small delay between requests to respect rate limits
      await new Promise((r) => setTimeout(r, 100));
    }

    return results;
  }

  /**
   * Get aggregated rating history across all platforms
   */
  async getAggregatedRatingHistory(handles) {
    const allHistory = [];

    for (const { platform, handle } of handles) {
      try {
        const history = await this.getRatingHistory(platform, handle);
        allHistory.push(...history);
      } catch (error) {
        console.error(
          `[getAggregatedRatingHistory] Error fetching rating history for ${platform}/${handle}:`,
          error.message
        );
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    return allHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Get aggregated contest history across all platforms
   * @param {Array} handles - Array of {platform, handle} objects
   * @param {number} limitPerPlatform - Max contests per platform (default: 10000 for ALL)
   * @param {boolean} enrichWithProblems - Whether to enrich with problem data
   */
  async getAggregatedContestHistory(
    handles,
    limitPerPlatform = 10000,
    enrichWithProblems = true
  ) {
    const allContests = [];

    for (const { platform, handle } of handles) {
      try {
        let contests = await this.getContestHistory(
          platform,
          handle,
          limitPerPlatform
        );
        allContests.push(...contests);
      } catch (error) {
        console.error(
          `[getAggregatedContestHistory] Error fetching contest history for ${platform}/${handle}:`,
          error.message
        );
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    // STEP 1: Enrich contests with real names AND platform contest IDs (must be done first)
    const nameEnrichedContests = await this.enrichContestNames(allContests);
    // STEP 2: Enrich with problem-level data from native platform APIs (now that we have platform contest IDs)
    let finalContests = nameEnrichedContests;
    if (enrichWithProblems) {
      // Group by platform for problem enrichment
      const contestsByPlatform = nameEnrichedContests.reduce((acc, contest) => {
        if (!acc[contest.platform]) acc[contest.platform] = [];
        acc[contest.platform].push(contest);
        return acc;
      }, {});

      const problemEnrichedContests = [];
      for (const [platform, platformContests] of Object.entries(
        contestsByPlatform
      )) {
        try {
          // Find the handle for this platform
          const handle = handles.find((h) => h.platform === platform)?.handle;
          if (!handle) {
            console.warn(
              `[getAggregatedContestHistory] No handle found for ${platform}`
            );
            problemEnrichedContests.push(...platformContests);
            continue;
          }
          const enriched = await this.enrichContestsWithProblemsForPlatform(
            platformContests,
            platform,
            handle
          );
          problemEnrichedContests.push(...enriched);
        } catch (error) {
          console.error(
            `[getAggregatedContestHistory] Error enriching ${platform} contests with problems:`,
            error.message
          );
          // Continue with non-enriched contests
          problemEnrichedContests.push(...platformContests);
        }
      }
      finalContests = problemEnrichedContests;
    }
    // Sort by date, most recent first
    return finalContests.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * Enrich contests with problem-level data using native platform APIs
   * @param {Array} contests - Contest objects
   * @param {string} platform - Platform name
   * @param {string} handle - User handle
   * @returns {Array} - Enriched contests
   */
  async enrichContestsWithProblemsForPlatform(contests, platform, handle) {
    if (platform === 'codeforces') {
      const cfService = new CodeforcesService();
      return await cfService.enrichContestsWithProblems(contests, handle);
    } else if (platform === 'atcoder') {
      const acService = new AtCoderService();
      return await acService.enrichContestsWithProblems(contests, handle);
    } else if (platform === 'leetcode') {
      const lcService = new LeetCodeService();
      return await lcService.enrichContestsWithProblems(contests, handle);
    } else if (platform === 'codechef') {
      const ccService = new CodeChefService();
      return await ccService.enrichContestsWithProblems(contests, handle);
    }
    // Add more platforms as needed
    return contests; // Return unchanged for unsupported platforms
  }

  /**
   * Enrich contest data with actual contest names from CLIST contests API
   * @param {Array} contests - Array of contest objects with contestId
   * @returns {Array} - Enriched contests with real names where available
   */
  async enrichContestNames(contests) {
    if (!contests || contests.length === 0) return contests;
    // Group contests by platform to optimize API calls
    const contestsByPlatform = contests.reduce((acc, contest) => {
      if (!acc[contest.platform]) acc[contest.platform] = [];
      acc[contest.platform].push(contest);
      return acc;
    }, {});

    const enrichedContests = [];

    for (const [platform, platformContests] of Object.entries(
      contestsByPlatform
    )) {
      const host = this.getClistHost(platform);
      if (!host) {
        console.warn(
          `[enrichContestNames] No CLIST host for platform ${platform}`
        );
        enrichedContests.push(...platformContests);
        continue;
      }

      // Extract unique contest IDs for this platform
      const contestIds = [...new Set(platformContests.map((c) => c.contestId))];

      // Check cache for existing contest data
      const contestNameMap = {};
      const uncachedIds = [];
      for (const contestId of contestIds) {
        const cacheKey = `contest_data:${platform}:${contestId}`;
        const cachedData = await this.getCache(cacheKey);
        if (cachedData) {
          contestNameMap[contestId] = cachedData;
        } else {
          uncachedIds.push(contestId);
        }
      }

      // Fetch missing contest names from API
      if (uncachedIds.length > 0) {
        try {
          const data = await this.fetchApi('contest', {
            resource: host,
            id__in: uncachedIds.join(','),
            limit: uncachedIds.length,
          });

          if (data?.objects) {
            // Cache the results and extract platform-specific contest IDs
            for (const contest of data.objects) {
              const contestId = contest.id.toString();
              const contestName = contest.event;
              const totalProblems = contest.n_problems;
              const totalParticipants = contest.n_statistics;
              const contestUrl = contest.href;
              // Extract platform-specific contest ID from URL
              // Example: https://codeforces.com/contests/2193 -> 2193
              let platformContestId = null;
              if (contestUrl && platform === 'codeforces') {
                const match = contestUrl.match(/\/contests?\/(\d+)/);
                if (match) {
                  platformContestId = match[1];
                }
              } else if (contestUrl && platform === 'atcoder') {
                // Example: https://atcoder.jp/contests/abc123
                const match = contestUrl.match(/\/contests\/([^/]+)/);
                if (match) {
                  platformContestId = match[1];
                }
              } else if (contestUrl && platform === 'codechef') {
                // Example: https://www.codechef.com/START142 -> START142
                const match = contestUrl.match(/codechef\.com\/([A-Z0-9]+)/i);
                if (match) {
                  platformContestId = match[1].toUpperCase();
                }
              }

              if (contestName && contestName.trim()) {
                contestNameMap[contestId] = {
                  name: contestName,
                  platformContestId,
                  totalProblems,
                  totalParticipants,
                  url: contestUrl,
                };
                // Cache for 7 days (contest data doesn't change)
                const cacheKey = `contest_data:${platform}:${contestId}`;
                await this.setCache(
                  cacheKey,
                  contestNameMap[contestId],
                  7 * 24 * 60 * 60
                );
              }
            }
          }
        } catch (error) {
          console.error(
            `[enrichContestNames] Error fetching contest names for ${platform}:`,
            error.message
          );
        }

        // Rate limiting - delay after API call
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Apply enriched data to contests
      let addedParticipantsCount = 0;
      let noEnrichedDataCount = 0;
      const contestsMissingParticipants = [];

      platformContests.forEach((contest) => {
        const enrichedData = contestNameMap[contest.contestId];
        if (enrichedData) {
          if (enrichedData.name && enrichedData.name.trim()) {
            contest.name = enrichedData.name;
            if (contest.contestName !== undefined) {
              contest.contestName = enrichedData.name;
            }
          }
          // Add platform-specific contest ID for matching with submissions (prefer enriched, fallback to existing)
          if (enrichedData.platformContestId && !contest.platformContestId) {
            contest.platformContestId = enrichedData.platformContestId;
          }
          // Add total problems if not already set
          if (enrichedData.totalProblems && !contest.totalProblems) {
            contest.totalProblems = enrichedData.totalProblems;
          }
          // Add total participants if not already set
          if (enrichedData.totalParticipants && !contest.totalParticipants) {
            contest.totalParticipants = enrichedData.totalParticipants;
            addedParticipantsCount++;
          } else if (
            !enrichedData.totalParticipants &&
            !contest.totalParticipants
          ) {
            // Track contests missing participant counts for fallback fetch
            contestsMissingParticipants.push(contest);
          }
          // Add contest URL if not already set
          if (enrichedData.url && !contest.url) {
            contest.url = enrichedData.url;
          }
        } else {
          // No enriched data from CLIST, but contest might still have platformContestId from URL
          // Track for fallback if missing totalParticipants
          if (!contest.totalParticipants) {
            contestsMissingParticipants.push(contest);
          }
          noEnrichedDataCount++;
        }
      });

      // For Codeforces contests missing participant counts, try fetching from native CF API
      if (platform === 'codeforces' && contestsMissingParticipants.length > 0) {
        const cfService = new CodeforcesService();
        let cfFetchedCount = 0;

        // Get unique platform contest IDs that need participant counts
        const cfContestIds = contestsMissingParticipants
          .map((c) => c.platformContestId)
          .filter((id) => id); // Filter out nulls

        const missingPlatformIds = contestsMissingParticipants.filter(
          (c) => !c.platformContestId
        ).length;
        if (missingPlatformIds > 0) {
        }

        if (cfContestIds.length > 0) {
          try {
            const participantCounts =
              await cfService.getContestParticipantCounts(cfContestIds);

            // Apply the fetched counts to contests
            for (const contest of contestsMissingParticipants) {
              if (
                contest.platformContestId &&
                participantCounts[contest.platformContestId]
              ) {
                contest.totalParticipants =
                  participantCounts[contest.platformContestId];
                cfFetchedCount++;

                // Update the cache with the new participant count
                const cacheKey = `contest_data:${platform}:${contest.contestId}`;
                const cachedData = contestNameMap[contest.contestId];
                if (cachedData) {
                  cachedData.totalParticipants = contest.totalParticipants;
                  await this.setCache(cacheKey, cachedData, 7 * 24 * 60 * 60);
                }
              }
            }

            if (cfFetchedCount > 0) {
            }
          } catch (error) {
            console.error(
              `[enrichContestNames] Error fetching participant counts from CF API:`,
              error.message
            );
          }
        }

        // Update count of still-missing contests
        const stillMissingCount = contestsMissingParticipants.filter(
          (c) => !c.totalParticipants
        ).length;
        if (stillMissingCount > 0) {
        }
      } else if (contestsMissingParticipants.length > 0) {
      }

      // Log summary
      if (addedParticipantsCount > 0) {
      }
      if (noEnrichedDataCount > 0) {
      }

      enrichedContests.push(...platformContests);
    }

    const enrichedCount = enrichedContests.filter(
      (c) => c.name && !c.name.startsWith('Contest #')
    ).length;
    return enrichedContests;
  }

  // Cache helpers (reuse from other services)
  async getCache(key) {
    try {
      const { data } = await supabaseAdmin
        .from('api_cache')
        .select('cache_value')
        .eq('cache_key', key)
        .gt('expires_at', new Date().toISOString())
        .single();
      return data?.cache_value;
    } catch {
      return null;
    }
  }

  async setCache(key, value, ttlSeconds) {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
      await supabaseAdmin.from('api_cache').upsert({
        cache_key: key,
        cache_value: value,
        expires_at: expiresAt,
      });
    } catch (error) {
      console.error('Cache set error:', error.message);
    }
  }

  // ============================================
  // DATABASE PERSISTENCE METHODS
  // ============================================

  /**
   * Save rating history entries to the database
   * @param {string} userId - User UUID
   * @param {Array} ratingHistory - Array of rating history objects
   * @param {string} dataSource - Source of data: 'clist', 'native', or 'manual'
   */
  async saveRatingHistory(userId, ratingHistory, dataSource = 'clist') {
    if (!ratingHistory || ratingHistory.length === 0) {
      return { saved: 0, updated: 0 };
    }

    // Filter out entries missing required fields (rating is NOT NULL in database)
    const validEntries = ratingHistory.filter((entry) => {
      const newRating = entry.rating || entry.newRating;
      if (newRating === null || newRating === undefined) {
        return false;
      }
      return true;
    });
    if (validEntries.length === 0) {
      return { saved: 0, updated: 0 };
    }

    // Check for V2 schema
    const useV2 = await isV2SchemaAvailable();

    try {
      if (useV2) {
        // V2 schema: rating_history table uses platform_id and different column names
        // Columns: id, user_id, platform_id, contest_id (uuid FK), rating, rating_change, recorded_at
        const { getPlatformId } =
          await import('@/app/_lib/services/problem-solving-v2-helpers');

        // Group entries by platform and get platform IDs
        const platformGroups = {};
        for (const entry of validEntries) {
          const platform = entry.platform;
          if (!platformGroups[platform]) {
            platformGroups[platform] = {
              platformId: await getPlatformId(platform),
              entries: [],
            };
          }
          platformGroups[platform].entries.push(entry);
        }

        let totalSaved = 0;
        let totalUpdated = 0;

        for (const platform of Object.keys(platformGroups)) {
          const { platformId, entries } = platformGroups[platform];

          if (!platformId) {
            console.warn(`[saveRatingHistory] Unknown platform: ${platform}`);
            continue;
          }

          const records = entries.map((entry) => ({
            user_id: userId,
            platform_id: platformId,
            // V2 schema expects contest_id as UUID FK or null; we store external ID info elsewhere
            // For now, we'll skip contest_id FK since it requires a separate lookup
            rating: entry.rating || entry.newRating,
            rating_change: entry.change || entry.ratingChange || null,
            recorded_at: entry.date,
          }));

          // Get existing records for this user/platform
          const { data: existing } = await supabaseAdmin
            .from('rating_history')
            .select('id, recorded_at')
            .eq('user_id', userId)
            .eq('platform_id', platformId);

          const existingDates = new Set(
            (existing || []).map((e) => new Date(e.recorded_at).toISOString())
          );

          const newRecords = records.filter(
            (r) => !existingDates.has(new Date(r.recorded_at).toISOString())
          );

          if (newRecords.length > 0) {
            const { data, error } = await supabaseAdmin
              .from('rating_history')
              .insert(newRecords)
              .select();

            if (error) {
              // If still getting duplicate key errors despite pre-check, log but don't crash
              if (
                error.message?.includes('duplicate key') ||
                error.code === '23505'
              ) {
                // Silently ignore duplicate key violations (race condition or timestamp precision issue)
              } else {
                console.error(
                  `[saveRatingHistory] Error for ${platform}:`,
                  error.message
                );
              }
            } else {
              totalSaved += data?.length || newRecords.length;
            }
          }

          totalUpdated += records.length - newRecords.length;
        }
        return { saved: totalSaved, updated: totalUpdated };
      } else {
        // Legacy schema
        const records = validEntries.map((entry) => ({
          user_id: userId,
          platform: entry.platform,
          contest_id: entry.contestId?.toString() || null,
          contest_name: entry.contestName || null,
          contest_url: entry.url || null,
          contest_date: entry.date,
          old_rating: entry.oldRating || null,
          new_rating: entry.rating || entry.newRating,
          rating_change: entry.change || entry.ratingChange || null,
          rank: entry.rank || null,
          data_source: dataSource,
          raw_data: entry,
          updated_at: new Date().toISOString(),
        }));

        // Get existing contest_ids for this user to track what's new vs updated
        const { data: existing } = await supabaseAdmin
          .from('rating_history')
          .select('platform, contest_id')
          .eq('user_id', userId);

        const existingKeys = new Set(
          (existing || []).map((e) => `${e.platform}:${e.contest_id}`)
        );

        const newCount = records.filter(
          (r) => !existingKeys.has(`${r.platform}:${r.contest_id}`)
        ).length;
        const updateCount = records.length - newCount;

        // Use upsert to insert new records AND update existing ones with fresh data
        const { data, error } = await supabaseAdmin
          .from('rating_history')
          .upsert(records, {
            onConflict: 'user_id,platform,contest_id',
            ignoreDuplicates: false,
          })
          .select('id');

        if (error) {
          console.error('Error saving rating history:', error.message);
          return { saved: 0, updated: 0, error: error.message };
        }
        return {
          saved: newCount,
          updated: updateCount,
          total: data?.length || records.length,
        };
      }
    } catch (error) {
      console.error('Error saving rating history:', error.message);
      return { saved: 0, updated: 0, error: error.message };
    }
  }

  /**
   * Save contest history entries to the database
   * Uses upsert to update existing records with new data (e.g., totalParticipants fetched later)
   * @param {string} userId - User UUID
   * @param {Array} contestHistory - Array of contest history objects
   * @param {string} dataSource - Source of data: 'clist', 'native', or 'manual'
   */
  async saveContestHistory(userId, contestHistory, dataSource = 'clist') {
    if (!contestHistory || contestHistory.length === 0) {
      return { saved: 0, updated: 0 };
    }

    // Filter out entries missing required fields (contest_id and contest_name are NOT NULL in database)
    const validEntries = contestHistory.filter((entry) => {
      const contestId = entry.contestId?.toString();
      const contestName = entry.name || entry.contestName;

      if (!contestId) {
        return false;
      }

      if (!contestName) {
        return false;
      }

      return true;
    });
    if (validEntries.length === 0) {
      return { saved: 0, updated: 0 };
    }

    // Check for V2 schema
    const useV2 = await isV2SchemaAvailable();

    try {
      if (useV2) {
        // V2 schema: contest_history table uses platform_id and external_contest_id
        // Columns: id, user_id, platform_id, external_contest_id, contest_name, contest_url,
        // contest_date, duration_minutes, rank, total_participants, problems_solved,
        // problems_attempted, score, old_rating, new_rating, rating_change, is_rated,
        // is_virtual, division, created_at
        const { getPlatformId } =
          await import('@/app/_lib/services/problem-solving-v2-helpers');

        // Group entries by platform and get platform IDs
        const platformGroups = {};
        for (const entry of validEntries) {
          const platform = entry.platform;
          if (!platformGroups[platform]) {
            platformGroups[platform] = {
              platformId: await getPlatformId(platform),
              entries: [],
            };
          }
          platformGroups[platform].entries.push(entry);
        }

        let totalSaved = 0;
        let totalUpdated = 0;

        for (const platform of Object.keys(platformGroups)) {
          const { platformId, entries } = platformGroups[platform];

          if (!platformId) {
            console.warn(`[saveContestHistory] Unknown platform: ${platform}`);
            continue;
          }

          const records = entries.map((entry) => ({
            user_id: userId,
            platform_id: platformId,
            external_contest_id: entry.contestId?.toString(),
            contest_name: entry.name || entry.contestName,
            contest_url: entry.url || entry.contestUrl || null,
            contest_date: entry.date,
            contest_end_date: entry.endDate || null,
            duration_minutes: entry.durationMinutes || entry.duration || null,
            rank: entry.rank || null,
            total_participants: entry.totalParticipants || null,
            problems_solved: entry.solved || entry.problemsSolved || 0,
            problems_attempted: entry.problemsAttempted || null,
            total_problems: entry.totalProblems || null,
            problems_data: entry.problems || null, // jsonb column - no need to stringify
            score: entry.score || null,
            max_score: entry.maxScore || null,
            penalty: entry.penalty || null,
            platform_contest_id: entry.platformContestId || null,
            old_rating: entry.oldRating || null,
            new_rating: entry.newRating || null,
            rating_change: entry.ratingChange || null,
            is_rated: entry.isRated === true,
            is_virtual: entry.isVirtual || false,
            division: entry.division || null,
          }));

          // Get existing records for this user/platform
          const { data: existing } = await supabaseAdmin
            .from('contest_history')
            .select('id, external_contest_id')
            .eq('user_id', userId)
            .eq('platform_id', platformId);

          const existingIds = new Set(
            (existing || []).map((e) => e.external_contest_id)
          );

          const newRecords = records.filter(
            (r) => !existingIds.has(r.external_contest_id)
          );
          const updateRecords = records.filter((r) =>
            existingIds.has(r.external_contest_id)
          );

          // Insert new records
          if (newRecords.length > 0) {
            const { error } = await supabaseAdmin
              .from('contest_history')
              .insert(newRecords);

            if (error) {
              console.error(
                `[saveContestHistory] Insert error for ${platform}:`,
                error.message
              );
            } else {
              totalSaved += newRecords.length;
            }
          }

          // Update existing records with fresh data
          for (const record of updateRecords) {
            const { error } = await supabaseAdmin
              .from('contest_history')
              .update({
                contest_name: record.contest_name,
                contest_url: record.contest_url,
                contest_end_date: record.contest_end_date,
                duration_minutes: record.duration_minutes,
                rank: record.rank,
                total_participants: record.total_participants,
                problems_solved: record.problems_solved,
                problems_attempted: record.problems_attempted,
                total_problems: record.total_problems,
                problems_data: record.problems_data,
                score: record.score,
                max_score: record.max_score,
                penalty: record.penalty,
                platform_contest_id: record.platform_contest_id,
                old_rating: record.old_rating,
                new_rating: record.new_rating,
                rating_change: record.rating_change,
                is_rated: record.is_rated,
                is_virtual: record.is_virtual,
                division: record.division,
              })
              .eq('user_id', userId)
              .eq('platform_id', platformId)
              .eq('external_contest_id', record.external_contest_id);

            if (!error) {
              totalUpdated++;
            }
          }
        }
        return { saved: totalSaved, updated: totalUpdated };
      } else {
        // Legacy schema
        const records = validEntries.map((entry) => ({
          user_id: userId,
          platform: entry.platform,
          contest_id: entry.contestId?.toString(),
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
          is_rated: entry.isRated === true,
          is_virtual: entry.isVirtual || false,
          division: entry.division || null,
          data_source: dataSource,
          raw_data: entry,
          updated_at: new Date().toISOString(),
        }));

        // Get existing records for this user to track what's new vs updated
        const { data: existing } = await supabaseAdmin
          .from('contest_history')
          .select('platform, contest_id')
          .eq('user_id', userId);

        const existingKeys = new Set(
          (existing || []).map((e) => `${e.platform}:${e.contest_id}`)
        );

        const newCount = records.filter(
          (r) => !existingKeys.has(`${r.platform}:${r.contest_id}`)
        ).length;
        const updateCount = records.length - newCount;

        // Use upsert to insert new records AND update existing ones with fresh data
        const { data, error } = await supabaseAdmin
          .from('contest_history')
          .upsert(records, {
            onConflict: 'user_id,platform,contest_id',
            ignoreDuplicates: false,
          })
          .select('id');

        if (error) {
          console.error('Error saving contest history:', error.message);
          return { saved: 0, updated: 0, error: error.message };
        }
        return {
          saved: newCount,
          updated: updateCount,
          total: data?.length || records.length,
        };
      }
    } catch (error) {
      console.error('Error saving contest history:', error.message);
      return { saved: 0, updated: 0, error: error.message };
    }
  }

  /**
   * Update user handle with clist account info
   * @param {string} userId - User UUID
   * @param {string} platform - Platform ID
   * @param {object} accountInfo - Account info from clist
   */
  async updateHandleWithClistInfo(userId, platform, accountInfo) {
    if (!accountInfo) return false;

    try {
      const useV2 = await isV2SchemaAvailable();

      if (useV2) {
        const { getPlatformId } =
          await import('@/app/_lib/services/problem-solving-v2-helpers');
        const platformId = await getPlatformId(platform);
        const { error } = await supabaseAdmin
          .from(V2_TABLES.USER_HANDLES)
          .update({
            clist_account_id: accountInfo.id,
            clist_resource_id: accountInfo.resource_id,
            profile_url: accountInfo.url,
            last_synced_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('platform_id', platformId);

        if (error) {
          console.error(
            'Error updating V2 handle with clist info:',
            error.message
          );
          return false;
        }
      } else {
        const { error } = await supabaseAdmin
          .from('user_handles')
          .update({
            clist_account_id: accountInfo.id,
            clist_resource_id: accountInfo.resource_id,
            profile_url: accountInfo.url,
            last_synced_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('platform', platform);

        if (error) {
          console.error(
            'Error updating handle with clist info:',
            error.message
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating handle with clist info:', error.message);
      return false;
    }
  }

  /**
   * Fetch and persist all data for a user's handles
   * @param {string} userId - User UUID
   * @param {Array} handles - Array of {platform, handle} objects
   */
  async syncAllDataForUser(userId, handles) {
    const results = {
      ratingHistory: { total: 0, saved: 0 },
      contestHistory: { total: 0, saved: 0 },
      handlesUpdated: 0,
      errors: [],
    };

    for (const { platform, handle } of handles) {
      try {
        // Get account info and update handle
        const accountInfo = await this.getAccountStats(platform, handle);
        if (accountInfo) {
          const updated = await this.updateHandleWithClistInfo(
            userId,
            platform,
            accountInfo
          );
          if (updated) results.handlesUpdated++;
        }

        // Fetch and save rating history
        const ratingHistory = await this.getRatingHistory(platform, handle);
        if (ratingHistory.length > 0) {
          results.ratingHistory.total += ratingHistory.length;
          const ratingResult = await this.saveRatingHistory(
            userId,
            ratingHistory
          );
          results.ratingHistory.saved += ratingResult.saved;
          if (ratingResult.error) results.errors.push(ratingResult.error);
        }

        // Fetch and save contest history
        const contestHistory = await this.getContestHistory(platform, handle);
        if (contestHistory.length > 0) {
          results.contestHistory.total += contestHistory.length;
          const contestResult = await this.saveContestHistory(
            userId,
            contestHistory
          );
          results.contestHistory.saved += contestResult.saved;
          if (contestResult.error) results.errors.push(contestResult.error);
        }

        // Rate limit delay
        await new Promise((r) => setTimeout(r, 200));
      } catch (error) {
        console.error(`Error syncing ${platform}/${handle}:`, error.message);
        results.errors.push(`${platform}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Get rating history from database for a user
   * @param {string} userId - User UUID
   * @param {string} platform - Optional platform filter
   */
  async getRatingHistoryFromDb(userId, platform = null) {
    try {
      let query = supabaseAdmin
        .from('rating_history')
        .select('*')
        .eq('user_id', userId)
        .order('contest_date', { ascending: true });

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching rating history from DB:', error.message);
        return [];
      }

      return data.map((row) => ({
        platform: row.platform,
        date: row.contest_date,
        rating: row.new_rating,
        oldRating: row.old_rating,
        change: row.rating_change,
        contestId: row.contest_id,
        contestName: row.contest_name,
        url: row.contest_url,
        rank: row.rank,
      }));
    } catch (error) {
      console.error('Error fetching rating history from DB:', error.message);
      return [];
    }
  }

  /**
   * Get contest history from database for a user
   * @param {string} userId - User UUID
   * @param {string} platform - Optional platform filter
   * @param {number} limit - Max number of results (default: 10000 to fetch ALL)
   */
  async getContestHistoryFromDb(userId, platform = null, limit = 10000) {
    try {
      let query = supabaseAdmin
        .from('contest_history')
        .select('*')
        .eq('user_id', userId)
        .order('contest_date', { ascending: false });

      // Only apply limit if explicitly requested (for performance in specific cases)
      if (limit && limit < 10000) {
        query = query.limit(limit);
      }

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching contest history from DB:', error.message);
        return [];
      }

      return data.map((row) => ({
        platform: row.platform,
        contestId: row.contest_id,
        name: row.contest_name,
        url: row.contest_url,
        date: row.contest_date,
        rank: row.rank,
        totalParticipants: row.total_participants,
        score: row.score,
        solved: row.problems_solved,
        ratingChange: row.rating_change,
        newRating: row.new_rating,
        oldRating: row.old_rating,
        isRated: row.is_rated,
        isVirtual: row.is_virtual,
        division: row.division,
        // Extract enriched problem data from raw_data (includes upsolve flags)
        problems: row.raw_data?.problems || [],
        totalProblems: row.raw_data?.totalProblems,
        upsolves: row.raw_data?.upsolves,
      }));
    } catch (error) {
      console.error('Error fetching contest history from DB:', error.message);
      return [];
    }
  }

  /**
   * Get data with DB fallback - tries DB first, then fetches from API if empty
   * @param {string} userId - User UUID
   * @param {Array} handles - Array of {platform, handle} objects
   * @param {boolean} forceRefresh - Force fetch from API even if DB has data
   */
  async getDataWithDbFallback(userId, handles, forceRefresh = false) {
    // Try to get from database first (unless force refresh)
    if (!forceRefresh) {
      const [dbRatingHistory, dbContestHistory] = await Promise.all([
        this.getRatingHistoryFromDb(userId),
        this.getContestHistoryFromDb(userId),
      ]);

      // If we have data in DB, return it
      if (dbRatingHistory.length > 0 || dbContestHistory.length > 0) {
        return {
          ratingHistory: dbRatingHistory,
          contestHistory: dbContestHistory,
          source: 'database',
        };
      }
    }

    // Fetch from API
    const [ratingHistory, contestHistory] = await Promise.all([
      this.getAggregatedRatingHistory(handles),
      this.getAggregatedContestHistory(handles),
    ]);

    // Save to database in background (don't await)
    if (ratingHistory.length > 0 || contestHistory.length > 0) {
      this.saveRatingHistory(userId, ratingHistory).catch(console.error);
      this.saveContestHistory(userId, contestHistory).catch(console.error);
    }

    return {
      ratingHistory,
      contestHistory,
      source: 'api',
    };
  }

  /**
   * Update existing contest records with enriched contest names
   * @param {string} userId - User UUID (optional, if null updates all users)
   * @param {number} batchSize - Number of contests to update per batch (default: 100)
   * @returns {Promise<{updated: number, errors: number, remaining: number}>}
   */
  async updateContestNamesInDatabase(userId = null, batchSize = 100) {
    // Import getPlatformCode for converting platform_id to platform code
    const { getPlatformCode } =
      await import('@/app/_lib/services/problem-solving-v2-helpers');

    try {
      // Get contests with generic names that need updating
      // Use correct column names: platform_id, external_contest_id
      let query = supabaseAdmin
        .from('contest_history')
        .select('id, user_id, platform_id, external_contest_id, contest_name')
        .like('contest_name', 'Contest #%');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: contestsToUpdate, error: queryError } =
        await query.limit(batchSize);

      if (queryError) {
        console.error(
          '[updateContestNamesInDatabase] Query error:',
          queryError.message
        );
        return { updated: 0, errors: 1, remaining: 0 };
      }

      if (!contestsToUpdate || contestsToUpdate.length === 0) {
        return { updated: 0, errors: 0, remaining: 0 };
      }
      // Group by platform_id for efficient API calls
      const contestsByPlatformId = contestsToUpdate.reduce((acc, contest) => {
        if (!acc[contest.platform_id]) acc[contest.platform_id] = [];
        acc[contest.platform_id].push(contest);
        return acc;
      }, {});

      let updated = 0;
      let errors = 0;

      for (const [platformId, contests] of Object.entries(
        contestsByPlatformId
      )) {
        // Convert platform_id to platform code
        const platformCode = await getPlatformCode(parseInt(platformId));
        if (!platformCode) {
          console.warn(
            `[updateContestNamesInDatabase] Unknown platform_id: ${platformId}`
          );
          continue;
        }

        const host = this.getClistHost(platformCode);
        if (!host) {
          console.warn(
            `[updateContestNamesInDatabase] No CLIST host for platform ${platformCode}`
          );
          continue;
        }

        // Extract contest IDs (external_contest_id contains CLIST contest ID)
        const contestIds = contests.map((c) => c.external_contest_id);

        try {
          const data = await this.fetchApi('contest', {
            resource: host,
            id__in: contestIds.join(','),
            limit: contestIds.length,
          });

          if (data?.objects) {
            // Create mapping of contest ID to name
            const nameMap = {};
            data.objects.forEach((contest) => {
              nameMap[contest.id.toString()] = contest.event;
            });

            // Update database records
            for (const contest of contests) {
              const realName = nameMap[contest.external_contest_id];
              if (
                realName &&
                realName.trim() &&
                realName !== contest.contest_name
              ) {
                try {
                  const { error } = await supabaseAdmin
                    .from('contest_history')
                    .update({ contest_name: realName })
                    .eq('id', contest.id);

                  if (error) {
                    console.error(
                      `[updateContestNamesInDatabase] Error updating contest ${contest.external_contest_id}:`,
                      error.message
                    );
                    errors++;
                  } else {
                    updated++;

                    // Cache the result
                    const cacheKey = `contest_name:${platformCode}:${contest.external_contest_id}`;
                    await this.setCache(cacheKey, realName, 7 * 24 * 60 * 60);
                  }
                } catch (error) {
                  console.error(
                    `[updateContestNamesInDatabase] Database error for contest ${contest.external_contest_id}:`,
                    error.message
                  );
                  errors++;
                }
              }
            }
          }

          // Rate limiting
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(
            `[updateContestNamesInDatabase] API error for platform ${platformCode}:`,
            error.message
          );
          errors += contests.length;
        }
      }

      // Check if there are more contests to update
      const { count: remainingCount } = await supabaseAdmin
        .from('contest_history')
        .select('id', { count: 'exact', head: true })
        .like('contest_name', 'Contest #%')
        .neq(
          'id',
          contestsToUpdate.map((c) => c.id)
        );
      return { updated, errors, remaining: remainingCount || 0 };
    } catch (error) {
      console.error(
        '[updateContestNamesInDatabase] General error:',
        error.message
      );
      return { updated: 0, errors: 1, remaining: 0 };
    }
  }
}
