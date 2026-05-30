/**
 * @file toph — split from the problem-solving-services module.
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
// TOPH SERVICE
// ============================================
export class TophService {
  constructor() {
    this.baseUrl = 'https://toph.co';
  }

  async getUserProfile(handle) {
    const normalizedHandle = handle?.trim();
    const encodedHandle = encodeURIComponent(normalizedHandle || '');

    const cacheKey = `toph_profile_${normalizedHandle}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    if (!normalizedHandle) {
      throw new Error('Toph user not found');
    }

    // First try Toph API for profile stats.
    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/api/users/${encodedHandle}/stats`,
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'NEUPC-Handle-Verification/1.0',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (!this.isNotFoundApiPayload(data)) {
          await this.setCache(cacheKey, data, 600);
          return data;
        }
      }
    } catch {
      // Continue to HTML profile fallback below.
    }

    // Fallback to public profile page to avoid false negatives from API issues.
    const profile = await this.getUserProfileFromWeb(normalizedHandle);
    if (!profile) {
      throw new Error('Toph user not found');
    }

    await this.setCache(cacheKey, profile, 600);
    return profile;
  }

  async getUserProfileFromWeb(handle) {
    try {
      const encodedHandle = encodeURIComponent(handle);
      const response = await fetchWithTimeout(
        `${this.baseUrl}/u/${encodedHandle}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NEUPC/1.0)',
            Accept: 'text/html',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const html = await response.text();
      const lowerHtml = html.toLowerCase();

      // Check for 404 page
      if (
        lowerHtml.includes('page not found') ||
        html.includes('<title>Page Not Found')
      ) {
        return null;
      }

      // Extract solutions count from dashlet
      // Format: dashlet__stat>18 / 2121< followed by "Problems Solved"
      // The pattern is: <div class=dashlet__stat>X / Y</div>...Problems Solved
      const solvedMatch = html.match(/dashlet__stat>(\d+)\s*\/\s*(\d+)</);

      // Extract rating - first dashlet__stat is usually rating or "Unrated"
      const ratingMatch = html.match(/dashlet__stat>(\d+)</);
      const isUnrated = html.includes('dashlet__stat>Unrated<');

      // Extract username from title - format: "handle (Full Name) | Toph"
      const usernameMatch = html.match(/<title>([^|]+)\|/);
      const username = usernameMatch ? usernameMatch[1].trim() : handle;

      // Extract full name if available
      const fullNameMatch = html.match(/<title>[^(]+\(([^)]+)\)/);
      const fullName = fullNameMatch ? fullNameMatch[1].trim() : null;

      const totalSolved = solvedMatch ? parseInt(solvedMatch[1], 10) : 0;
      const totalProblems = solvedMatch ? parseInt(solvedMatch[2], 10) : null;

      return {
        handle,
        username,
        fullName,
        totalSolved,
        totalProblems,
        rating: isUnrated
          ? null
          : ratingMatch
            ? parseInt(ratingMatch[1], 10)
            : null,
        isUnrated,
      };
    } catch (error) {
      console.error('Toph scraping error:', error.message);
      return null;
    }
  }

  isNotFoundApiPayload(payload) {
    const errorText =
      payload?.error || payload?.message || payload?.detail || payload?.status;
    return typeof errorText === 'string' && /not\s*found/i.test(errorText);
  }

  async getSubmissions(handle, fromTimestamp = null) {
    const cacheKey = `toph_subs_${handle}_${fromTimestamp || 'all'}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    // Fetch solved problems via API - no limit to get all submissions
    const response = await fetchWithTimeout(
      `${this.baseUrl}/api/users/${handle}/submissions?limit=100000`
    );

    if (!response.ok) {
      // Try scraping profile page as fallback
      const scraped = await this.scrapeSubmissions(handle);
      // scrapeSubmissions returns { totalSolved, submissions: [] }
      // We need to return just the submissions array
      return scraped?.submissions || [];
    }

    const data = await response.json();
    const submissions = (data.submissions || []).map((sub) => ({
      submission_id:
        sub.id?.toString() || `toph_${sub.problem_id}_${Date.now()}`,
      problem_id: sub.problem_id || sub.problemId,
      problem_name: sub.problem_name || sub.problemName,
      problem_url: `${this.baseUrl}/p/${sub.problem_id || sub.problemId}`,
      verdict: sub.verdict === 'Accepted' ? 'AC' : this.mapVerdict(sub.verdict),
      language: sub.language,
      submitted_at: sub.submitted_at || new Date().toISOString(),
    }));

    const filtered = fromTimestamp
      ? submissions.filter(
          (s) => new Date(s.submitted_at) > new Date(fromTimestamp)
        )
      : submissions;

    await this.setCache(cacheKey, filtered, 120);
    return filtered;
  }

  async scrapeSubmissions(handle) {
    // Fallback: parse profile page for solve count
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/u/${handle}`);
      const html = await response.text();

      // Extract solved problems count from profile
      const solvedMatch = html.match(/Solved[:\s]*(\d+)/i);
      const solved = solvedMatch ? parseInt(solvedMatch[1]) : 0;

      return {
        totalSolved: solved,
        submissions: [],
      };
    } catch {
      return { totalSolved: 0, submissions: [] };
    }
  }

  mapVerdict(verdict) {
    const map = {
      Accepted: 'AC',
      'Wrong Answer': 'WA',
      'Time Limit Exceeded': 'TLE',
      'Memory Limit Exceeded': 'MLE',
      'Runtime Error': 'RE',
      'Compilation Error': 'CE',
    };
    return map[verdict] || 'WA';
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
