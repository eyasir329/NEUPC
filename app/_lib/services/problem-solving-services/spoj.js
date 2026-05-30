/**
 * @file spoj — split from the problem-solving-services module.
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { PROBLEM_SOLVING_PLATFORM_IDS } from '@/app/_lib/services/problem-solving-platforms';
import {
  V2_TABLES,
  getPlatformCode,
  getPlatformId,
  isV2SchemaAvailable,
} from '@/app/_lib/services/problem-solving-v2-helpers';

import { normalizeSubmissionTimestamp } from './_shared';

// ============================================
// SPOJ SERVICE
// ============================================
export class SPOJService {
  constructor() {
    this.baseUrl = 'https://www.spoj.com';
  }

  async getUserProfile(username) {
    const cacheKey = `spoj_profile_${username}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    // Validate username format (alphanumeric and underscore only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error('Invalid SPOJ username format');
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${username}/`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      // Get HTML content regardless of status code (Cloudflare returns 403 but with content)
      const html = await response.text();

      // Check if we got a Cloudflare challenge page (can happen with 403 or 200)
      if (
        html.includes('Just a moment...') ||
        html.includes('cf_chl_opt') ||
        html.includes('Enable JavaScript and cookies') ||
        html.includes('challenge-platform')
      ) {
        // Cloudflare is blocking - accept the handle with basic validation only
        // Username format was already validated above
        const profile = {
          username,
          totalSolved: 0,
          points: 0,
          verified: false,
          note: 'SPOJ verification limited due to Cloudflare protection - handle format validated only',
        };
        await this.setCache(cacheKey, profile, 600);
        return profile;
      }

      // If we got actual content but response was not ok (and not Cloudflare), user not found
      if (!response.ok) {
        throw new Error('SPOJ user not found');
      }

      const profile = this.parseProfile(html, username);
      profile.verified = true;
      await this.setCache(cacheKey, profile, 600);
      return profile;
    } catch (error) {
      // If fetch fails due to network issues, do basic validation
      if (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ETIMEDOUT')
      ) {
        const profile = {
          username,
          totalSolved: 0,
          points: 0,
          verified: false,
          note: 'SPOJ verification limited - handle format validated only',
        };
        await this.setCache(cacheKey, profile, 600);
        return profile;
      }
      throw error;
    }
  }

  parseProfile(html, username) {
    const solvedMatch =
      html.match(/Problems solved[:\s]*(\d+)/i) ||
      html.match(/Solved problems[:\s]*(\d+)/i);
    const pointsMatch = html.match(/Points[:\s]*([0-9.]+)/i);

    return {
      username,
      totalSolved: solvedMatch ? parseInt(solvedMatch[1]) : 0,
      points: pointsMatch ? parseFloat(pointsMatch[1]) : 0,
    };
  }

  async getSubmissions(username, fromTimestamp = null) {
    const cacheKey = `spoj_subs_${username}_${fromTimestamp || 'all'}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error('Invalid SPOJ username format');
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${username}/`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      const html = await response.text();

      // Cloudflare challenge pages are not parseable server-side.
      if (
        html.includes('Just a moment...') ||
        html.includes('cf_chl_opt') ||
        html.includes('Enable JavaScript and cookies') ||
        html.includes('challenge-platform')
      ) {
        await this.setCache(cacheKey, [], 120);
        return [];
      }

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('SPOJ user not found');
        }

        await this.setCache(cacheKey, [], 120);
        return [];
      }

      const parsed = this.parseSolvedProblems(html);

      // SPOJ solved lists don't include submit timestamps. Keep timestamps stable
      // across incremental syncs to avoid drifting solve dates on re-sync.
      const syntheticSubmittedAt =
        normalizeSubmissionTimestamp(fromTimestamp) || new Date().toISOString();

      const submissions = parsed.map((submission) => ({
        ...submission,
        submitted_at: syntheticSubmittedAt,
      }));

      await this.setCache(cacheKey, submissions, 120);
      return submissions;
    } catch (error) {
      if (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ETIMEDOUT')
      ) {
        await this.setCache(cacheKey, [], 120);
        return [];
      }

      throw error;
    }
  }

  parseSolvedProblems(input) {
    const submissions = [];
    const seen = new Set();

    const addProblem = (problemId) => {
      const id = problemId.trim();
      if (!id || seen.has(id)) return;
      // SPOJ problem IDs are alphanumeric with possible underscores, 2-20 chars
      if (!/^[A-Z0-9_]{2,20}$/i.test(id)) return;
      // Filter out common false positives from page chrome
      const NOISE = new Set([
        'AC',
        'WA',
        'RE',
        'TLE',
        'MLE',
        'CE',
        'PE',
        'OK',
        'SPOJ',
        'HTML',
        'CSS',
        'PDF',
        'FAQ',
        'API',
        'RSS',
        'URL',
        'YES',
        'NO',
        'OR',
        'AND',
        'IF',
        'ID',
        'BY',
        'TO',
        'OF',
        'IN',
        'ON',
        'AT',
        'UP',
      ]);
      if (NOISE.has(id.toUpperCase())) return;

      seen.add(id);
      submissions.push({
        submission_id: `spoj_${id}`,
        problem_id: id,
        problem_name: id,
        problem_url: `${this.baseUrl}/problems/${id}/`,
        verdict: 'AC',
        submitted_at: new Date().toISOString(),
      });
    };

    // Strategy 1: Extract from HTML anchor tags (href="/problems/CODE")
    const linkRegex = /href=["']\/problems\/([^"'/]+)/gi;
    let match;
    while ((match = linkRegex.exec(input)) !== null) {
      addProblem(match[1]);
    }

    if (submissions.length > 0) {
      return submissions;
    }

    // Strategy 2: Plain-text extraction (Ctrl+A copy-paste from SPOJ profile)
    // SPOJ profiles list solved problems after a heading like
    // "List of solved problems" or "solved classical problems", with codes
    // separated by pipes, commas, spaces, or newlines.
    const text = input.replace(/<[^>]+>/g, ' '); // strip any residual tags

    // Try to isolate the solved-problems section
    const sectionMatch = text.match(
      /(?:list\s+of\s+solved|solved\s+(?:classical\s+)?problems?)[:\s]*([\s\S]*?)(?:todo|to\s*solve|unsolved|list\s+of\s+todo|$)/i
    );
    const section = sectionMatch ? sectionMatch[1] : text;

    // Split on common delimiters: pipe, comma, whitespace, parentheses
    const tokens = section.split(/[|,\s()[\]{}]+/).filter(Boolean);
    for (const token of tokens) {
      // SPOJ classical problem codes are typically all-uppercase, 2-20 chars
      if (/^[A-Z][A-Z0-9_]{1,19}$/.test(token)) {
        addProblem(token);
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
