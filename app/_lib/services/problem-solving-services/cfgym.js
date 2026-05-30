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

    // Get gym submissions only (contest ID >= 100000)
    const response = await fetch(
      `${this.baseUrl}/user.status?handle=${handle}&count=100000`
    );
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Codeforces API error: ${data.comment}`);
    }

    const submissions = data.result
      .filter((sub) => sub.problem.contestId >= 100000) // Gym contests
      .map((sub) => ({
        submission_id: `gym_${sub.id}`,
        problem_id: `${sub.problem.contestId}${sub.problem.index}`,
        problem_name: sub.problem.name,
        problem_url: `https://codeforces.com/gym/${sub.problem.contestId}/problem/${sub.problem.index}`,
        contest_id: sub.problem.contestId?.toString(),
        verdict: this.mapVerdict(sub.verdict),
        language: sub.programmingLanguage,
        submitted_at: new Date(sub.creationTimeSeconds * 1000).toISOString(),
      }));

    const filtered = fromTimestamp
      ? submissions.filter(
          (s) => new Date(s.submitted_at) > new Date(fromTimestamp)
        )
      : submissions;

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
