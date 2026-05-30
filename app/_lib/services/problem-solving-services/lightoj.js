/**
 * @file lightoj — split from the problem-solving-services module.
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
// LIGHTOJ SERVICE
// ============================================
export class LightOJService {
  constructor() {
    this.baseUrl = 'https://lightoj.com';
  }

  async getUserProfile(username) {
    const cacheKey = `loj_profile_${username}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/user/${username}`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Accept: 'text/html,application/xhtml+xml',
          },
        }
      );

      if (!response.ok) {
        throw new Error('LightOJ user not found');
      }

      const html = await response.text();

      // Check for user not found
      if (
        html.includes('User not found') ||
        html.includes('404') ||
        html.includes('Page not found')
      ) {
        throw new Error('LightOJ user not found');
      }

      const profile = this.parseProfile(html, username);
      profile.verified = true;
      await this.setCache(cacheKey, profile, 600);
      return profile;
    } catch {
      // If scraping fails, check username format and return placeholder
      if (/^[a-zA-Z0-9_]+$/.test(username)) {
        const profile = {
          username,
          totalSolved: 0,
          verified: false,
          note: 'LightOJ requires authentication - profile format validated only',
        };
        await this.setCache(cacheKey, profile, 600);
        return profile;
      }
      throw new Error('LightOJ user not found');
    }
  }

  parseProfile(html, username) {
    // Try multiple patterns for solved count
    const solvedMatch =
      html.match(/Solved[:\s]*(\d+)/i) ||
      html.match(/(\d+)\s*problems?\s*solved/i) ||
      html.match(/Total Solved[:\s]*(\d+)/i) ||
      html.match(/"solved"\s*:\s*(\d+)/i);

    return {
      username,
      totalSolved: solvedMatch ? parseInt(solvedMatch[1]) : 0,
    };
  }

  async getSubmissions(username, _fromTimestamp = null) {
    const cacheKey = `loj_subs_${username}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    // LightOJ API requires authentication
    // Return empty array - submissions need to be tracked manually or via logged-in session
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
