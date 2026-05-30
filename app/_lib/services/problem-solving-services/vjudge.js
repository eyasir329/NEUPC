/**
 * @file vjudge — split from the problem-solving-services module.
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { PROBLEM_SOLVING_PLATFORM_IDS } from '@/app/_lib/services/problem-solving-platforms';
import {
  V2_TABLES,
  getPlatformCode,
  getPlatformId,
  isV2SchemaAvailable,
} from '@/app/_lib/services/problem-solving-v2-helpers';

// ============================================
// VJUDGE SERVICE
// ============================================
export class VJudgeService {
  constructor() {
    this.baseUrl = 'https://vjudge.net';
    // Rate limit: be gentle with VJudge servers
    this.requestDelay = 600; // ms between requests
    // Cache for problem details to avoid repeated fetches
    this.problemDetailsCache = new Map();
  }

  /**
   * Mapping of OJ names to their base URLs for constructing original problem links
   */
  getOriginalOJUrl(oj, probNum) {
    const ojUrls = {
      CodeForces: `https://codeforces.com/problemset/problem/${probNum.replace(/([A-Za-z]+)$/, '/$1')}`,
      AtCoder: this.getAtCoderUrl(probNum),
      SPOJ: `https://www.spoj.com/problems/${probNum}/`,
      UVA: `https://onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=${probNum}`,
      LightOJ: `https://lightoj.com/problem/${probNum}`,
      CodeChef: `https://www.codechef.com/problems/${probNum}`,
      HackerRank: `https://www.hackerrank.com/challenges/${probNum}`,
      Toph: `https://toph.co/p/${probNum}`,
      CSES: `https://cses.fi/problemset/task/${probNum}`,
      Kattis: `https://open.kattis.com/problems/${probNum}`,
      POJ: `http://poj.org/problem?id=${probNum}`,
      HDU: `http://acm.hdu.edu.cn/showproblem.php?pid=${probNum}`,
      Aizu: `https://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=${probNum}`,
      URAL: `https://acm.timus.ru/problem.aspx?num=${probNum}`,
      EOlymp: `https://www.eolymp.com/en/problems/${probNum}`,
      Gym: `https://codeforces.com/gym/${probNum.replace(/([A-Za-z]+)$/, '/problem/$1')}`,
      TopCoder: null, // TopCoder URLs are complex
      HackerEarth: `https://www.hackerearth.com/problem/algorithm/${probNum}/`,
      CSAcademy: `https://csacademy.com/contest/archive/task/${probNum}/`,
    };

    return ojUrls[oj] || null;
  }

  /**
   * AtCoder URL construction (handles contest_problem format)
   */
  getAtCoderUrl(probNum) {
    // AtCoder problem numbers are like "abc337_c" -> https://atcoder.jp/contests/abc337/tasks/abc337_c
    const match = probNum.match(/^([a-z]+\d+)_([a-z])$/i);
    if (match) {
      const contest = match[1].toLowerCase();
      return `https://atcoder.jp/contests/${contest}/tasks/${probNum.toLowerCase()}`;
    }
    return `https://atcoder.jp/contests/${probNum}`;
  }

  /**
   * Get user profile with solve statistics
   */
  async getUserProfile(username) {
    const cacheKey = `vj_profile_${username}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    const response = await fetch(
      `${this.baseUrl}/user/solveDetail/${username}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('VJudge user not found');
    }

    const data = await response.json();

    // Count solved and attempted across all OJs
    let totalSolved = 0;
    let totalAttempted = 0;
    const ojStats = {};

    // Process AC records
    if (data.acRecords) {
      Object.entries(data.acRecords).forEach(([oj, problems]) => {
        if (Array.isArray(problems)) {
          const count = problems.length;
          totalSolved += count;
          ojStats[oj] = { solved: count, attempted: 0 };
        }
      });
    }

    // Process failed records
    if (data.failRecords) {
      Object.entries(data.failRecords).forEach(([oj, problems]) => {
        if (Array.isArray(problems)) {
          const count = problems.length;
          totalAttempted += count;
          if (ojStats[oj]) {
            ojStats[oj].attempted = count;
          } else {
            ojStats[oj] = { solved: 0, attempted: count };
          }
        }
      });
    }

    const profile = {
      username,
      totalSolved,
      totalAttempted,
      ojStats,
      ojs: Object.keys(ojStats),
    };

    await this.setCache(cacheKey, profile, 600);
    return profile;
  }

  /**
   * Get detailed submission history with timestamps, language, etc.
   * Uses the /status/data API for full submission details
   * Enhanced to fetch problem names and details
   */
  async getSubmissions(username, fromTimestamp = null) {
    const cacheKey = `vj_subs_${username}_${fromTimestamp || 'all'}_v3`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    const allSubmissions = [];
    let start = 0;
    // VJudge API caps max length at 20 - requesting more still returns only 20
    const batchSize = 20;
    let hasMore = true;

    // Collect unique problems to fetch details for
    const problemsToFetch = new Map();

    // Fetch all AC submissions with pagination
    while (hasMore) {
      const url = `${this.baseUrl}/status/data?un=${encodeURIComponent(username)}&OJId=All&res=1&start=${start}&length=${batchSize}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`VJudge API error: ${response.status}`);
        break;
      }

      const result = await response.json();

      if (!result.data || result.data.length === 0) {
        hasMore = false;
        break;
      }

      // Process submissions
      for (const sub of result.data) {
        // Filter by timestamp if provided
        if (fromTimestamp) {
          const subTime = new Date(sub.time);
          const fromTime = new Date(fromTimestamp);
          if (subTime <= fromTime) {
            hasMore = false;
            break;
          }
        }

        const problemKey = `${sub.oj}-${sub.probNum}`;

        // Track this problem for detail fetching
        if (!problemsToFetch.has(problemKey)) {
          problemsToFetch.set(problemKey, {
            oj: sub.oj,
            probNum: sub.probNum,
            problemId: sub.problemId,
          });
        }

        // Get original OJ URL if available
        const originalUrl = this.getOriginalOJUrl(sub.oj, sub.probNum);

        const submission = {
          submission_id: `vj_${sub.runId}`,
          problem_id: problemKey,
          // Will be enriched with actual name later
          problem_name: null,
          problem_url: `${this.baseUrl}/problem/${problemKey}`,
          original_url: originalUrl,
          contest_id: sub.contestId?.toString() || null,
          contest_num: sub.contestNum || null,
          verdict: this.mapVerdict(sub.status),
          language: sub.language || sub.languageCanonical || 'Unknown',
          language_canonical: sub.languageCanonical || null,
          runtime_ms: sub.runtime != null ? sub.runtime : null,
          memory_kb: sub.memory != null ? sub.memory : null,
          source_length: sub.sourceLength || null,
          submitted_at: new Date(sub.time).toISOString(),
          // Store original OJ info for reference
          original_oj: sub.oj,
          original_problem_num: sub.probNum,
          vjudge_problem_id: sub.problemId,
          vjudge_run_id: sub.runId,
          // Placeholders for enrichment
          difficulty: null,
          tags: [],
        };

        allSubmissions.push(submission);
      }

      // Check if we got a full batch (might be more)
      if (result.data.length < batchSize) {
        hasMore = false;
      } else {
        start += batchSize;
        // Rate limiting - wait between requests
        await this.delay(this.requestDelay);
      }

      // Safety limit to prevent infinite loops (reasonable limit for any user)
      if (start > 50000) {
        console.warn('VJudge: Hit safety limit of 50000 submissions');
        hasMore = false;
      }
    }

    // Fetch problem details for unique problems (batch with rate limiting)
    // Limit problem detail fetches to avoid very long sync times
    // At 600ms per request, 100 problems = 60 seconds just for problem details
    const maxProblemDetailFetches = Math.min(problemsToFetch.size, 100);
    const problemsArray = Array.from(problemsToFetch.entries()).slice(
      0,
      maxProblemDetailFetches
    );
    const problemDetails = new Map();
    for (const [problemKey, problemInfo] of problemsArray) {
      try {
        const details = await this.getProblemDetails(
          problemInfo.oj,
          problemInfo.probNum
        );
        if (details) {
          problemDetails.set(problemKey, details);
        }
        // Rate limiting between problem fetches
        await this.delay(this.requestDelay);
      } catch (error) {
        console.error(`Error fetching details for ${problemKey}:`, error);
      }
    }

    // Enrich submissions with problem details
    for (const submission of allSubmissions) {
      const details = problemDetails.get(submission.problem_id);
      if (details) {
        submission.problem_name = details.problemName || submission.problem_id;
        submission.difficulty = details.difficulty;
        submission.tags = details.tags || [];
        submission.time_limit = details.timeLimit;
        submission.memory_limit = details.memoryLimit;
        submission.source_contest = details.source;
      } else {
        // Fallback: use OJ and problem number as name
        submission.problem_name = `${submission.original_oj} - ${submission.original_problem_num}`;
      }
    }

    await this.setCache(cacheKey, allSubmissions, 300);
    return allSubmissions;
  }

  /**
   * Get solve summary (quick method using solveDetail API)
   * Returns list of solved problems grouped by OJ
   */
  async getSolveSummary(username) {
    const cacheKey = `vj_solve_summary_${username}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    const response = await fetch(
      `${this.baseUrl}/user/solveDetail/${username}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      return { acRecords: {}, failRecords: {} };
    }

    const data = await response.json();
    await this.setCache(cacheKey, data, 300);
    return data;
  }

  /**
   * Get problem details including name, difficulty, and tags
   * Fetches the problem page and parses embedded JSON from dataJson textarea
   */
  async getProblemDetails(oj, problemNum) {
    const cacheKey = `vj_problem_${oj}_${problemNum}_v2`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.baseUrl}/problem/${oj}-${problemNum}`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const html = await response.text();

      // Extract problem name from <h2> tag
      const problemName = this.extractProblemName(html);

      // Extract the embedded JSON data from dataJson textarea
      const problemData = this.extractDataJsonFromHtml(html);

      const details = {
        oj,
        problemNum,
        problemId: problemData?.problemId || null,
        problemName: problemName || `${oj} - ${problemNum}`,
        difficulty: null,
        tags: [],
        timeLimit: null,
        memoryLimit: null,
        source: null,
      };

      // Parse properties from embedded JSON
      if (problemData?.properties && Array.isArray(problemData.properties)) {
        for (const prop of problemData.properties) {
          switch (prop.title) {
            case 'difficulty':
              details.difficulty = parseInt(prop.content) || null;
              break;
            case 'tags':
              details.tags = this.parseTags(prop.content);
              break;
            case 'time_limit':
              details.timeLimit = prop.content;
              break;
            case 'mem_limit':
              details.memoryLimit = prop.content;
              break;
            case 'source':
              // Extract text from HTML, removing tags
              details.source = prop.content
                .replace(/<[^>]*>/g, '')
                .replace(/&[^;]+;/g, ' ')
                .trim();
              break;
          }
        }
      }

      await this.setCache(cacheKey, details, 3600); // Cache for 1 hour
      return details;
    } catch (error) {
      console.error(
        `Error fetching problem details for ${oj}-${problemNum}:`,
        error
      );
      return null;
    }
  }

  /**
   * Extract problem name from HTML page
   * VJudge puts the problem name in <h2> tag like: <h2><i id="btn-fav"></i> Problem Name</h2>
   */
  extractProblemName(html) {
    try {
      // Match <h2> tag content and extract the problem name
      const h2Match = html.match(/<h2[^>]*>(.*?)<\/h2>/is);
      if (h2Match) {
        // Remove any HTML tags inside and clean up
        let name = h2Match[1]
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&[^;]+;/g, ' ') // Remove HTML entities
          .trim();
        if (name && name.length > 0 && name.length < 200) {
          return name;
        }
      }

      // Fallback: try to extract from title tag
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) {
        // Title format: "Problem Name - OJ ProbNum - Virtual Judge"
        const parts = titleMatch[1].split(' - ');
        if (parts.length >= 2) {
          return parts[0].trim();
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting problem name:', error);
      return null;
    }
  }

  /**
   * Extract JSON data from the dataJson textarea in VJudge problem pages
   * The textarea contains a full JSON object with problem properties
   */
  extractDataJsonFromHtml(html) {
    try {
      // Look for the dataJson textarea
      const textareaMatch = html.match(
        /<textarea[^>]*name="dataJson"[^>]*>([\s\S]*?)<\/textarea>/i
      );
      if (textareaMatch) {
        // Decode HTML entities in the JSON string
        const jsonStr = textareaMatch[1]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'")
          .replace(/\\u003c/g, '<')
          .replace(/\\u003e/g, '>')
          .replace(/\\u003d/g, '=')
          .replace(/\\u0027/g, "'");

        try {
          return JSON.parse(jsonStr);
        } catch (parseError) {
          console.error('Error parsing dataJson:', parseError);
        }
      }

      // Fallback: try to find JSON in script tags or inline
      const jsonPatterns = [
        /"problemId"\s*:\s*(\d+).*?"properties"\s*:\s*(\[[\s\S]*?\])/,
      ];

      for (const pattern of jsonPatterns) {
        const match = html.match(pattern);
        if (match) {
          try {
            // Try to construct a valid JSON object
            const problemId = match[1];
            const properties = match[2];
            return JSON.parse(
              `{"problemId":${problemId},"properties":${properties}}`
            );
          } catch {
            continue;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting dataJson from HTML:', error);
      return null;
    }
  }

  /**
   * Parse tags from VJudge tag content (may contain HTML and whitespace)
   */
  parseTags(tagContent) {
    if (!tagContent) return [];

    // Remove HTML tags and normalize whitespace
    const cleanContent = tagContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanContent) return [];

    // Split by newlines first, then by commas if needed
    const tags = cleanContent
      .split(/[\n,]+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0 && tag.length < 50);

    // If we got a single long string, try splitting by spaces for common tags
    if (tags.length === 1 && tags[0].includes(' ')) {
      const spaceSplit = tags[0].split(/\s+/).filter((t) => t.length > 2);
      if (spaceSplit.length > 1) {
        return spaceSplit;
      }
    }

    return tags;
  }

  /**
   * Map VJudge verdict to standard format
   */
  mapVerdict(status) {
    if (!status) return 'PENDING';

    const statusLower = status.toLowerCase();

    if (statusLower.includes('accepted') || statusLower === 'ac') {
      return 'AC';
    }
    if (statusLower.includes('wrong') || statusLower === 'wa') {
      return 'WA';
    }
    if (statusLower.includes('time') || statusLower === 'tle') {
      return 'TLE';
    }
    if (statusLower.includes('memory') || statusLower === 'mle') {
      return 'MLE';
    }
    if (statusLower.includes('runtime') || statusLower === 're') {
      return 'RE';
    }
    if (statusLower.includes('compilation') || statusLower === 'ce') {
      return 'CE';
    }
    if (statusLower.includes('presentation') || statusLower === 'pe') {
      return 'PE';
    }

    return 'PENDING';
  }

  /**
   * Utility delay function for rate limiting
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getCache(key) {
    try {
      const { data } = await supabaseAdmin
        .from('api_cache')
        .select('cache_value')
        .eq('cache_key', key)
        .gt('expires_at', new Date().toISOString())
        .single();
      return data?.cache_value;
    } catch {
      return null;
    }
  }

  async setCache(key, value, ttlSeconds) {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
      await supabaseAdmin.from('api_cache').upsert({
        cache_key: key,
        cache_value: value,
        expires_at: expiresAt,
      });
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }
}
