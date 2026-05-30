/**
 * @file cses — split from the problem-solving-services module.
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
// CSES SERVICE
// ============================================
export class CSESService {
  constructor() {
    this.baseUrl = 'https://cses.fi';
  }

  async getUserProfile(userId) {
    const cacheKey = `cses_profile_${userId}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    try {
      // CSES requires scraping the user page
      const response = await fetchWithTimeout(
        `${this.baseUrl}/user/${userId}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NEUPC/1.0)',
            Accept: 'text/html',
          },
        }
      );

      if (!response.ok) {
        throw new Error('CSES user not found');
      }

      const html = await response.text();

      // Check for 404 or invalid user
      if (
        html.includes('Page not found') ||
        html.includes('User not found') ||
        html.includes('Invalid user')
      ) {
        throw new Error('CSES user not found');
      }

      const profile = this.parseProfile(html, userId);

      if (profile.submissionCount === 0 && !profile.username) {
        throw new Error('CSES user not found');
      }

      await this.setCache(cacheKey, profile, 600);
      return profile;
    } catch (error) {
      if (error.message === 'CSES user not found') {
        throw error;
      }
      throw new Error(`CSES error: ${error.message}`);
    }
  }

  async getSubmissions(userId, fromTimestamp = null) {
    const cacheKey = `cses_subs_${userId}_${fromTimestamp || 'all'}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    // CSES doesn't expose solved problems list publicly without login
    // We can only get submission count from the profile
    // Return empty array as we can't get individual submissions
    return [];
  }

  parseProfile(html, userId) {
    // Extract username from page title
    const titleMatch = html.match(/<title>CSES - User ([^<]+)<\/title>/i);
    const username = titleMatch ? titleMatch[1].trim() : userId;

    // Extract submission count from summary table
    const submissionMatch = html.match(
      /Submission count:<\/td>\s*<td[^>]*>(\d+)/i
    );
    const submissionCount = submissionMatch
      ? parseInt(submissionMatch[1], 10)
      : 0;

    // Extract first and last submission dates
    const firstSubMatch = html.match(
      /First submission:<\/td>\s*<td[^>]*>([^<]+)/i
    );
    const lastSubMatch = html.match(
      /Last submission:<\/td>\s*<td[^>]*>([^<]+)/i
    );

    return {
      userId,
      username,
      submissionCount,
      totalSolved: 0, // Cannot determine without login
      firstSubmission: firstSubMatch ? firstSubMatch[1].trim() : null,
      lastSubmission: lastSubMatch ? lastSubMatch[1].trim() : null,
      note: 'CSES does not expose solved problems count publicly. Only submission count is available.',
    };
  }

  parseSolvedProblems(html) {
    // CSES requires login to see solved problems
    // This method is kept for compatibility but returns empty
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
