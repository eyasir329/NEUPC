/**
 * @file codechef — split from the problem-solving-services module.
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
// CODECHEF SERVICE
// ============================================
export class CodeChefService {
  constructor() {
    this.baseUrl = 'https://www.codechef.com';
  }

  async getUserProfile(handle) {
    const cacheKey = `cc_profile_${handle}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    // Try API first, then fallback to scraping
    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/users/${handle}`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: 'application/json, text/html',
          },
        },
        15000,
        2,
        2000
      );

      if (!response.ok) {
        throw new Error('CodeChef user not found');
      }

      // Try to get JSON data
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        const profile = {
          handle: data.username || handle,
          rating: data.rating || 0,
          maxRating: data.highest_rating || data.max_rating || 0,
          globalRank: data.global_rank,
          countryRank: data.country_rank,
          stars: data.stars,
          totalSolved: data.fully_solved?.count || 0,
        };
        await this.setCache(cacheKey, profile, 600);
        return profile;
      } else {
        // HTML response, try scraping
        const html = await response.text();
        return this.parseProfileFromHtml(handle, html);
      }
    } catch (error) {
      console.warn(
        `[CodeChef] API failed for profile ${handle}: ${error.message}`
      );
      // Try scraping as fallback
      try {
        return await this.scrapeProfile(handle);
      } catch (scrapeError) {
        console.warn(
          `[CodeChef] Scraping also failed for ${handle}: ${scrapeError.message}`
        );
        // Return minimal profile to prevent sync failure
        return {
          handle,
          rating: 0,
          maxRating: 0,
          totalSolved: 0,
          note: 'Profile data unavailable - CodeChef API access restricted',
        };
      }
    }
  }

  parseProfileFromHtml(handle, html) {
    const ratingMatch =
      html.match(/Rating[:\s]*(\d+)/i) || html.match(/"rating"\s*:\s*(\d+)/i);
    const maxRatingMatch =
      html.match(/Highest Rating[:\s]*(\d+)/i) ||
      html.match(/"highest_rating"\s*:\s*(\d+)/i);
    const solvedMatch =
      html.match(/Fully Solved[:\s]*\((\d+)\)/i) ||
      html.match(/Problems Solved[:\s]*(\d+)/i) ||
      html.match(/"fully_solved"\s*:\s*\{\s*"count"\s*:\s*(\d+)/i);

    return {
      handle,
      rating: ratingMatch ? parseInt(ratingMatch[1]) : 0,
      maxRating: maxRatingMatch ? parseInt(maxRatingMatch[1]) : 0,
      totalSolved: solvedMatch ? parseInt(solvedMatch[1]) : 0,
    };
  }

  async scrapeProfile(handle) {
    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/users/${handle}`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml',
          },
        },
        15000,
        2
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      return this.parseProfileFromHtml(handle, html);
    } catch (error) {
      console.warn(
        `[CodeChef] Scrape profile failed for ${handle}: ${error.message}`
      );
      return {
        handle,
        rating: 0,
        maxRating: 0,
        totalSolved: 0,
      };
    }
  }

  async getSubmissions(handle, fromTimestamp = null) {
    const cacheKey = `cc_subs_${handle}_${fromTimestamp || 'all'}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    // Try multiple approaches since CodeChef API is often blocked

    // Approach 1: Try CodeChef's new API endpoint with proper headers
    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/api/list/submission?userHandle=${handle}&result=AC&limit=100`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: 'application/json',
            Referer: 'https://www.codechef.com/',
          },
        },
        15000, // 15 second timeout
        2, // Only 2 retries for this approach
        2000
      );

      if (response.ok) {
        const data = await response.json();
        const submissions = (data.data || []).map((sub) => ({
          submission_id: sub.id?.toString(),
          problem_id: sub.problemCode,
          problem_name: sub.problemName || sub.problemCode,
          problem_url: `${this.baseUrl}/problems/${sub.problemCode}`,
          contest_id: sub.contestCode,
          verdict: 'AC',
          language: sub.language,
          submitted_at: sub.date || new Date().toISOString(),
        }));

        const filtered = fromTimestamp
          ? submissions.filter(
              (s) => new Date(s.submitted_at) > new Date(fromTimestamp)
            )
          : submissions;

        await this.setCache(cacheKey, filtered, 120);
        return filtered;
      }
    } catch (error) {
      console.warn(
        `[CodeChef] Primary API failed for ${handle}: ${error.message}`
      );
    }

    // Approach 2: Try scraping the user's recent activity page
    try {
      const submissions = await this.scrapeSubmissions(handle);
      if (submissions.length > 0) {
        const filtered = fromTimestamp
          ? submissions.filter(
              (s) => new Date(s.submitted_at) > new Date(fromTimestamp)
            )
          : submissions;
        await this.setCache(cacheKey, filtered, 120);
        return filtered;
      }
    } catch (error) {
      console.warn(
        `[CodeChef] Scraping failed for ${handle}: ${error.message}`
      );
    }

    // Approach 3: Return empty array but log that sync is not available
    console.warn(
      `[CodeChef] Could not fetch submissions for ${handle}. CodeChef API access may be restricted. ` +
        `Please use the browser extension to sync CodeChef data.`
    );
    return [];
  }

  /**
   * Scrape submissions from CodeChef user profile page
   * This is a fallback when API access is blocked
   */
  async scrapeSubmissions(handle) {
    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/users/${handle}`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        },
        30000,
        2
      );

      if (!response.ok) {
        return [];
      }

      const html = await response.text();

      // Extract solved problem codes from the profile page
      // CodeChef shows fully solved problems in a specific section
      const submissions = [];

      // Try to find problem codes in the "Fully Solved" section
      // The pattern looks for problem links like /problems/PROBLEMCODE
      const problemPattern = /\/problems\/([A-Z0-9_]+)/gi;
      const matches = html.matchAll(problemPattern);
      const seenProblems = new Set();

      for (const match of matches) {
        const problemCode = match[1];
        // Skip common non-problem patterns
        if (
          problemCode === 'school' ||
          problemCode === 'easy' ||
          problemCode === 'medium' ||
          problemCode === 'hard' ||
          problemCode === 'challenge' ||
          problemCode === 'extcontest' ||
          seenProblems.has(problemCode)
        ) {
          continue;
        }
        seenProblems.add(problemCode);

        submissions.push({
          submission_id: `cc_${handle}_${problemCode}`,
          problem_id: problemCode,
          problem_name: problemCode,
          problem_url: `${this.baseUrl}/problems/${problemCode}`,
          contest_id: null,
          verdict: 'AC',
          language: 'unknown',
          submitted_at: new Date().toISOString(), // We don't have exact timestamps
        });
      }
      return submissions;
    } catch (error) {
      console.error(`[CodeChef] Scrape error: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch contest problems from CodeChef API
   * @param {string} contestCode - CodeChef contest code
   * @returns {Array} - Array of problem objects
   */
  async getContestProblems(contestCode) {
    const cacheKey = `cc_contest_problems_${contestCode}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/api/contests/${contestCode}`,
        {},
        30000
      );

      if (!response.ok) {
        console.warn(
          `[CodeChef] Could not fetch problems for contest ${contestCode}`
        );
        return [];
      }

      const data = await response.json();
      const problems = (data.problemsList || []).map((p) => ({
        code: p.problemCode || p,
        name: p.problemName || p.problemCode || p,
        url: `${this.baseUrl}/problems/${p.problemCode || p}`,
      }));

      // Cache for 7 days
      await this.setCache(cacheKey, problems, 7 * 24 * 60 * 60);
      return problems;
    } catch (error) {
      console.error(
        `[CodeChef] Error fetching contest problems for ${contestCode}:`,
        error.message
      );
      return [];
    }
  }

  /**
   * Enrich contests with problem-level data from submissions
   * @param {Array} contests - Array of contest objects
   * @param {string} handle - CodeChef handle
   * @returns {Array} - Enriched contests with problems array
   */
  async enrichContestsWithProblems(contests, handle) {
    if (!contests || contests.length === 0) return contests;
    // Fetch all submissions for this user
    const submissions = await this.getSubmissions(handle);
    // Debug: Log sample submissions to see contest_id
    if (submissions.length > 0) {
    }

    // Group submissions by contest_id
    const submissionsByContest = {};
    submissions.forEach((sub) => {
      if (!sub.contest_id) return;
      if (!submissionsByContest[sub.contest_id]) {
        submissionsByContest[sub.contest_id] = [];
      }
      submissionsByContest[sub.contest_id].push(sub);
    });
    // Debug: Log contest IDs we're trying to match
    // Enrich each contest
    const enrichedContests = [];
    for (const contest of contests) {
      const matchId = contest.platformContestId || contest.contestId;
      const contestSubs = submissionsByContest[matchId] || [];

      // Calculate contest end time using endDate if available, otherwise estimate from duration
      const contestStart = new Date(contest.date);
      let contestEnd;
      if (contest.endDate) {
        contestEnd = new Date(contest.endDate);
      } else {
        // Fallback: Use durationMinutes from CLIST, or duration field, or default 180 minutes
        const durationMs =
          (contest.durationMinutes || contest.duration || 180) * 60 * 1000;
        contestEnd = new Date(contestStart.getTime() + durationMs);
      }
      // Fetch problems for this contest
      const contestProblems = await this.getContestProblems(matchId);

      // Initialize problem map from existing CLIST problems
      const problemMap = {};
      if (contest.problems && Array.isArray(contest.problems)) {
        contest.problems.forEach((p) => {
          const key = p.label || p.id || p.name;
          problemMap[key] = {
            label: p.label,
            name: p.name,
            url: p.url || contest.url,
            solved: p.solved === true || p.solvedDuringContest === true || p.upsolve === true,
            solvedDuringContest: p.solvedDuringContest === true,
            upsolve: p.upsolve === true,
            attempted: p.attempted === true,
            wrongAttempts: p.wrongAttempts || 0,
            submissions: [],
          };
        });
      }

      // Build problem map from submissions
      contestSubs.forEach((sub) => {
        let matchedKey = null;
        for (const [key, value] of Object.entries(problemMap)) {
          if (
            key.toLowerCase() === sub.problem_id.toLowerCase() ||
            (value.url && value.url.toLowerCase().includes(sub.problem_id.toLowerCase()))
          ) {
            matchedKey = key;
            break;
          }
        }

        const targetKey = matchedKey || sub.problem_id;
        const subTime = new Date(sub.submitted_at);

        if (!problemMap[targetKey]) {
          problemMap[targetKey] = {
            label: sub.problem_id,
            name: sub.problem_name,
            url: sub.problem_url,
            solved: false,
            solvedDuringContest: false,
            upsolve: false,
            attempted: false,
            wrongAttempts: 0,
            submissions: [],
          };
        }

        const prob = problemMap[targetKey];
        prob.submissions.push(sub);
        prob.attempted = true;

        if (sub.verdict === 'AC') {
          prob.solved = true;
          if (subTime <= contestEnd) {
            prob.solvedDuringContest = true;
            prob.upsolve = false;
          } else if (!prob.solvedDuringContest) {
            prob.upsolve = true;
          }
        } else {
          prob.wrongAttempts = (prob.wrongAttempts || 0) + 1;
        }
      });

      // Add unattempted problems
      contestProblems.forEach((cp) => {
        if (!problemMap[cp.code]) {
          problemMap[cp.code] = {
            label: cp.code,
            name: cp.name,
            url: cp.url,
            solved: false,
            solvedDuringContest: false,
            upsolve: false,
            attempted: false,
            wrongAttempts: 0,
            submissions: [],
          };
        }
      });

      const problems = Object.values(problemMap).sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { numeric: true })
      );

      const solvedCount = problems.filter((p) => p.solvedDuringContest).length;
      const upsolveCount = problems.filter(
        (p) => p.upsolve && !p.solvedDuringContest
      ).length;
      // Small delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));

      // If we found problems from submissions, use them. Otherwise, preserve any existing CLIST data
      const finalProblems =
        problems.length > 0 ? problems : contest.problems || [];

      enrichedContests.push({
        ...contest,
        problems: finalProblems,
        solved: solvedCount > 0 ? solvedCount : contest.solved || 0,
        upsolves: upsolveCount,
        totalProblems:
          finalProblems.length > 0
            ? finalProblems.length
            : contest.totalProblems || 0,
      });
    }

    return enrichedContests;
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
