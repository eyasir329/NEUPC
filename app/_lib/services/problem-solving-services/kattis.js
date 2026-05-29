/**
 * @file kattis — split from the problem-solving-services module.
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
// KATTIS SERVICE
// ============================================
export class KattisService {
  constructor() {
    this.baseUrl = 'https://open.kattis.com';
  }

  async getUserProfile(username) {
    const cacheKey = `kattis_profile_${username}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/users/${username}`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Accept: 'text/html,application/xhtml+xml',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Kattis user not found');
      }

      const html = await response.text();

      // Check for user not found
      if (
        html.includes('User not found') ||
        html.includes('404') ||
        html.includes('Page not found')
      ) {
        throw new Error('Kattis user not found');
      }

      const profile = this.parseProfile(html, username);
      profile.verified = true;

      await this.setCache(cacheKey, profile, 600);
      return profile;
    } catch {
      // Fallback - validate username format
      if (/^[a-zA-Z0-9_.-]+$/.test(username)) {
        const profile = {
          username,
          score: 0,
          rank: 0,
          totalSolved: 0,
          verified: false,
          note: 'Kattis profile could not be fetched - format validated only',
        };
        await this.setCache(cacheKey, profile, 600);
        return profile;
      }
      throw new Error('Kattis user not found');
    }
  }

  parseProfile(html, username) {
    // Kattis HTML structure uses: <span class="info_label">Score</span><span class="important_text">1.0</span>
    // Try multiple patterns for score
    const scoreMatch =
      html.match(
        /class="info_label"[^>]*>Score<\/span>\s*<span[^>]*class="important_text"[^>]*>([0-9.]+)/i
      ) ||
      html.match(/>Score<\/span>\s*<span[^>]*>([0-9.]+)/i) ||
      html.match(/Score[:\s]*<\/[^>]+>\s*([0-9.]+)/i) ||
      html.match(/score[:\s]*([0-9.]+)/i);

    // Try multiple patterns for rank
    const rankMatch =
      html.match(
        /class="info_label"[^>]*>Rank<\/span>\s*<span[^>]*class="important_text"[^>]*>(\d+)/i
      ) ||
      html.match(/>Rank<\/span>\s*<span[^>]*>(\d+)/i) ||
      html.match(/Rank[:\s]*<\/[^>]+>\s*(\d+)/i) ||
      html.match(/rank[:\s]*#?(\d+)/i);

    // Try multiple patterns for solved count
    const solvedMatch =
      html.match(/(\d+)\s*problems?\s*solved/i) ||
      html.match(/Solved[:\s]*(\d+)/i) ||
      html.match(/solved[:\s]*<[^>]*>(\d+)/i);

    return {
      username,
      score: scoreMatch ? parseFloat(scoreMatch[1]) : 0,
      rank: rankMatch ? parseInt(rankMatch[1]) : 0,
      totalSolved: solvedMatch ? parseInt(solvedMatch[1]) : 0,
    };
  }

  async getSubmissions(username, _fromTimestamp = null) {
    const cacheKey = `kattis_subs_${username}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    try {
      // Fetch user's profile page to get solved problems
      const response = await fetchWithTimeout(
        `${this.baseUrl}/users/${username}`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const html = await response.text();
      const submissions = this.parseSolvedProblems(html);

      await this.setCache(cacheKey, submissions, 300);
      return submissions;
    } catch {
      return [];
    }
  }

  parseSolvedProblems(html) {
    const submissions = [];
    // Parse solved problem links
    const problemRegex = /<a[^>]*href="\/problems\/([^"]+)"[^>]*>/gi;
    const seen = new Set();
    let match;

    while ((match = problemRegex.exec(html)) !== null) {
      const problemId = match[1];
      if (!seen.has(problemId) && !problemId.includes('page')) {
        seen.add(problemId);
        submissions.push({
          submission_id: `kattis_${problemId}`,
          problem_id: problemId,
          problem_name: problemId,
          problem_url: `${this.baseUrl}/problems/${problemId}`,
          verdict: 'AC',
          submitted_at: new Date().toISOString(),
        });
      }
    }

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
