/**
 * @file Internal helpers and constants for the problem-solving actions.
 * Not server actions — plain module shared by the sibling action files.
 * @module problem-solving-actions/_helpers
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { PROBLEM_SOLVING_SYNC_PLATFORM_IDS } from '@/app/_lib/services/problem-solving-platforms';
import { AtCoderService, CFGymService, CSAcademyService, CSESService, CodeChefService, CodeforcesService, EOlympService, HackerRankService, KattisService, LeetCodeService, LightOJService, ProblemSolvingAggregator, SPOJService, TopCoderService, TophService, USACOService, UVAService, VJudgeService } from '@/app/_lib/services/problem-solving-services';
import { V2_TABLES, isV2SchemaAvailable } from '@/app/_lib/services/problem-solving-v2-helpers';

const SUPPORTED_PLATFORMS = PROBLEM_SOLVING_SYNC_PLATFORM_IDS;

// ============================================
// HELPER FUNCTIONS FOR NEW SCHEMA
// ============================================

/**
 * Calculate weighted score based on difficulty distribution
 */
function calculateWeightedScore(stats) {
  if (!stats) return 0;

  const weights = {
    solved_800: 1,
    solved_900: 1.2,
    solved_1000: 1.5,
    solved_1100: 1.8,
    solved_1200: 2,
    solved_1300: 2.5,
    solved_1400: 3,
    solved_1500: 3.5,
    solved_1600: 4,
    solved_1700: 4.5,
    solved_1800: 5,
    solved_1900: 6,
    solved_2000: 7,
    solved_2100: 8,
    solved_2200: 9,
    solved_2300: 10,
    solved_2400: 12,
    solved_2500_plus: 15,
  };

  let totalScore = 0;
  Object.entries(weights).forEach(([key, weight]) => {
    totalScore += (stats[key] || 0) * weight;
  });

  return totalScore;
}

/**
 * Generate daily activity from problem solves
 */
function generateDailyActivity(problemSolves) {
  const activityMap = new Map();

  // Initialize last 365 days with 0
  for (let i = 0; i < 365; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateKey = date.toISOString().split('T')[0];
    activityMap.set(dateKey, {
      activity_date: dateKey,
      problems_solved: 0,
      platforms_active: new Set(),
    });
  }

  // Count solves by date
  problemSolves.forEach((solve) => {
    const solveDate = new Date(solve.first_solved_at);
    const dateKey = solveDate.toISOString().split('T')[0];

    if (activityMap.has(dateKey)) {
      const activity = activityMap.get(dateKey);
      activity.problems_solved += 1;
      const platformCode = solve.problems?.platform;
      if (platformCode) activity.platforms_active.add(platformCode);
    }
  });

  // Convert to array and transform platforms_active to count
  return Array.from(activityMap.values())
    .map((activity) => ({
      ...activity,
      platforms_active: activity.platforms_active.size,
    }))
    .sort((a, b) => a.activity_date.localeCompare(b.activity_date));
}

function parseContestNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return null;

    const rankPart = raw.includes('/') ? raw.split('/')[0].trim() : raw;
    const numeric = rankPart.replace(/[^0-9.-]/g, '');
    if (!numeric) return null;

    const parsed = Number(numeric);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseProblemsPayload(value) {
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
}

function hasAttemptInProblemEntry(problem) {
  if (!problem || typeof problem !== 'object') return false;

  if (problem.attempted === true) return true;
  if (problem.solved === true || problem.solvedDuringContest === true) {
    return true;
  }

  if (problem.time !== null && problem.time !== undefined) return true;

  if (Array.isArray(problem.submissions) && problem.submissions.length > 0) {
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
}

function hasAttemptInProblemsPayload(value) {
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
}

function hasContestParticipation(record) {
  if (!record) return false;

  const attempted = parseContestNumber(
    record.problems_attempted ?? record.problemsAttempted
  );
  const solved = parseContestNumber(record.problems_solved ?? record.solved);
  const score = parseContestNumber(record.score);
  const problemsPayload = record.problems_data ?? record.problems;

  return (
    (attempted !== null && attempted > 0) ||
    (solved !== null && solved > 0) ||
    (score !== null && score > 0) ||
    hasAttemptInProblemsPayload(problemsPayload)
  );
}

function isLiveContestParticipation(record) {
  if (!record) return false;

  const isVirtual = record.is_virtual === true || record.isVirtual === true;
  return !isVirtual && hasContestParticipation(record);
}

function getMaxNonNegativeCount(...values) {
  return values.reduce((max, value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return max;
    }

    return Math.max(max, Math.floor(parsed));
  }, 0);
}

function isMissingUnsolvedAttemptsTableError(error) {
  if (!error) return false;

  const code = (error.code || '').toString();
  const message =
    `${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase();

  if (code === '42P01' || code === 'PGRST205') {
    return true;
  }

  return (
    message.includes('unsolved_attempts') &&
    (message.includes('does not exist') ||
      message.includes('could not find the table') ||
      message.includes('relation'))
  );
}

async function purgePlatformDataForUser({ userId, platformId }) {
  if (!userId || !platformId) {
    throw new Error('userId and platformId are required for platform cleanup');
  }

  const fetchAllIds = async (table, filters) => {
    const ids = [];
    const PAGE = 1000;
    let from = 0;
    while (true) {
      let q = supabaseAdmin.from(table).select('id').range(from, from + PAGE - 1);
      for (const [col, val] of Object.entries(filters)) q = q.eq(col, val);
      const { data: page, error } = await q;
      if (error) throw error;
      if (!page || page.length === 0) break;
      ids.push(...page.map((r) => r.id));
      if (page.length < PAGE) break;
      from += PAGE;
    }
    return ids;
  };

  const submissionIds = await fetchAllIds(V2_TABLES.SUBMISSIONS, {
    user_id: userId,
    platform_id: platformId,
  });

  let solveIds = [];
  {
    const PAGE = 1000;
    let from = 0;
    while (true) {
      const { data: page, error } = await supabaseAdmin
        .from(V2_TABLES.USER_SOLVES)
        .select('id, problems!inner(platform_id)')
        .eq('user_id', userId)
        .eq('problems.platform_id', platformId)
        .range(from, from + PAGE - 1);
      if (error) throw error;
      if (!page || page.length === 0) break;
      solveIds.push(...page.map((r) => r.id));
      if (page.length < PAGE) break;
      from += PAGE;
    }
  }

  let existingAttempts = [];
  let unsolvedAttemptStorageAvailable = true;

  try {
    const PAGE = 1000;
    let from = 0;
    while (true) {
      const { data: page, error } = await supabaseAdmin
        .from(V2_TABLES.UNSOLVED_ATTEMPTS)
        .select('id, external_problem_id')
        .eq('user_id', userId)
        .eq('platform_id', platformId)
        .range(from, from + PAGE - 1);
      if (error) {
        if (isMissingUnsolvedAttemptsTableError(error)) {
          unsolvedAttemptStorageAvailable = false;
          console.warn(
            '[CLEANUP] unsolved_attempts table not available; apply latest migrations to enable unsolved attempt cleanup.'
          );
        } else {
          throw error;
        }
        break;
      }
      if (!page || page.length === 0) break;
      existingAttempts = existingAttempts.concat(page);
      if (page.length < PAGE) break;
      from += PAGE;
    }
  } catch (existingAttemptsError) {
    if (isMissingUnsolvedAttemptsTableError(existingAttemptsError)) {
      unsolvedAttemptStorageAvailable = false;
    } else {
      throw existingAttemptsError;
    }
  }

  const attemptIds = (existingAttempts || []).map((row) => row.id);

  const deleteByIds = async (table, ids) => {
    if (!ids || ids.length === 0) return 0;
    const CHUNK_SIZE = 500;
    let deleted = 0;

    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE);
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .in('id', chunk);
      if (error) throw error;
      deleted += chunk.length;
    }

    return deleted;
  };

  const collectSolutionIdsByColumn = async (column, ids) => {
    if (!ids || ids.length === 0) return [];

    const CHUNK_SIZE = 500;
    const collected = [];

    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabaseAdmin
        .from(V2_TABLES.SOLUTIONS)
        .select('id')
        .in(column, chunk);

      if (error) throw error;
      if (data?.length) {
        for (const row of data) {
          if (row?.id) collected.push(row.id);
        }
      }
    }

    return collected;
  };

  const relatedSolutionIdsSet = new Set([
    ...(await collectSolutionIdsByColumn('submission_id', submissionIds)),
    ...(await collectSolutionIdsByColumn('user_solve_id', solveIds)),
  ]);

  const deletedSolutionCount = await deleteByIds(V2_TABLES.SOLUTIONS, [
    ...relatedSolutionIdsSet,
  ]);
  const deletedSubmissionCount = await deleteByIds(
    V2_TABLES.SUBMISSIONS,
    submissionIds
  );
  const deletedSolveCount = await deleteByIds(V2_TABLES.USER_SOLVES, solveIds);
  const deletedAttemptCount = unsolvedAttemptStorageAvailable
    ? await deleteByIds(V2_TABLES.UNSOLVED_ATTEMPTS, attemptIds)
    : 0;

  let deletedPlatformStats = false;
  const { error: platformStatsDeleteError } = await supabaseAdmin
    .from(V2_TABLES.USER_PLATFORM_STATS)
    .delete()
    .eq('user_id', userId)
    .eq('platform_id', platformId);

  if (platformStatsDeleteError) throw platformStatsDeleteError;
  deletedPlatformStats = true;

  // Refresh aggregate stats and leaderboard after cleanup.
  const aggregator = new ProblemSolvingAggregator();
  await aggregator.updateUserStatistics(userId, true);
  await rebuildLeaderboard();

  const totalDeleted =
    deletedSolutionCount +
    deletedSubmissionCount +
    deletedSolveCount +
    deletedAttemptCount +
    (deletedPlatformStats ? 1 : 0);

  return {
    deletedSolutions: deletedSolutionCount,
    deletedSubmissions: deletedSubmissionCount,
    deletedSolves: deletedSolveCount,
    deletedAttempts: deletedAttemptCount,
    deletedPlatformStats,
    unsolvedAttemptStorageAvailable,
    totalDeleted,
  };
}

const PLATFORM_CANONICAL_ALIASES = {
  codeforces: 'codeforces',
  atcoder: 'atcoder',
  leetcode: 'leetcode',
  codechef: 'codechef',
  spoj: 'spoj',
  uva: 'uva',
  vjudge: 'vjudge',
  cses: 'cses',
  toph: 'toph',
  hackerrank: 'hackerrank',
  kattis: 'kattis',
  lightoj: 'lightoj',
  topcoder: 'topcoder',
  ural: 'ural',
  timus: 'ural',
  poj: 'poj',
};

const VJUDGE_ORIGIN_ALIASES = {
  codeforces: 'codeforces',
  codeforce: 'codeforces',
  cf: 'codeforces',
  atcoder: 'atcoder',
  ac: 'atcoder',
  leetcode: 'leetcode',
  lc: 'leetcode',
  codechef: 'codechef',
  cc: 'codechef',
  spoj: 'spoj',
  uva: 'uva',
  ural: 'ural',
  timus: 'ural',
  poj: 'poj',
  cses: 'cses',
  toph: 'toph',
  hackerrank: 'hackerrank',
  kattis: 'kattis',
  lightoj: 'lightoj',
  topcoder: 'topcoder',
};

function unpackSingleRelation(value) {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function normalizeIdentifierToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9._-]/g, '');
}

function normalizeProblemUrlForKey(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    return `${parsed.hostname.toLowerCase()}${parsed.pathname
      .toLowerCase()
      .replace(/\/+$/, '')}`;
  } catch {
    return raw
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('?')[0]
      .split('#')[0]
      .replace(/\/+$/, '');
  }
}

function getCanonicalPlatformAlias(platformCode) {
  const normalized = normalizeIdentifierToken(platformCode);
  return PLATFORM_CANONICAL_ALIASES[normalized] || normalized || 'unknown';
}

function getCanonicalProblemKey({
  platformCode,
  externalId,
  problemUrl,
  name,
}) {
  const platformAlias = getCanonicalPlatformAlias(platformCode);
  const normalizedExternalId = normalizeIdentifierToken(externalId);

  if (platformAlias === 'vjudge' && normalizedExternalId.includes('-')) {
    const [originRaw, ...restParts] = normalizedExternalId.split('-');
    const origin = VJUDGE_ORIGIN_ALIASES[normalizeIdentifierToken(originRaw)];
    const normalizedOriginId = normalizeIdentifierToken(restParts.join('-'));

    if (origin && normalizedOriginId) {
      return `${origin}:${normalizedOriginId}`;
    }
  }

  if (normalizedExternalId) {
    return `${platformAlias}:${normalizedExternalId}`;
  }

  const normalizedUrl = normalizeProblemUrlForKey(problemUrl);
  if (normalizedUrl) {
    return `url:${normalizedUrl}`;
  }

  const normalizedName = normalizeIdentifierToken(name);
  if (normalizedName) {
    return `${platformAlias}:name:${normalizedName}`;
  }

  return null;
}

function getUtcDateKey(dateValue) {
  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function calculateCurrentStreak(dateKeys) {
  if (!dateKeys || dateKeys.size === 0) return 0;

  const now = new Date();
  const todayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const yesterdayUtc = new Date(todayUtc);
  yesterdayUtc.setUTCDate(yesterdayUtc.getUTCDate() - 1);

  const todayKey = todayUtc.toISOString().slice(0, 10);
  const yesterdayKey = yesterdayUtc.toISOString().slice(0, 10);

  let cursor = null;
  if (dateKeys.has(todayKey)) {
    cursor = todayUtc;
  } else if (dateKeys.has(yesterdayKey)) {
    cursor = yesterdayUtc;
  } else {
    return 0;
  }

  let streak = 0;
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!dateKeys.has(key)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

function getDifficultyWeight(rating) {
  const value = Number(rating);
  if (!Number.isFinite(value)) return 1;
  if (value >= 2500) return 15;
  if (value >= 2400) return 12;
  if (value >= 2300) return 10;
  if (value >= 2200) return 9;
  if (value >= 2100) return 8;
  if (value >= 2000) return 7;
  if (value >= 1900) return 6;
  if (value >= 1800) return 5;
  if (value >= 1700) return 4.5;
  if (value >= 1600) return 4;
  if (value >= 1500) return 3.5;
  if (value >= 1400) return 3;
  if (value >= 1300) return 2.5;
  if (value >= 1200) return 2;
  if (value >= 1100) return 1.8;
  if (value >= 1000) return 1.5;
  if (value >= 900) return 1.2;
  return 1;
}

function computeDashboardStatMetrics(
  solvedRows,
  effectiveTotalSubmissions,
  fallbackStats
) {
  const uniqueByCanonicalProblem = new Map();

  (solvedRows || []).forEach((solve) => {
    const problem = unpackSingleRelation(solve.problems);
    const platform = unpackSingleRelation(problem?.platforms);

    const canonicalProblemKey = getCanonicalProblemKey({
      platformCode: platform?.code,
      externalId: problem?.external_id || problem?.problem_id,
      problemUrl: problem?.url || problem?.problem_url,
      name: problem?.name || problem?.problem_name,
    });

    if (!canonicalProblemKey) return;

    const existing = uniqueByCanonicalProblem.get(canonicalProblemKey);
    const candidateTimestamp = Date.parse(solve.first_solved_at || '');
    const existingTimestamp = Date.parse(existing?.first_solved_at || '');
    const candidateIsValid = Number.isFinite(candidateTimestamp);
    const existingIsValid = Number.isFinite(existingTimestamp);

    if (!existing) {
      uniqueByCanonicalProblem.set(canonicalProblemKey, {
        first_solved_at: solve.first_solved_at,
        difficulty_rating: problem?.difficulty_rating,
      });
      return;
    }

    if (
      candidateIsValid &&
      (!existingIsValid || candidateTimestamp < existingTimestamp)
    ) {
      uniqueByCanonicalProblem.set(canonicalProblemKey, {
        first_solved_at: solve.first_solved_at,
        difficulty_rating: problem?.difficulty_rating,
      });
    }
  });

  const fallbackSolved = getMaxNonNegativeCount(fallbackStats?.total_solved);
  const fallbackSubmissions = getMaxNonNegativeCount(
    effectiveTotalSubmissions,
    fallbackStats?.total_submissions,
    fallbackStats?.total_solutions
  );
  const fallbackAcceptanceRate =
    fallbackSolved > 0
      ? Math.round(
          (fallbackSolved / Math.max(fallbackSubmissions || 1, 1)) * 100
        )
      : 0;
  const fallbackWeightedScore = Math.round(
    Number.isFinite(Number(fallbackStats?.weighted_score))
      ? Number(fallbackStats?.weighted_score)
      : calculateWeightedScore(fallbackStats || {})
  );

  if (uniqueByCanonicalProblem.size === 0) {
    return {
      total_solved: fallbackSolved,
      current_streak: getMaxNonNegativeCount(fallbackStats?.current_streak),
      acceptance_rate: fallbackAcceptanceRate,
      weighted_score: fallbackWeightedScore,
    };
  }

  const solvedDateKeys = new Set(
    Array.from(uniqueByCanonicalProblem.values())
      .map((entry) => getUtcDateKey(entry.first_solved_at))
      .filter(Boolean)
  );

  let weightedScore = 0;
  uniqueByCanonicalProblem.forEach((entry) => {
    weightedScore += getDifficultyWeight(entry.difficulty_rating);
  });

  const uniqueSolvedCount = uniqueByCanonicalProblem.size;
  const acceptanceRate =
    uniqueSolvedCount > 0
      ? Math.round(
          (uniqueSolvedCount /
            Math.max(
              getMaxNonNegativeCount(effectiveTotalSubmissions) || 1,
              1
            )) *
            100
        )
      : 0;

  return {
    total_solved: uniqueSolvedCount,
    current_streak: calculateCurrentStreak(solvedDateKeys),
    acceptance_rate: acceptanceRate,
    weighted_score: Math.round(weightedScore),
  };
}

/**
 * Get latest sync status per platform from merged sync_jobs table.
 * Provides a backward-compatible shape used by existing UI logic.
 */
async function getUserSyncStatusByPlatform(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from(V2_TABLES.SYNC_JOBS)
      .select(
        'platform_id, status, inserted_items, completed_at, last_processed_at, error_message, created_at, platforms!inner(code)'
      )
      .eq('user_id', userId)
      .eq('job_type', 'submissions')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const byPlatform = new Map();
    (data || []).forEach((job) => {
      const platform = job.platforms?.code;
      if (!platform || byPlatform.has(platform)) return;

      byPlatform.set(platform, {
        platform,
        sync_status: job.status || 'pending',
        total_inserted: job.inserted_items || 0,
        sync_completed_at: job.completed_at || null,
        last_synced_at: job.last_processed_at || job.completed_at || null,
        error_message: job.error_message || null,
      });
    });

    return Array.from(byPlatform.values());
  } catch (e) {
    console.error('Error fetching sync jobs:', e.message);
    return [];
  }
}

/**
 * Transform contest history to the format expected by components
 * Maps contest_history table columns to component-expected field names
 */
// Score a transformed contest by data completeness, for picking the best
// row among duplicates (same contest stored under different external IDs).
function contestCompletenessScore(c) {
  let score = 0;
  if (c.totalParticipants != null) score += 8;
  if (Array.isArray(c.problems) && c.problems.length > 0) score += 4;
  if (c.rank != null) score += 2;
  if (c.newRating != null) score += 1;
  return score;
}

function transformContestHistory(contestHistoryData) {
  const allowedPlatforms = ['codeforces', 'codechef', 'atcoder', 'leetcode'];
  const transformed = (contestHistoryData || [])
    .map((ch) => {
      // Parse problems_data - handle both direct objects and double-stringified data
      let problems = null;
      if (ch.problems_data) {
        try {
          let data = ch.problems_data;
          // If it's a string, parse it
          if (typeof data === 'string') {
            data = JSON.parse(data);
          }
          // Handle double-stringified case (jsonb stored as JSON string)
          // This happens when the data looks like: "[{\"label\":\"A\"...}]" (starts with quote)
          if (typeof data === 'string') {
            data = JSON.parse(data);
          }
          problems = Array.isArray(data) ? data : null;
        } catch (e) {
          console.warn('Failed to parse problems_data:', e);
        }
      }

      return {
        ...ch,
        // Map database fields to component-expected fields
        // contest_history uses platform code from join, not platform_id directly
        platform: ch.platform || ch.platforms?.code,
        date: ch.contest_date,
        endDate: ch.contest_end_date,
        name: ch.contest_name,
        contestId: ch.external_contest_id,
        platformContestId: ch.platform_contest_id,
        ratingChange: ch.rating_change,
        newRating: ch.new_rating,
        oldRating: ch.old_rating,
        solved: ch.problems_solved,
        problemsAttempted: ch.problems_attempted,
        totalProblems: ch.total_problems || ch.problems_attempted,
        problems: problems,
        rank: ch.rank,
        totalParticipants: ch.total_participants,
        score: ch.score,
        maxScore: ch.max_score,
        penalty: ch.penalty,
        isRated: ch.is_rated,
        isVirtual: ch.is_virtual,
        division: ch.division,
        duration: ch.duration_minutes,
        // Construct contest URL based on platform
        url:
          ch.contest_url ||
          getContestUrl(
            ch.platform || ch.platforms?.code,
            ch.platform_contest_id || ch.external_contest_id
          ),
      };
    })
    .filter((ch) => allowedPlatforms.includes(ch.platform));

  // Dedupe rows that represent the same contest stored under different
  // external IDs (legacy native-API rows vs CLIST rows). Group by
  // platform + native contest id, keep the most complete row.
  const bestByContest = new Map();
  for (const c of transformed) {
    const key = `${c.platform}:${c.platformContestId || c.contestId}`;
    const existing = bestByContest.get(key);
    if (
      !existing ||
      contestCompletenessScore(c) > contestCompletenessScore(existing)
    ) {
      bestByContest.set(key, c);
    }
  }
  return Array.from(bestByContest.values());
}

/**
 * Transform rating history to the format expected by RatingChart component
 * Maps rating_history table columns to component-expected field names
 */
function transformRatingHistory(ratingHistoryData) {
  const allowedPlatforms = ['codeforces', 'codechef', 'atcoder', 'leetcode'];
  return (ratingHistoryData || [])
    .map((rh) => ({
      ...rh,
      // Map database fields to component-expected fields
      platform: rh.platform || rh.platforms?.code,
      date: rh.recorded_at,
      rating: rh.rating,
      change: rh.rating_change,
      // Contest info from joined contest_history if available
      contestName: rh.contest_history?.contest_name,
      contestId: rh.contest_history?.external_contest_id,
      contestUrl: rh.contest_history?.contest_url,
      rank: rh.contest_history?.rank,
      totalParticipants: rh.contest_history?.total_participants,
      problemsSolved: rh.contest_history?.problems_solved,
      problemsAttempted: rh.contest_history?.problems_attempted,
      totalProblems: rh.contest_history?.total_problems,
    }))
    .filter((rh) => allowedPlatforms.includes(rh.platform));
}

/**
 * Get contest URL based on platform and contest ID
 */
function getContestUrl(platform, contestId) {
  if (!contestId) return null;

  const urlTemplates = {
    codeforces: `https://codeforces.com/contest/${contestId}`,
    atcoder: `https://atcoder.jp/contests/${contestId}`,
    codechef: `https://www.codechef.com/${contestId}`,
    leetcode: `https://leetcode.com/contest/${contestId}`,
    topcoder: `https://www.topcoder.com/challenges/${contestId}`,
    hackerrank: `https://www.hackerrank.com/contests/${contestId}`,
  };

  return urlTemplates[platform] || null;
}

// ============================================
// SMART MERGE HELPERS FOR CONTEST SYNC
// ============================================

/**
 * Determine if a new value is "better" than an existing value
 * Returns true if newVal should replace existingVal
 *
 * Rules:
 * - If existing is null/undefined/0 and new has a value, use new
 * - If new is null/undefined, keep existing
 * - For numbers: prefer non-zero values, then prefer larger values for counts
 * - For strings: prefer non-empty values
 * - For booleans: prefer true (rated contests, etc.)
 */
function isValueBetter(existingVal, newVal, fieldName) {
  // If new value is null/undefined, keep existing
  if (newVal === null || newVal === undefined) {
    return false;
  }

  // If existing is null/undefined/empty, new is better
  if (existingVal === null || existingVal === undefined) {
    return true;
  }

  // For strings, prefer non-empty
  if (typeof newVal === 'string') {
    if (!existingVal || existingVal.trim() === '') {
      return newVal.trim() !== '';
    }
    // Don't overwrite existing non-empty strings unless it's a generic name
    if (
      fieldName === 'contest_name' &&
      existingVal.match(/^Contest #\d+$/) &&
      !newVal.match(/^Contest #\d+$/)
    ) {
      return true; // Replace generic "Contest #123" with real name
    }
    return false; // Keep existing string
  }

  // For numbers
  if (typeof newVal === 'number') {
    // If existing is 0 and new is non-zero, use new
    if (existingVal === 0 && newVal !== 0) {
      return true;
    }
    // For ranks and solved counts - keep existing non-zero values
    if (fieldName === 'rank' || fieldName === 'problems_solved') {
      return existingVal === 0 || !existingVal;
    }
    // For participant counts - prefer the larger (more complete) value from CLIST
    if (fieldName === 'total_participants') {
      return newVal > existingVal;
    }
    // For scores, prefer higher
    if (fieldName === 'score' || fieldName === 'max_score') {
      return newVal > existingVal;
    }
    // For other numbers, don't overwrite existing
    return false;
  }

  // For booleans - don't change existing
  if (typeof newVal === 'boolean') {
    return false;
  }

  // Default: don't overwrite
  return false;
}

/**
 * Merge problems_data arrays intelligently
 * - Preserves upsolve status from existing data
 * - Adds any new problems from new data
 * - Updates status if new data shows solved (during contest)
 *
 * @param {Array|null} existingProblems - Existing problems_data from DB
 * @param {Array|null} newProblems - New problems_data from API
 * @returns {Array|null} - Merged problems array
 */
function mergeProblemsData(existingProblems, newProblems) {
  // If no existing data, use new data
  if (!existingProblems || !Array.isArray(existingProblems)) {
    return newProblems;
  }

  // If no new data, keep existing
  if (!newProblems || !Array.isArray(newProblems)) {
    return existingProblems;
  }

  // Create a map of existing problems by label (A, B, C, etc.)
  const existingMap = new Map();
  existingProblems.forEach((p) => {
    const key = p.label || p.index || p.name;
    if (key) {
      existingMap.set(key, { ...p });
    }
  });

  // Merge in new problems
  newProblems.forEach((newP) => {
    const key = newP.label || newP.index || newP.name;
    if (!key) return;

    const existing = existingMap.get(key);

    if (!existing) {
      // New problem not in existing data - add it
      existingMap.set(key, { ...newP });
    } else {
      // Problem exists - merge intelligently
      const merged = { ...existing };

      // Determine solve, upsolve, and attempted status by combining existing and new
      const isSolvedNew = newP.solved === true || newP.solvedDuringContest === true || newP.upsolve === true || newP.isUpsolve === true;
      const isSolvedExisting = existing.solved === true || existing.solvedDuringContest === true || existing.upsolve === true || existing.isUpsolve === true;
      
      const isUpsolveNew = newP.upsolve === true || newP.isUpsolve === true;
      const isUpsolveExisting = existing.upsolve === true || existing.isUpsolve === true;

      if (isSolvedNew || isSolvedExisting) {
        merged.solved = true;
      }
      
      if (isUpsolveNew || isUpsolveExisting) {
        merged.upsolve = true;
        merged.isUpsolve = true;
        merged.solvedDuringContest = false;
      } else if (newP.solvedDuringContest === true || existing.solvedDuringContest === true) {
        merged.solvedDuringContest = true;
        merged.upsolve = false;
        merged.isUpsolve = false;
      } else if (isSolvedNew && !isUpsolveNew) {
        merged.solvedDuringContest = true;
        merged.upsolve = false;
        merged.isUpsolve = false;
      }

      if (newP.attempted || existing.attempted || isSolvedNew || isSolvedExisting) {
        merged.attempted = true;
      }

      // Copy over or update specific values
      if (newP.problemId) merged.problemId = newP.problemId;
      if (newP.url) merged.url = newP.url;
      if (newP.name) merged.name = newP.name;
      if (newP.rating) merged.rating = newP.rating;
      if (newP.time || newP.solveTime) merged.time = newP.time || newP.solveTime;
      if (newP.result) merged.result = newP.result;
      
      // Update wrong attempts (prefer the higher count or newer count)
      const wrongNew = newP.wrongAttempts || 0;
      const wrongExist = existing.wrongAttempts || 0;
      merged.wrongAttempts = Math.max(wrongNew, wrongExist);

      existingMap.set(key, merged);
    }
  });

  // Convert back to array and sort by label
  return Array.from(existingMap.values()).sort((a, b) => {
    const labelA = a.label || a.index || '';
    const labelB = b.label || b.index || '';
    return labelA.localeCompare(labelB);
  });
}

/**
 * Build a smart update object that only includes fields that should be updated
 * @param {Object} existingRecord - Full existing record from DB
 * @param {Object} newData - New data from API
 * @returns {Object|null} - Update object or null if no updates needed
 */
function buildSmartUpdate(existingRecord, newData) {
  const updates = {};
  let hasUpdates = false;

  // Fields to check for smart update
  const fieldsToCheck = [
    'contest_name',
    'contest_url',
    'contest_end_date',
    'duration_minutes',
    'rank',
    'total_participants',
    'score',
    'max_score',
    'problems_solved',
    'problems_attempted',
    'total_problems',
    'penalty',
    'platform_contest_id',
    'old_rating',
    'new_rating',
    'rating_change',
    'is_rated',
    'is_virtual',
    'division',
  ];

  // Check each field
  for (const field of fieldsToCheck) {
    if (isValueBetter(existingRecord[field], newData[field], field)) {
      updates[field] = newData[field];
      hasUpdates = true;
    }
  }

  // Special handling for problems_data - merge arrays
  const mergedProblems = mergeProblemsData(
    existingRecord.problems_data,
    newData.problems_data
  );

  // Check if problems_data actually changed
  const existingJson = JSON.stringify(existingRecord.problems_data || []);
  const mergedJson = JSON.stringify(mergedProblems || []);

  if (mergedJson !== existingJson && mergedProblems) {
    updates.problems_data = mergedProblems;
    hasUpdates = true;
  }

  return hasUpdates ? updates : null;
}

// ============================================
// GET USER DATA
// ============================================

/**
 * Get current user's problem solving data (NEW SCHEMA)
 *
 * Updated to work with robust schema:
 * - user_handles (simplified for Codeforces)
 * - user_problem_stats (aggregated statistics)
 * - user_problem_solves (solve history)
 * - solutions (solution versions)
 * - problem_submissions (ALL submissions with any verdict)
 * - contest_participations (contest history)
 */
function normalizeHandleForPlatform(platform, rawHandle) {
  const trimmed = String(rawHandle || '').trim();
  if (!trimmed) return '';

  if (platform !== 'leetcode') {
    return trimmed;
  }

  let normalized = trimmed.replace(/^@+/, '');
  normalized = normalized.replace(
    /^(?:https?:\/\/)?(?:www\.)?leetcode\.(?:com|cn)\//i,
    ''
  );
  normalized = normalized.replace(/^(?:u|profile)\//i, '');
  normalized = normalized.split(/[/?#]/)[0].replace(/^@+/, '').trim();
  return normalized;
}

/**
 * Verify that a handle exists on a platform
 * @param {string} platform - Platform ID
 * @param {string} handle - Handle to verify
 */
async function verifyHandle(platform, handle) {
  switch (platform) {
    case 'codeforces': {
      const service = new CodeforcesService();
      return await service.getUserInfo(handle);
    }
    case 'atcoder': {
      const service = new AtCoderService();
      return await service.getUserStats(handle);
    }
    case 'leetcode': {
      const service = new LeetCodeService();
      return await service.getUserProfile(handle);
    }
    case 'toph': {
      const service = new TophService();
      return await service.getUserProfile(handle);
    }
    case 'codechef': {
      const service = new CodeChefService();
      return await service.getUserProfile(handle);
    }
    case 'topcoder': {
      const service = new TopCoderService();
      return await service.getUserProfile(handle);
    }
    case 'hackerrank': {
      const service = new HackerRankService();
      return await service.getUserProfile(handle);
    }
    case 'kattis': {
      const service = new KattisService();
      return await service.getUserProfile(handle);
    }
    case 'lightoj': {
      const service = new LightOJService();
      return await service.getUserProfile(handle);
    }
    case 'uva': {
      const service = new UVAService();
      return await service.getUserProfile(handle);
    }
    case 'spoj': {
      const service = new SPOJService();
      return await service.getUserProfile(handle);
    }
    case 'vjudge': {
      const service = new VJudgeService();
      return await service.getUserProfile(handle);
    }
    case 'cfgym': {
      const service = new CFGymService();
      return await service.getUserInfo(handle);
    }
    case 'csacademy': {
      const service = new CSAcademyService();
      return await service.getUserProfile(handle);
    }
    case 'eolymp': {
      const service = new EOlympService();
      return await service.getUserProfile(handle);
    }
    case 'usaco': {
      const service = new USACOService();
      return await service.getUserProfile(handle);
    }
    case 'cses': {
      const service = new CSESService();
      return await service.getUserProfile(handle);
    }
    default:
      // For platforms without verification, just accept the handle
      return { handle };
  }
}

/**
 * Rebuild the leaderboard cache with current rankings (NEW SCHEMA)
 * This is called after sync operations to update user rankings
 */
async function rebuildLeaderboard() {
  try {
    // Check if V2 schema is available
    const useV2 = await isV2SchemaAvailable();
    const statsTable = useV2 ? V2_TABLES.USER_STATS : 'user_problem_stats';

    // Get all user statistics from stats table
    const { data: users, error: usersError } = await supabaseAdmin
      .from(statsTable)
      .select(
        'user_id, total_solved, total_solutions, current_streak, solved_this_week, solved_this_month, weighted_score'
      )
      .gt('total_solved', 0)
      .order('total_solved', { ascending: false });

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      return { success: true, updated: 0 };
    }

    // Calculate ranked leaderboards for global, weekly, and monthly
    const globalRanked = [...users]
      .sort((a, b) => (b.weighted_score || 0) - (a.weighted_score || 0))
      .map((user, index) => ({ ...user, global_rank: index + 1 }));

    const weeklyRanked = [...users]
      .sort((a, b) => (b.solved_this_week || 0) - (a.solved_this_week || 0))
      .map((user, index) => ({ ...user, weekly_rank: index + 1 }));

    const monthlyRanked = [...users]
      .sort((a, b) => (b.solved_this_month || 0) - (a.solved_this_month || 0))
      .map((user, index) => ({ ...user, monthly_rank: index + 1 }));

    // Map ranks back to user_id
    const globalRankMap = new Map(
      globalRanked.map((u) => [u.user_id, u.global_rank])
    );
    const weeklyRankMap = new Map(
      weeklyRanked.map((u) => [u.user_id, u.weekly_rank])
    );
    const monthlyRankMap = new Map(
      monthlyRanked.map((u) => [u.user_id, u.monthly_rank])
    );

    // Build leaderboard cache records
    const leaderboardRecords = users.map((user) => ({
      user_id: user.user_id,
      global_rank: globalRankMap.get(user.user_id) || null,
      weekly_rank: weeklyRankMap.get(user.user_id) || null,
      monthly_rank: monthlyRankMap.get(user.user_id) || null,
      total_score: user.weighted_score || 0,
      weekly_score: (user.solved_this_week || 0) * 1, // Simple multiplier for weekly
      monthly_score: (user.solved_this_month || 0) * 1, // Simple multiplier for monthly
      total_solved: user.total_solved,
      weekly_solved: user.solved_this_week || 0,
      monthly_solved: user.solved_this_month || 0,
      updated_at: new Date().toISOString(),
    }));

    // Batch upsert to leaderboard_cache
    if (leaderboardRecords.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from('leaderboard_cache')
        .upsert(leaderboardRecords, {
          onConflict: 'user_id',
        });

      if (upsertError) {
        console.warn('leaderboard_cache upsert error:', upsertError.message);
      } else {
        console.log(`[LEADERBOARD] Updated ${leaderboardRecords.length} users`);
      }
    }

    return { success: true, updated: users.length };
  } catch (error) {
    // Error rebuilding leaderboard
    throw error;
  }
}

function _getDefaultStatistics() {
  return {
    total_solved: 0,
    total_submissions: 0,
    acceptance_rate: 0,
    current_streak: 0,
    longest_streak: 0,
    easy_solved: 0,
    medium_solved: 0,
    hard_solved: 0,
    expert_solved: 0,
    solved_this_week: 0,
    solved_this_month: 0,
    weighted_score: 0,
    platform_stats: {
      codeforces: { solved: 0, rating: 0, max_rating: 0, contests: 0 },
      atcoder: { solved: 0, rating: 0, max_rating: 0, contests: 0 },
      leetcode: { solved: 0, easy: 0, medium: 0, hard: 0 },
      toph: { solved: 0, rating: 0, contests: 0 },
      cses: { solved: 0 },
      codechef: { solved: 0, rating: 0, max_rating: 0, stars: 0, contests: 0 },
      topcoder: { solved: 0, rating: 0, max_rating: 0 },
      hackerrank: { solved: 0, badges: 0, certificates: 0 },
      kattis: { solved: 0, score: 0, rank: 0 },
      lightoj: { solved: 0 },
      uva: { solved: 0, submissions: 0 },
      spoj: { solved: 0, rank: 0 },
      vjudge: { solved: 0, acRecords: {} },
      cfgym: { solved: 0, contests: 0 },
      csacademy: { solved: 0, rating: 0 },
      eolymp: { solved: 0, rating: 0 },
      usaco: { solved: 0, division: null },
    },
  };
}

/**
 * Fetch every problem a user has touched (solved or attempted).
 * Returns a flat list deduplicated by platform+problem_id, each with a
 * `solved` boolean derived from whether any AC submission exists.
 */

export {
  SUPPORTED_PLATFORMS,
  PLATFORM_CANONICAL_ALIASES,
  VJUDGE_ORIGIN_ALIASES,
  calculateWeightedScore,
  generateDailyActivity,
  parseContestNumber,
  parseProblemsPayload,
  hasAttemptInProblemEntry,
  hasAttemptInProblemsPayload,
  hasContestParticipation,
  isLiveContestParticipation,
  getMaxNonNegativeCount,
  isMissingUnsolvedAttemptsTableError,
  purgePlatformDataForUser,
  unpackSingleRelation,
  normalizeIdentifierToken,
  normalizeProblemUrlForKey,
  getCanonicalPlatformAlias,
  getCanonicalProblemKey,
  getUtcDateKey,
  calculateCurrentStreak,
  getDifficultyWeight,
  computeDashboardStatMetrics,
  getUserSyncStatusByPlatform,
  contestCompletenessScore,
  transformContestHistory,
  transformRatingHistory,
  getContestUrl,
  isValueBetter,
  mergeProblemsData,
  buildSmartUpdate,
  normalizeHandleForPlatform,
  verifyHandle,
  rebuildLeaderboard,
  _getDefaultStatistics,
};
