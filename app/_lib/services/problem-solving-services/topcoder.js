/**
 * @file topcoder — split from the problem-solving-services module.
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
// TOPCODER SERVICE
// ============================================
export class TopCoderService {
  constructor() {
    this.apiBase = 'https://api.topcoder.com/v5';
    this.profilesBase = 'https://profiles.topcoder.com';
  }

  async getUserProfile(handle) {
    const cacheKey = `tc_profile_${handle}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    // Try the API first
    try {
      const response = await fetchWithTimeout(
        `${this.apiBase}/members/${handle}`,
        {
          headers: {
            Accept: 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const profile = {
          handle: data.handle || handle,
          rating: data.maxRating?.rating || 0,
          competitions: data.competitionStats?.algorithm?.challenges || 0,
        };

        await this.setCache(cacheKey, profile, 600);
        return profile;
      }
    } catch {
      // API failed, try fallback
    }

    // Fallback: Check if profile page exists (returns 200 for valid users)
    try {
      const profileResponse = await fetchWithTimeout(
        `${this.profilesBase}/${handle}`,
        {
          method: 'HEAD',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      if (profileResponse.ok) {
        // Profile page exists, user is valid
        const profile = {
          handle: handle,
          rating: 0,
          competitions: 0,
        };
        await this.setCache(cacheKey, profile, 600);
        return profile;
      }
    } catch {
      // Fallback also failed
    }

    throw new Error(
      'TopCoder user not found or service temporarily unavailable'
    );
  }

  async getSubmissions(handle, fromTimestamp = null) {
    const cacheKey = `tc_subs_${handle}_${fromTimestamp || 'all'}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    // TopCoder API for challenge history
    const response = await fetchWithTimeout(
      `${this.apiBase}/members/${handle}/challenges?status=completed&perPage=100`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const submissions = (data || []).map((challenge) => ({
      submission_id: challenge.challengeId?.toString(),
      problem_id: challenge.challengeId?.toString(),
      problem_name: challenge.challengeName || challenge.name,
      problem_url: `https://www.topcoder.com/challenges/${challenge.challengeId}`,
      verdict: 'AC',
      submitted_at: challenge.endDate || new Date().toISOString(),
    }));

    await this.setCache(cacheKey, submissions, 300);
    return submissions;
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
