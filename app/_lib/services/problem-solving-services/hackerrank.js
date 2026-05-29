/**
 * @file hackerrank — split from the problem-solving-services module.
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
// HACKERRANK SERVICE
// ============================================
export class HackerRankService {
  constructor() {
    this.baseUrl = 'https://www.hackerrank.com';
  }

  async getUserProfile(username) {
    const cacheKey = `hr_profile_${username}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    let userExists = false;
    let profileSolvedCount = 0;

    // First, try to verify user exists via profile page
    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/profile/${username}`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Accept: 'text/html,application/xhtml+xml',
          },
        }
      );

      if (response.ok) {
        const html = await response.text();
        // Check if user exists
        if (
          !html.includes('Page Not Found') &&
          !html.includes('profile not found')
        ) {
          userExists = true;
          // Try to extract solved count from profile page
          const solvedMatch = html.match(/(\d+)\s*problems?\s*solved/i);
          if (solvedMatch) {
            profileSolvedCount = parseInt(solvedMatch[1]);
          }
        }
      }
    } catch {
      // Profile fetch failed, continue to try badges API
    }

    // Always try badges API to get accurate solved count
    let totalSolved = profileSolvedCount;
    let badgesCount = 0;
    try {
      const badgesRes = await fetchWithTimeout(
        `${this.baseUrl}/rest/hackers/${username}/badges`
      );
      if (badgesRes.ok) {
        const badges = await badgesRes.json();
        userExists = true; // API worked, user exists
        badgesCount = badges.models?.length || 0;

        // Sum up solved counts from all badge models
        // Each badge model has a 'solved' field indicating problems solved in that domain
        if (badges.models && Array.isArray(badges.models)) {
          let apiSolvedCount = 0;
          for (const badge of badges.models) {
            if (badge.solved && typeof badge.solved === 'number') {
              apiSolvedCount += badge.solved;
            }
          }
          // Use API count if it's higher (more accurate)
          if (apiSolvedCount > totalSolved) {
            totalSolved = apiSolvedCount;
          }
        }
      }
    } catch {
      // Badges API failed, continue with profile data
    }

    if (userExists) {
      const profile = {
        username,
        totalSolved,
        badges: badgesCount,
        verified: true,
      };
      await this.setCache(cacheKey, profile, 600);
      return profile;
    }

    // Final fallback - just validate the username format
    if (/^[a-zA-Z0-9_]+$/.test(username)) {
      const profile = {
        username,
        totalSolved: 0,
        badges: 0,
        verified: false,
        note: 'HackerRank API restricted - profile format validated only',
      };
      await this.setCache(cacheKey, profile, 600);
      return profile;
    }

    throw new Error('HackerRank user not found');
  }

  async getSubmissions(username, _fromTimestamp = null) {
    const cacheKey = `hr_subs_${username}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    // HackerRank doesn't have a public submissions API anymore
    // Return empty array - users can manually track or we rely on profile scraping
    await this.setCache(cacheKey, [], 300);
    return [];
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
