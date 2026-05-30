/**
 * @file leetcode — split from the problem-solving-services module.
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { PROBLEM_SOLVING_PLATFORM_IDS } from '@/app/_lib/services/problem-solving-platforms';
import {
  V2_TABLES,
  getPlatformCode,
  getPlatformId,
  isV2SchemaAvailable,
} from '@/app/_lib/services/problem-solving-v2-helpers';

import { fetchWithTimeout, normalizeSubmissionVerdict } from './_shared';
import { ClistService } from './clist';
import { CodeforcesService } from './codeforces';

// ============================================
// LEETCODE SERVICE
// ============================================
export class LeetCodeService {
  constructor() {
    this.graphqlEndpoint = 'https://leetcode.com/graphql';
  }

  /**
   * Build fetch options for GraphQL requests, optionally injecting a session cookie.
   */
  _buildHeaders(extra = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Referer: 'https://leetcode.com/',
      ...extra,
    };

    // LeetCode's GraphQL requires CSRF Double Submit protection.
    // If we pass an auth cookie, we MUST also provide a matching csrftoken
    // cookie and X-CSRFToken header, otherwise the API drops our auth state silently.
    if (headers.Cookie && headers.Cookie.includes('LEETCODE_SESSION=')) {
      let csrfToken = 'neupc_sync_dummy_csrf_9999';
      const csrfMatch = headers.Cookie.match(/csrftoken=([^;]+)/);

      if (csrfMatch) {
        csrfToken = csrfMatch[1];
      } else {
        headers.Cookie = `${headers.Cookie}; csrftoken=${csrfToken}`;
      }
      headers['X-CSRFToken'] = csrfToken;
    }

    return headers;
  }

  async getUserProfile(username) {
    username = this._normalizeUsername(username);
    if (!username) {
      throw new Error('LeetCode username is required');
    }

    const cacheKey = `lc_profile_${username}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    const query = `
      query userPublicProfile($username: String!) {
        matchedUser(username: $username) {
          username
          submitStats: submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
          profile {
            ranking
            reputation
          }
        }
        userContestRanking(username: $username) {
          attendedContestsCount
          rating
          globalRanking
          totalParticipants
          topPercentage
        }
      }
    `;

    const response = await fetchWithTimeout(this.graphqlEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { username } }),
    });

    const data = await response.json();

    if (!data.data?.matchedUser) {
      throw new Error('LeetCode user not found');
    }

    const user = data.data.matchedUser;
    const stats = user.submitStats.acSubmissionNum.reduce((acc, item) => {
      acc[item.difficulty.toLowerCase()] = item.count;
      return acc;
    }, {});

    const contestRanking = data.data.userContestRanking;

    const profile = {
      username: user.username,
      ranking: user.profile.ranking,
      total_solved: Object.values(stats).reduce((a, b) => a + b, 0),
      easy: stats.easy || 0,
      medium: stats.medium || 0,
      hard: stats.hard || 0,
      // Contest data
      contest_rating: contestRanking?.rating || 0,
      contests_attended: contestRanking?.attendedContestsCount || 0,
      total_participants: contestRanking?.totalParticipants || 0,
      global_ranking: contestRanking?.globalRanking || 0,
      top_percentage: contestRanking?.topPercentage || 0,
    };

    await this.setCache(cacheKey, profile, 600);
    return profile;
  }

  /**
   * Get contest ranking history (public API, no auth needed)
   * Returns per-contest details: title, problemsSolved, ranking, timestamp, totalParticipants
   */
  async getContestRanking(username) {
    username = this._normalizeUsername(username);
    if (!username) {
      return { rating: 0, attendedContests: 0, contests: [] };
    }

    const cacheKey = `lc_contest_${username}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    const query = `
      query userContestRankingInfo($username: String!) {
        userContestRanking(username: $username) {
          attendedContestsCount
          rating
          globalRanking
          totalParticipants
          topPercentage
        }
        userContestRankingHistory(username: $username) {
          attended
          trendDirection
          problemsSolved
          totalProblems
          ranking
          rating
          contest {
            title
            startTime
          }
        }
      }
    `;

    try {
      const response = await fetchWithTimeout(this.graphqlEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { username } }),
      });

      const data = await response.json();

      const ranking = data.data?.userContestRanking || {};
      const history = data.data?.userContestRankingHistory || [];

      const result = {
        rating: ranking.rating || 0,
        attendedContests: ranking.attendedContestsCount || 0,
        globalRanking: ranking.globalRanking || 0,
        totalParticipants: ranking.totalParticipants || 0,
        topPercentage: ranking.topPercentage || 0,
        contests: history
          .filter((entry) => entry.attended)
          .map((entry) => ({
            title: entry.contest?.title || 'Unknown Contest',
            problemsSolved: entry.problemsSolved || 0,
            totalProblems: entry.totalProblems || 4,
            ranking: entry.ranking || 0,
            rating: entry.rating || 0,
            startTime: this._unixTimestampToIsoOrNull(entry.contest?.startTime),
          })),
      };

      await this.setCache(cacheKey, result, 600);
      return result;
    } catch (error) {
      console.error('[LC] Contest ranking error:', error.message);
      return { rating: 0, attendedContests: 0, contests: [] };
    }
  }

  _unixTimestampToIsoOrNull(timestamp) {
    const seconds = Number.parseInt(timestamp, 10);
    if (!Number.isFinite(seconds) || seconds <= 0) return null;

    const parsed = new Date(seconds * 1000);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  _dateLikeToIsoOrNull(value) {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  _normalizeUsername(rawUsername) {
    if (rawUsername == null) return '';

    let username = String(rawUsername).trim();
    if (!username) return '';

    username = username.replace(/^@+/, '');
    username = username.replace(
      /^(?:https?:\/\/)?(?:www\.)?leetcode\.(?:com|cn)\//i,
      ''
    );
    username = username.replace(/^(?:u|profile)\//i, '');
    username = username.split(/[/?#]/)[0].replace(/^@+/, '').trim();

    return username;
  }

  _getUsernameCandidates(rawUsername) {
    const normalized = this._normalizeUsername(rawUsername);
    if (!normalized) return [];

    const candidates = [normalized];
    const lower = normalized.toLowerCase();
    if (lower !== normalized) {
      candidates.push(lower);
    }

    return candidates;
  }

  async getRecentSubmissions(username, limit = 20) {
    username = this._normalizeUsername(username);
    if (!username) return [];

    const cacheKey = `lc_recent_${username}_${limit}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    const query = `
      query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          id
          title
          titleSlug
          timestamp
          lang
        }
      }
    `;

    const response = await fetchWithTimeout(this.graphqlEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { username, limit } }),
    });

    const data = await response.json();

    if (!data.data?.recentAcSubmissionList) {
      return [];
    }

    const submissions = data.data.recentAcSubmissionList.map((sub) => ({
      submission_id: sub.id,
      problem_id: sub.titleSlug,
      problem_name: sub.title,
      problem_url: `https://leetcode.com/problems/${sub.titleSlug}/`,
      verdict: 'AC',
      language: sub.lang,
      submitted_at: this._unixTimestampToIsoOrNull(sub.timestamp),
    }));

    await this.setCache(cacheKey, submissions, 120);
    return submissions;
  }

  /**
   * Fetch problem metadata (tags + difficulty) for a list of problem slugs
   * Uses LeetCode's questionData GraphQL query
   * @param {Array<string>} slugs - Array of problem titleSlugs
   * @returns {Map<string, Object>} Map of slug -> { difficulty, tags, questionId }
   */
  async getProblemMetadataBatch(slugs) {
    if (!slugs || slugs.length === 0) return new Map();

    const cacheKey = `lc_prob_meta_batch_${slugs.sort().join('_').substring(0, 200)}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return new Map(Object.entries(cached));

    const metadataMap = new Map();

    // Process in batches of 10 to avoid overloading LC API
    const batchSize = 10;
    for (let i = 0; i < slugs.length; i += batchSize) {
      const batch = slugs.slice(i, i + batchSize);

      const promises = batch.map(async (slug) => {
        try {
          const meta = await this.getProblemMetadata(slug);
          if (meta) {
            metadataMap.set(slug, meta);
          }
        } catch (err) {
          // Silently skip problems we can't fetch metadata for
          console.warn(
            `[LC] Could not fetch metadata for ${slug}: ${err.message}`
          );
        }
      });

      await Promise.all(promises);

      // Small delay between batches
      if (i + batchSize < slugs.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Cache the results
    if (metadataMap.size > 0) {
      const cacheObj = {};
      metadataMap.forEach((v, k) => {
        cacheObj[k] = v;
      });
      await this.setCache(cacheKey, cacheObj, 86400); // Cache 24 hours
    }

    return metadataMap;
  }

  /**
   * Fetch metadata for a single problem (tags, difficulty, questionId)
   * @param {string} titleSlug - Problem slug
   * @returns {Object|null} { difficulty, difficultyRating, tags, questionId, title }
   */
  async getProblemMetadata(titleSlug) {
    if (!titleSlug) return null;

    const cacheKey = `lc_prob_${titleSlug}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          title
          titleSlug
          difficulty
          topicTags {
            name
            slug
          }
        }
      }
    `;

    try {
      const response = await fetchWithTimeout(this.graphqlEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { titleSlug } }),
      });

      const data = await response.json();
      const q = data.data?.question;
      if (!q) return null;

      const result = {
        questionId: q.questionId,
        title: q.title,
        titleSlug: q.titleSlug,
        difficulty: q.difficulty, // "Easy", "Medium", "Hard"
        difficultyRating:
          q.difficulty === 'Easy' ? 1 : q.difficulty === 'Medium' ? 2 : 3,
        tags: (q.topicTags || []).map((t) => t.name),
      };

      await this.setCache(cacheKey, result, 604800); // Cache 7 days
      return result;
    } catch (error) {
      console.warn(
        `[LC] Error fetching metadata for ${titleSlug}: ${error.message}`
      );
      return null;
    }
  }

  /**
   * Get contest problems for a specific contest
   * @param {string} contestSlug - Contest slug (e.g. "weekly-contest-393")
   * @returns {Array|null} Array of problem objects or null
   */
  async getContestProblems(contestSlug) {
    const cacheKey = `lc_contest_problems_${contestSlug}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const query = `
        query contestInfo($titleSlug: String!) {
          contest(titleSlug: $titleSlug) {
            title
            titleSlug
            startTime
            duration
            questions {
              credit
              title
              titleSlug
            }
          }
        }
      `;

      const response = await fetchWithTimeout(this.graphqlEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { titleSlug: contestSlug } }),
      });

      const data = await response.json();
      const contest = data.data?.contest;
      if (!contest?.questions || contest.questions.length === 0) return null;

      // Sort by credit ascending (Q1=easiest, Q4=hardest)
      const problems = contest.questions
        .sort((a, b) => (a.credit || 0) - (b.credit || 0))
        .map((q, index) => ({
          label: `Q${index + 1}`,
          index: String.fromCharCode(65 + index), // A, B, C, D
          title: q.title,
          titleSlug: q.titleSlug,
          credit: q.credit,
          url: `https://leetcode.com/problems/${q.titleSlug}/`,
        }));

      await this.setCache(cacheKey, problems, 604800); // Cache 7 days
      return problems;
    } catch (error) {
      console.warn(
        `[LC] Error fetching contest problems for ${contestSlug}: ${error.message}`
      );
      return null;
    }
  }

  /**
   * Enrich contests with per-problem data (solved/attempted/unattempted)
   * Similar to CodeforcesService.enrichContestsWithProblems
   * @param {Array} contests - Array of contest objects from CLIST or getContestRanking
   * @param {string} username - LeetCode username
   * @returns {Array} Enriched contests with problems array
   */
  async enrichContestsWithProblems(contests, username) {
    if (!contests || contests.length === 0) return contests;
    // Get all recent AC submissions to match against contests
    let allSubs = [];
    try {
      allSubs = await this.getRecentSubmissions(username, 500);
    } catch (err) {
      console.warn(
        `[LC] Could not fetch submissions for enrichment: ${err.message}`
      );
    }

    // Build a set of solved problem slugs from submissions
    const solvedSlugs = new Set(allSubs.map((s) => s.problem_id));

    const enrichedContests = [];

    for (const contest of contests) {
      // Derive contest slug from title or use provided one
      const contestSlug =
        contest.contestSlug ||
        contest.contestId ||
        (contest.name || contest.contestName || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/-+$/, '');

      // Fetch contest problems from LeetCode API
      const contestProblems = await this.getContestProblems(contestSlug);

      let problems = [];
      const totalSolvedFromContest =
        contest.solved || contest.problemsSolved || 0;

      if (contestProblems && contestProblems.length > 0) {
        // We have actual contest problem data
        problems = contestProblems.map((cp, index) => {
          const isSolvedInContest = index < totalSolvedFromContest;
          const isSolvedEver = solvedSlugs.has(cp.titleSlug);

          return {
            label: cp.index || String.fromCharCode(65 + index),
            name: cp.title,
            url: cp.url,
            solved: isSolvedInContest || isSolvedEver,
            solvedDuringContest: isSolvedInContest,
            upsolve: !isSolvedInContest && isSolvedEver,
            attempted: isSolvedInContest || isSolvedEver,
            result: isSolvedInContest ? '+' : isSolvedEver ? '+' : null,
          };
        });
      } else {
        // Fallback: generate generic problem labels
        const totalProblems = contest.totalProblems || 4;
        for (let i = 0; i < totalProblems; i++) {
          const isSolved = i < totalSolvedFromContest;
          problems.push({
            label: String.fromCharCode(65 + i),
            name: `${contest.name || contest.contestName || 'Contest'} - Q${i + 1}`,
            url: `https://leetcode.com/contest/${contestSlug}/`,
            solved: isSolved,
            solvedDuringContest: isSolved,
            upsolve: false,
            attempted: isSolved,
            result: isSolved ? '+' : null,
          });
        }
      }

      const solvedCount = problems.filter((p) => p.solvedDuringContest).length;
      const upsolveCount = problems.filter(
        (p) => p.upsolve && !p.solvedDuringContest
      ).length;

      enrichedContests.push({
        ...contest,
        problems,
        solved: solvedCount,
        upsolves: upsolveCount,
        totalProblems: problems.length,
      });

      // Small delay between contest API calls
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return enrichedContests;
  }

  /**
   * Get ALL accepted submissions for a user (for full sync)
   * Uses MULTI-SOURCE MERGE strategy:
   * 1. recentAcSubmissionList (max 500 most recent AC submissions)
   * 2. Contest ranking history + contest problems API (all contest-solved problems)
   * 3. CLIST fallback for additional contest data
   * All sources are merged and deduplicated by problem_id
   */
  async getAllSubmissions(username, fromTimestamp = null, authToken = null) {
    username = this._normalizeUsername(username);
    if (!username) return [];

    const effectiveAuthToken = authToken || null;
    const enableExternalFallbacks =
      process.env.ENABLE_LEETCODE_EXTERNAL_FALLBACKS === 'true';
    const enableHeuristicSources =
      process.env.ENABLE_LEETCODE_HEURISTIC_SOURCES === 'true';

    const cacheKey = `lc_all_${username}_${fromTimestamp || 'all'}_${effectiveAuthToken ? 'auth' : 'noauth'}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    // Map to deduplicate by problem_id (titleSlug)
    const submissionMap = new Map();

    const addSubmission = (sub) => {
      const key = sub.problem_id;
      if (!submissionMap.has(key)) {
        submissionMap.set(key, sub);
      } else {
        // Keep the entry with more complete data or more recent timestamp
        const existing = submissionMap.get(key);
        // Prefer entries with real submission IDs over synthetic ones
        if (
          (sub.submission_id &&
            !sub.submission_id.startsWith('lc_contest_') &&
            !sub.submission_id.startsWith('clist_')) ||
          (sub.language &&
            sub.language !== 'Unknown' &&
            (!existing.language || existing.language === 'Unknown')) ||
          (!existing.tags && sub.tags)
        ) {
          submissionMap.set(key, { ...existing, ...sub });
        }
      }
    };

    // ============================
    // SOURCE 1: Submissions via GraphQL
    //   - WITH auth token: paginated submissionList (ALL accepted submissions)
    //   - WITHOUT auth token: recentAcSubmissionList (public, limited to ~20)
    // ============================
    let leetcodeStats = null;
    let submissionCalendar = null;
    let source1AuthSuccess = false; // true when we got full data via session cookie

    try {
      // Always fetch profile stats & calendar (these are public)
      const profileQuery = `
        query userProfile($username: String!) {
          matchedUser(username: $username) {
            submitStatsGlobal {
              acSubmissionNum { difficulty count }
            }
            submissionCalendar
          }
        }
      `;

      const profileResp = await fetchWithTimeout(this.graphqlEndpoint, {
        method: 'POST',
        headers: this._buildHeaders(
          effectiveAuthToken
            ? { Cookie: `LEETCODE_SESSION=${effectiveAuthToken}` }
            : {}
        ),
        body: JSON.stringify({ query: profileQuery, variables: { username } }),
      });
      const profileData = await profileResp.json();

      if (profileData.data?.matchedUser) {
        leetcodeStats =
          profileData.data.matchedUser.submitStatsGlobal?.acSubmissionNum;
        if (profileData.data.matchedUser.submissionCalendar) {
          try {
            submissionCalendar = JSON.parse(
              profileData.data.matchedUser.submissionCalendar
            );
          } catch (e) {}
        }
      }

      if (effectiveAuthToken) {
        // ── AUTHENTICATED PATH: paginated submissionList ──────────────────────
        // Fetches every accepted submission in batches of 20 until done.
        const subListQuery = `
          query submissionList($offset: Int!, $limit: Int!, $questionSlug: String!) {
            submissionList(offset: $offset, limit: $limit, questionSlug: $questionSlug) {
              hasNext
              submissions {
                id
                title
                titleSlug
                statusDisplay
                lang
                timestamp
              }
            }
          }
        `;

        let offset = 0;
        const pageSize = 20;
        let hasNext = true;
        let authSubCount = 0;

        while (hasNext) {
          const pageResp = await fetchWithTimeout(this.graphqlEndpoint, {
            method: 'POST',
            headers: this._buildHeaders({
              Cookie: `LEETCODE_SESSION=${effectiveAuthToken}`,
            }),
            body: JSON.stringify({
              query: subListQuery,
              variables: { offset, limit: pageSize, questionSlug: '' },
            }),
          });

          const pageData = await pageResp.json();

          // Detect auth failure (cookie invalid/expired)
          if (pageData.errors || !pageData.data?.submissionList) {
            console.warn(
              `[LC] Auth submissionList failed (invalid/expired cookie?): ${JSON.stringify(pageData.errors || 'no data')}`
            );
            break;
          }

          const { submissions, hasNext: nextPage } =
            pageData.data.submissionList;
          hasNext = nextPage;

          for (const sub of submissions || []) {
            const submittedAt = this._unixTimestampToIsoOrNull(sub.timestamp);
            if (!submittedAt) continue;

            // Check chronological checkpoint for early break to optimize sync
            if (
              fromTimestamp &&
              new Date(submittedAt) <= new Date(fromTimestamp)
            ) {
              hasNext = false; // Set flag to break the outer while loop
              break; // Break inner loop; remaining entries are older
            }

            if (sub.statusDisplay !== 'Accepted') continue;
            addSubmission({
              submission_id: sub.id,
              problem_id: sub.titleSlug,
              problem_name: sub.title,
              problem_url: `https://leetcode.com/problems/${sub.titleSlug}/`,
              verdict: 'AC',
              language: sub.lang,
              submitted_at: submittedAt,
            });
            authSubCount++;
          }

          offset += pageSize;

          // Safety cap: stop at 50000 submissions
          if (offset > 50000) {
            console.warn(
              `[LC] Auth submissionList: hit 50000 submission cap, stopping`
            );
            break;
          }

          // Small delay between pages
          if (hasNext) await new Promise((r) => setTimeout(r, 150));
        }

        if (authSubCount > 0) {
          source1AuthSuccess = true;
        } else {
          console.warn(
            `[LC] Source 1 (auth): Got 0 submissions — cookie may be expired or username mismatch`
          );
        }
      } else {
        // ── PUBLIC PATH: LeetCode GraphQL only (no third-party proxy required) ─
        const usernameCandidates = this._getUsernameCandidates(username);

        const recentAcQuery = `
          query recentAcSubmissions($username: String!, $limit: Int!) {
            recentAcSubmissionList(username: $username, limit: $limit) {
              id title titleSlug timestamp lang
            }
          }
        `;

        const recentSubmissionQuery = `
          query recentSubmissions($username: String!, $limit: Int!) {
            recentSubmissionList(username: $username, limit: $limit) {
              id title titleSlug timestamp statusDisplay lang
            }
          }
        `;

        let source1PublicCount = 0;

        for (const candidate of usernameCandidates) {
          const recentResp = await fetchWithTimeout(this.graphqlEndpoint, {
            method: 'POST',
            headers: this._buildHeaders(),
            body: JSON.stringify({
              query: recentAcQuery,
              variables: { username: candidate, limit: 100 },
            }),
          });

          const recentData = await recentResp.json();
          const recentSubs = recentData.data?.recentAcSubmissionList || [];

          for (const sub of recentSubs) {
            addSubmission({
              submission_id: sub.id,
              problem_id: sub.titleSlug,
              problem_name: sub.title,
              problem_url: `https://leetcode.com/problems/${sub.titleSlug}/`,
              verdict: 'AC',
              language: sub.lang,
              submitted_at: this._unixTimestampToIsoOrNull(sub.timestamp),
            });
            source1PublicCount++;
          }

          if (source1PublicCount > 0) {
            if (candidate !== username) {
              console.log(
                `[LC] Source 1: Using normalized username candidate '${candidate}'`
              );
            }
            break;
          }
        }

        if (source1PublicCount === 0) {
          for (const candidate of usernameCandidates) {
            try {
              const altResp = await fetchWithTimeout(this.graphqlEndpoint, {
                method: 'POST',
                headers: this._buildHeaders(),
                body: JSON.stringify({
                  query: recentSubmissionQuery,
                  variables: { username: candidate, limit: 100 },
                }),
              });

              const altData = await altResp.json();
              const recentSubs = altData.data?.recentSubmissionList || [];

              for (const sub of recentSubs) {
                const verdict = normalizeSubmissionVerdict(
                  sub.statusDisplay || ''
                );
                if (verdict !== 'AC') continue;

                addSubmission({
                  submission_id: sub.id,
                  problem_id: sub.titleSlug,
                  problem_name: sub.title,
                  problem_url: `https://leetcode.com/problems/${sub.titleSlug}/`,
                  verdict: 'AC',
                  language: sub.lang,
                  submitted_at: this._unixTimestampToIsoOrNull(sub.timestamp),
                });
                source1PublicCount++;
              }

              if (source1PublicCount > 0) {
                console.log(
                  `[LC] Source 1: Populated ${source1PublicCount} submissions from recentSubmissionList fallback`
                );
                break;
              }
            } catch (altError) {
              console.warn(
                `[LC] Source 1 recentSubmissionList fallback error for ${candidate}: ${altError.message}`
              );
            }
          }
        }

        if (source1PublicCount === 0) {
          const externalFallbackMessage = enableExternalFallbacks
            ? '[LC] Source 1: No submissions from official GraphQL sources. External fallbacks are enabled but unavailable or returned nothing.'
            : '[LC] Source 1: No submissions from official GraphQL sources. External fallbacks are disabled.';
          console.warn(externalFallbackMessage);
        }
      }
    } catch (error) {
      console.warn(`[LC] Source 1 error for ${username}: ${error.message}`);
    }

    // ============================
    // SOURCE 2: Contest ranking history + contest problems API
    // Gets ALL contest-solved problems with real problem slugs
    // ============================
    if (enableHeuristicSources) {
      try {
        const contestData = await this.getContestRanking(username);

        if (contestData?.contests?.length > 0) {
          let contestSubmissions = 0;

          for (const contest of contestData.contests) {
            if (contest.problemsSolved <= 0) continue;

            const contestDate = this._dateLikeToIsoOrNull(contest.startTime);

            // Derive contest slug
            const contestSlug = contest.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/-+$/, '');

            // Fetch actual problem names from the contest page
            const contestProblems = await this.getContestProblems(contestSlug);

            if (contestProblems && contestProblems.length > 0) {
              const solvedCount = Math.min(
                contest.problemsSolved,
                contestProblems.length
              );

              for (let i = 0; i < solvedCount; i++) {
                const prob = contestProblems[i];
                addSubmission({
                  submission_id: `lc_contest_${contestSlug}_${prob.titleSlug}`,
                  problem_id: prob.titleSlug,
                  problem_name: prob.title,
                  problem_url: `https://leetcode.com/problems/${prob.titleSlug}/`,
                  contest_id: contestSlug,
                  verdict: 'AC',
                  language: 'Unknown',
                  submitted_at: contestDate,
                });
                contestSubmissions++;
              }
            } else {
              // Fallback: generate generic entries
              for (let i = 0; i < contest.problemsSolved; i++) {
                const problemLabel = String.fromCharCode(65 + i);
                addSubmission({
                  submission_id: `lc_contest_${contestSlug}_${problemLabel}`,
                  problem_id: `${contestSlug}-q${i + 1}`,
                  problem_name: `${contest.title} - Q${i + 1}`,
                  problem_url: `https://leetcode.com/contest/${contestSlug}/`,
                  contest_id: contestSlug,
                  verdict: 'AC',
                  language: 'Unknown',
                  submitted_at: contestDate,
                });
                contestSubmissions++;
              }
            }

            // Small delay between contest API calls
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }
      } catch (contestError) {
        console.error('[LC] Source 2 error:', contestError.message);
      }
    }

    // ============================
    // SOURCE 3: CLIST statistics (optional external fallback)
    // ============================
    if (enableHeuristicSources && enableExternalFallbacks) {
      try {
        const clistService = new ClistService();
        if (clistService.isConfigured()) {
          const account = await clistService.findAccount('leetcode', username);
          if (account?.id) {
            const data = await clistService.fetchApi('statistics', {
              account_id: account.id,
              order_by: '-date',
              limit: 10000,
            });

            if (data?.objects) {
              let clistSubmissions = 0;

              for (const stat of data.objects) {
                if (
                  !stat.addition?.problems ||
                  typeof stat.addition.problems !== 'object'
                )
                  continue;

                const contestDate = this._dateLikeToIsoOrNull(
                  stat.contest?.start || stat.date
                );

                for (const [label, value] of Object.entries(
                  stat.addition.problems
                )) {
                  const isSolved =
                    value?.result?.includes('+') || value?.result === 'AC';
                  if (!isSolved) continue;

                  const titleSlug =
                    value?.short ||
                    value?.name?.toLowerCase().replace(/\s+/g, '-') ||
                    label;

                  addSubmission({
                    submission_id: `clist_lc_${stat.contest_id}_${label}`,
                    problem_id: titleSlug,
                    problem_name:
                      value?.name ||
                      `${stat.contest?.title || 'Contest'} - ${label}`,
                    problem_url: value?.url
                      ? `https://leetcode.com${value.url}`
                      : `https://leetcode.com/problems/${titleSlug}/`,
                    contest_id: stat.contest_id?.toString(),
                    verdict: 'AC',
                    language: 'Unknown',
                    submitted_at: contestDate,
                  });
                  clistSubmissions++;
                }
              }
            }
          }
        }
      } catch (clistError) {
        console.error('[LC] Source 3 error:', clistError.message);
      }
    }

    // ============================
    // SOURCE 4: Tag-intersection problem recovery (no auth required)
    // Skipped when Source 1 (authenticated) successfully retrieved all submissions.
    // ============================
    let leetcodeTagStats = null;

    if (enableHeuristicSources && !source1AuthSuccess)
      try {
        // Step 4a: Get per-tag solve counts (public)
        const tagQuery = `
        query getUserTagStats($username: String!) {
          matchedUser(username: $username) {
            tagProblemCounts {
              advanced { tagName tagSlug problemsSolved }
              intermediate { tagName tagSlug problemsSolved }
              fundamental { tagName tagSlug problemsSolved }
            }
            submitStatsGlobal {
              acSubmissionNum { difficulty count }
            }
          }
        }
      `;

        const tagResp = await fetchWithTimeout(this.graphqlEndpoint, {
          method: 'POST',
          headers: this._buildHeaders(),
          body: JSON.stringify({ query: tagQuery, variables: { username } }),
        });
        const tagData = await tagResp.json();

        if (!tagData.data?.matchedUser) throw new Error('No matchedUser');

        // Build tag score map: slug → solve count (only tags user has solved)
        const allTagGroups = [
          ...(tagData.data.matchedUser.tagProblemCounts?.fundamental || []),
          ...(tagData.data.matchedUser.tagProblemCounts?.intermediate || []),
          ...(tagData.data.matchedUser.tagProblemCounts?.advanced || []),
        ];
        const userTagMap = new Map(); // tagSlug → count solved
        for (const t of allTagGroups) {
          if (t.problemsSolved > 0) {
            userTagMap.set(t.tagSlug, t.problemsSolved);
          }
        }

        // Extract difficulty targets from submitStats
        const acStats =
          tagData.data.matchedUser.submitStatsGlobal?.acSubmissionNum || [];
        const targetCounts = {
          EASY: acStats.find((s) => s.difficulty === 'Easy')?.count || 0,
          MEDIUM: acStats.find((s) => s.difficulty === 'Medium')?.count || 0,
          HARD: acStats.find((s) => s.difficulty === 'Hard')?.count || 0,
        };

        leetcodeTagStats = targetCounts;

        if (userTagMap.size === 0) throw new Error('No tag data available');
        // Step 4b: Fetch ALL LeetCode free problems using the public REST endpoint
        const allProblemsResp = await fetchWithTimeout(
          'https://leetcode.com/api/problems/all/',
          { headers: this._buildHeaders() },
          30000,
          2,
          2000
        );
        const allProblemsData = await allProblemsResp.json();
        const allFreeProblems = (
          allProblemsData.stat_status_pairs || []
        ).filter((p) => !p.paid_only);

        const difficultyMap = { EASY: 'easy', MEDIUM: 'medium', HARD: 'hard' };
        for (const [lcDiff, tierStr] of Object.entries(difficultyMap)) {
          const target = targetCounts[lcDiff] || 0;
          if (target === 0) continue;

          // Count how many we already have for this difficulty from other sources
          const alreadyHave = Array.from(submissionMap.values()).filter((s) => {
            const d =
              s.difficulty_tier ||
              (s.difficulty_rating === 1
                ? 'easy'
                : s.difficulty_rating === 3
                  ? 'hard'
                  : 'medium');
            return d === tierStr;
          }).length;

          const needed = target - alreadyHave;
          if (needed <= 0) continue;

          // Filter the pre-fetched list by difficulty level
          const levelNum = lcDiff === 'EASY' ? 1 : lcDiff === 'MEDIUM' ? 2 : 3;
          const problems = allFreeProblems
            .filter((p) => p.difficulty?.level === levelNum)
            .map((p) => ({
              title: p.stat.question__title,
              titleSlug: p.stat.question__title_slug,
            }));

          // Pick top-N candidates (first `needed` problems of that difficulty)
          const picks = problems
            .filter((p) => !submissionMap.has(p.titleSlug))
            .slice(0, needed);

          for (const p of picks) {
            addSubmission({
              submission_id: `lc_inferred_${tierStr}_${p.titleSlug}`,
              problem_id: p.titleSlug,
              problem_name: p.title,
              problem_url: `https://leetcode.com/problems/${p.titleSlug}/`,
              verdict: 'AC',
              language: 'Unknown',
              submitted_at: null,
              difficulty_rating: levelNum,
              difficulty_tier: tierStr,
              tags: [], // Tags can be left empty for inferred problems
            });
          }
        }
      } catch (s4Error) {
        console.warn(`[LC] Source 4 error (non-fatal): ${s4Error.message}`);
      }

    // Convert map to array
    let submissions = Array.from(submissionMap.values());
    // ============================
    // ENRICH with tags and difficulty metadata
    // ============================
    try {
      // Filter slugs that look like real problem slugs (not contest-q1 style IDs)
      const realSlugs = submissions
        .map((s) => s.problem_id)
        .filter(
          (slug) =>
            slug &&
            !slug.includes('-q') &&
            !slug.match(/^[a-z]+-contest-\d+-q\d+$/)
        );

      if (realSlugs.length > 0) {
        // Batch-fetch metadata (processes in batches of 10)
        const metadataMap = await this.getProblemMetadataBatch(
          realSlugs.slice(0, 200)
        ); // Cap at 200 to avoid excessive API calls

        let enrichedCount = 0;
        submissions = submissions.map((sub) => {
          const meta = metadataMap.get(sub.problem_id);
          if (meta) {
            enrichedCount++;
            return {
              ...sub,
              difficulty_rating: meta.difficultyRating,
              tags: meta.tags || sub.tags,
              problem_name: meta.title || sub.problem_name,
              // Only override difficulty_tier if not already set by Source 4 inferred data
              difficulty_tier:
                sub.difficulty_tier ||
                (meta.difficultyRating === 1
                  ? 'easy'
                  : meta.difficultyRating === 3
                    ? 'hard'
                    : 'medium'),
            };
          }
          return sub;
        });
      }
    } catch (enrichError) {
      console.warn(
        `[LC] Metadata enrichment error (non-fatal): ${enrichError.message}`
      );
    }

    // Synthetic padding logic has been removed to prevent double-counting and "Unknown Problem" UI clutter.

    // Filter by timestamp if provided
    if (fromTimestamp && submissions.length > 0) {
      const cutoff = Date.parse(fromTimestamp);
      if (Number.isFinite(cutoff)) {
        submissions = submissions.filter((s) => {
          const submittedAt = Date.parse(s.submitted_at || '');
          return Number.isFinite(submittedAt) && submittedAt > cutoff;
        });
      }
    }

    if (submissions.length > 0) {
      await this.setCache(cacheKey, submissions, 300);
    }

    return submissions;
  }

  /**
   * LeetCode submissions are extension-only.
   * API sync intentionally returns no submissions.
   */
  async getSubmissions(_username, _fromTimestamp = null, _authToken = null) {
    // LeetCode submission ingestion is extension-only.
    return [];
  }

  /**
   * Map LeetCode difficulty string to numeric rating
   */
  mapDifficultyTier(difficulty) {
    if (!difficulty) return 'medium';
    if (typeof difficulty === 'number') {
      if (difficulty === 1) return 'easy';
      if (difficulty === 2) return 'medium';
      return 'hard';
    }
    const d = String(difficulty).toLowerCase();
    if (d === 'easy') return 'easy';
    if (d === 'medium') return 'medium';
    return 'hard';
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
