/**
 * @file uva — split from the problem-solving-services module.
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
// UVA SERVICE (using uHunt API)
// ============================================
export class UVAService {
  constructor() {
    this.apiBase = 'https://uhunt.onlinejudge.org/api';
  }

  async getUserProfile(userId) {
    const cacheKey = `uva_profile_${userId}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    // First get user ID if username provided
    let numericId = userId;
    if (isNaN(userId)) {
      const idRes = await fetchWithTimeout(
        `${this.apiBase}/uname2uid/${userId}`
      );
      numericId = await idRes.text();
      if (numericId === '0') {
        throw new Error('UVA user not found');
      }
    }

    const response = await fetchWithTimeout(
      `${this.apiBase}/subs-user/${numericId}`
    );

    if (!response.ok) {
      throw new Error('UVA user not found');
    }

    const data = await response.json();
    const solved = new Set();

    // Count unique accepted problems
    (data.subs || []).forEach((sub) => {
      if (sub[2] === 90) {
        // 90 = Accepted
        solved.add(sub[1]);
      }
    });

    const profile = {
      userId: numericId,
      totalSolved: solved.size,
      totalSubmissions: data.subs?.length || 0,
    };

    await this.setCache(cacheKey, profile, 600);
    return profile;
  }

  async getSubmissions(userId, fromTimestamp = null) {
    const cacheKey = `uva_subs_${userId}_${fromTimestamp || 'all'}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    // Get numeric user ID
    let numericId = userId;
    if (isNaN(userId)) {
      const idRes = await fetchWithTimeout(
        `${this.apiBase}/uname2uid/${userId}`
      );
      numericId = await idRes.text();
    }

    const response = await fetchWithTimeout(
      `${this.apiBase}/subs-user/${numericId}`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    // Get problem info for names
    const pResponse = await fetchWithTimeout(`${this.apiBase}/p`);
    const problems = pResponse.ok ? await pResponse.json() : [];
    const problemMap = {};
    problems.forEach((p) => {
      problemMap[p[0]] = { num: p[1], title: p[2] };
    });

    const submissions = (data.subs || [])
      .filter((sub) => sub[2] === 90) // Accepted
      .map((sub) => {
        const prob = problemMap[sub[1]] || {};
        return {
          submission_id: sub[0]?.toString(),
          problem_id: prob.num?.toString() || sub[1]?.toString(),
          problem_name: prob.title || `Problem ${sub[1]}`,
          problem_url: `https://onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=${sub[1]}`,
          verdict: 'AC',
          language: this.mapLanguage(sub[5]),
          submitted_at: new Date(sub[4] * 1000).toISOString(),
        };
      });

    const filtered = fromTimestamp
      ? submissions.filter(
          (s) => new Date(s.submitted_at) > new Date(fromTimestamp)
        )
      : submissions;

    await this.setCache(cacheKey, filtered, 120);
    return filtered;
  }

  mapLanguage(code) {
    const langs = {
      1: 'ANSI C',
      2: 'Java',
      3: 'C++',
      4: 'Pascal',
      5: 'C++11',
      6: 'Python',
    };
    return langs[code] || 'Unknown';
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
