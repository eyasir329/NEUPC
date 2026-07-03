/**
 * @file cfgym — split from the problem-solving-services module.
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { PROBLEM_SOLVING_PLATFORM_IDS } from '@/app/_lib/services/problem-solving-platforms';
import {
  V2_TABLES,
  getPlatformCode,
  getPlatformId,
  isV2SchemaAvailable,
} from '@/app/_lib/services/problem-solving-v2-helpers';

import { CodeforcesService } from './codeforces';

// ============================================
// CF GYM SERVICE (uses Codeforces API)
// ============================================
export class CFGymService {
  constructor() {
    this.baseUrl = 'https://codeforces.com/api';
  }

  async getUserInfo(handle) {
    // Reuse Codeforces user info
    const cf = new CodeforcesService();
    return cf.getUserInfo(handle);
  }

  async getUserProfile(handle) {
    // CF Gym uses the same handle as Codeforces, so verify via Codeforces API
    return this.getUserInfo(handle);
  }

  async getSubmissions(handle, fromTimestamp = null) {
    const cacheKey = `cfgym_subs_${handle}_${fromTimestamp || 'all'}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    // Paginate through all submissions (CF API max 10000 per request)
    let allSubmissions = [];
    let from = 1;
    let hasMore = true;
    const BATCH_SIZE = 10000;

    while (hasMore) {
      const url = `${this.baseUrl}/user.status?handle=${handle}&from=${from}&count=${BATCH_SIZE}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        if (allSubmissions.length > 0) break;
        throw new Error(`Codeforces API error: ${data.comment}`);
      }

      if (!data.result || data.result.length === 0) break;

      const gymSubs = data.result
        .filter((sub) => sub.problem.contestId >= 100000)
        .map((sub) => ({
          submission_id: `gym_${sub.id}`,
          problem_id: `${sub.problem.contestId}${sub.problem.index}`,
          problem_name: sub.problem.name,
          problem_url: `https://codeforces.com/gym/${sub.problem.contestId}/problem/${sub.problem.index}`,
          contest_id: sub.problem.contestId?.toString(),
          verdict: this.mapVerdict(sub.verdict),
          language: sub.programmingLanguage,
          execution_time_ms: sub.timeConsumedMillis,
          memory_kb: Math.round((sub.memoryConsumedBytes || 0) / 1024),
          submitted_at: new Date(sub.creationTimeSeconds * 1000).toISOString(),
          difficulty_rating: sub.problem.rating || null,
          tags: sub.problem.tags || [],
        }));

      allSubmissions = allSubmissions.concat(gymSubs);

      if (fromTimestamp && data.result.length > 0) {
        const oldest = data.result[data.result.length - 1];
        if (
          new Date(oldest.creationTimeSeconds * 1000) <= new Date(fromTimestamp)
        ) {
          break;
        }
      }

      if (data.result.length < BATCH_SIZE) {
        hasMore = false;
      } else {
        from += BATCH_SIZE;
        await new Promise((resolve) => setTimeout(resolve, 12000));
      }
    }

    const filtered = fromTimestamp
      ? allSubmissions.filter(
          (s) => new Date(s.submitted_at) > new Date(fromTimestamp)
        )
      : allSubmissions;

    await this.setCache(cacheKey, filtered, 60);
    return filtered;
  }

  mapVerdict(verdict) {
    const map = {
      OK: 'AC',
      WRONG_ANSWER: 'WA',
      TIME_LIMIT_EXCEEDED: 'TLE',
      MEMORY_LIMIT_EXCEEDED: 'MLE',
      RUNTIME_ERROR: 'RE',
      COMPILATION_ERROR: 'CE',
    };
    return map[verdict] || 'PENDING';
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
