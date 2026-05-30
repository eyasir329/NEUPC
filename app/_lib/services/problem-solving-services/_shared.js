/**
 * @file _shared — split from the problem-solving-services module.
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { PROBLEM_SOLVING_PLATFORM_IDS } from '@/app/_lib/services/problem-solving-platforms';
import {
  V2_TABLES,
  getPlatformCode,
  getPlatformId,
  isV2SchemaAvailable,
} from '@/app/_lib/services/problem-solving-v2-helpers';

import { ClistService } from './clist';

// ============================================
// CONSTANTS
// ============================================
export const PLATFORMS = PROBLEM_SOLVING_PLATFORM_IDS.reduce((acc, id) => {
  acc[id.toUpperCase()] = id;
  return acc;
}, {});

export const API_ENDPOINTS = {
  codeforces: {
    userInfo: 'https://codeforces.com/api/user.info',
    userStatus: 'https://codeforces.com/api/user.status',
    userRating: 'https://codeforces.com/api/user.rating',
  },
  atcoder: {
    submissions: 'https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions',
  },
  leetcode: {
    graphql: 'https://leetcode.com/graphql',
  },
  toph: {
    profile: 'https://toph.co/u/',
    api: 'https://toph.co/api',
  },
  cses: {
    user: 'https://cses.fi/user/',
  },
  codechef: {
    api: 'https://www.codechef.com/api',
  },
  topcoder: {
    api: 'https://api.topcoder.com/v5',
  },
  hackerrank: {
    api: 'https://www.hackerrank.com/rest/contests/master/hackers/',
  },
  kattis: {
    profile: 'https://open.kattis.com/users/',
  },
  lightoj: {
    profile: 'https://lightoj.com/user/',
  },
  uva: {
    api: 'https://uhunt.onlinejudge.org/api',
  },
  spoj: {
    profile: 'https://www.spoj.com/users/',
  },
  vjudge: {
    api: 'https://vjudge.net/user/solveDetail/',
  },
  cfgym: {
    // Uses Codeforces API for gym contests
    userStatus: 'https://codeforces.com/api/user.status',
  },
  csacademy: {
    profile: 'https://csacademy.com/user/',
  },
  eolymp: {
    api: 'https://www.eolymp.com/api',
  },
  usaco: {
    // USACO doesn't have a public API
    profile: 'https://usaco.org/',
  },
};

// Rate limits per platform (requests per minute)
export const RATE_LIMITS = {
  codeforces: 5,
  atcoder: 10,
  leetcode: 3,
  toph: 10,
  cses: 10,
  codechef: 5,
  topcoder: 5,
  hackerrank: 5,
  kattis: 10,
  lightoj: 10,
  uva: 10,
  spoj: 10,
  vjudge: 10,
  cfgym: 5,
  csacademy: 10,
  eolymp: 10,
  usaco: 10,
  clist: 10, // CLIST API: 10 requests per minute
};

export const MIN_REASONABLE_SUBMISSION_MS = Date.parse(
  '2005-01-01T00:00:00.000Z'
);

export const MAX_SUBMISSION_FUTURE_DRIFT_MS = 24 * 60 * 60 * 1000;

export function normalizeSubmissionVerdict(rawVerdict) {
  const normalized = (rawVerdict || '').toString().trim().toUpperCase();
  if (!normalized) return 'UNKNOWN';
  if (normalized === 'OK' || normalized === 'ACCEPTED') return 'AC';
  return normalized;
}

export function normalizeSubmissionTimestamp(value) {
  if (value === null || value === undefined || value === '') return null;

  let timestampMs = Number.NaN;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    timestampMs = value < 1e12 ? value * 1000 : value;
  } else {
    const raw = String(value).trim();
    if (!raw) return null;

    if (/^\d+$/.test(raw)) {
      const numeric = Number.parseInt(raw, 10);
      if (!Number.isFinite(numeric)) return null;
      timestampMs = raw.length <= 10 ? numeric * 1000 : numeric;
    } else {
      const parsed = Date.parse(raw);
      if (!Number.isFinite(parsed)) return null;
      timestampMs = parsed;
    }
  }

  if (
    !Number.isFinite(timestampMs) ||
    timestampMs < MIN_REASONABLE_SUBMISSION_MS ||
    timestampMs > Date.now() + MAX_SUBMISSION_FUTURE_DRIFT_MS
  ) {
    return null;
  }

  return new Date(timestampMs).toISOString();
}

export function isHeuristicLeetCodeSubmissionId(submissionId) {
  const id = (submissionId || '').toString().trim().toLowerCase();
  if (!id) return false;

  return (
    id.startsWith('lc_contest_') ||
    id.startsWith('lc_inferred_') ||
    id.startsWith('lc_synthetic_') ||
    id.startsWith('clist_')
  );
}

export function normalizeLeetCodeProblemSlug(value) {
  if (value === null || value === undefined) return null;

  let slug = String(value).trim().toLowerCase();
  if (!slug) return null;

  slug = slug.replace(
    /^(?:https?:\/\/)?(?:www\.)?leetcode\.(?:com|cn)\/problems\//,
    ''
  );
  slug = slug.split(/[/?#]/)[0].trim();

  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null;
}

// ============================================
// CLIST RATE LIMITER (Singleton)
// ============================================

/**
 * Rate limiter for CLIST API to enforce 10 requests/minute limit
 * Uses a sliding window approach with proper delays
 */
export class ClistRateLimiter {
  constructor() {
    this.maxRequests = 10; // 10 requests per minute as per clist.by limits
    this.windowMs = 60000; // 1 minute window
    this.minDelayMs = 6500; // Minimum 6.5 seconds between requests (conservative, allows ~9 req/min)
    this.requestTimestamps = [];
    this.lastRequestTime = 0;

    // Request queue for handling concurrent requests from multiple users
    this.requestQueue = [];
    this.processingQueue = false;
  }

  /**
   * Add a request to the queue and wait for execution
   */
  async enqueueRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        execute: requestFn,
        resolve,
        reject,
        timestamp: Date.now(),
      });

      // Start processing queue if not already processing
      if (!this.processingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests one at a time
   */
  async processQueue() {
    if (this.processingQueue) return;
    this.processingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();

      try {
        // Wait for slot before executing
        await this.waitForSlot();
        this.recordRequest();

        // Execute the request
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }

    this.processingQueue = false;
  }

  /**
   * Wait until it's safe to make a new request
   * This ensures we never exceed the rate limit
   */
  async waitForSlot() {
    const now = Date.now();

    // Clean up old timestamps outside the window
    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => now - ts < this.windowMs
    );

    // If we've hit the limit, wait until the oldest request exits the window
    if (this.requestTimestamps.length >= this.maxRequests) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = this.windowMs - (now - oldestRequest) + 1000; // Add 1s buffer
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // Also ensure minimum delay between consecutive requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelayMs && this.lastRequestTime > 0) {
      const additionalWait = this.minDelayMs - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, additionalWait));
    }
  }

  /**
   * Record that a request was made
   */
  recordRequest() {
    const now = Date.now();
    this.requestTimestamps.push(now);
    this.lastRequestTime = now;
  }

  /**
   * Get current request count in window (for debugging)
   */
  getCurrentCount() {
    const now = Date.now();
    return this.requestTimestamps.filter((ts) => now - ts < this.windowMs)
      .length;
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queued: this.requestQueue.length,
      processing: this.processingQueue,
      inWindow: this.getCurrentCount(),
      maxRequests: this.maxRequests,
    };
  }
}

// Singleton instance for global rate limiting across all ClistService instances
export const clistRateLimiter = new ClistRateLimiter();

export const CLIST_NETWORK_COOLDOWN_MS = 5 * 60 * 1000;
let clistNetworkUnavailableUntil = 0;
let clistLastCooldownWarnAt = 0;

// ============================================
// ERROR TYPES AND HELPERS
// ============================================

/**
 * Custom error types for better error handling
 */
export class NetworkError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'NetworkError';
    this.originalError = originalError;
    this.retryable = true;
  }
}

export class RateLimitError extends Error {
  constructor(message, retryAfter = null) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter; // seconds to wait
    this.retryable = true;
  }
}

export class APIError extends Error {
  constructor(message, statusCode, response) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.response = response;
    this.retryable = statusCode >= 500; // Only retry on server errors
  }
}

export class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
    this.retryable = true;
  }
}

/**
 * Categorize fetch errors for better handling
 */
export function categorizeError(error, response = null) {
  // Timeout errors
  if (
    error.name === 'AbortError' ||
    error.code === 'ETIMEDOUT' ||
    error.cause?.code === 'ETIMEDOUT'
  ) {
    return new TimeoutError('Request timeout');
  }

  // Network errors
  if (
    error.code === 'ECONNRESET' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNREFUSED' ||
    error.cause?.code === 'ECONNRESET' ||
    error.name === 'TypeError'
  ) {
    return new NetworkError('Network connection failed', error);
  }

  // Rate limit errors (from response)
  if (response) {
    if (response.status === 429) {
      const retryAfter =
        response.headers.get('Retry-After') ||
        response.headers.get('X-RateLimit-Reset');
      return new RateLimitError('Rate limit exceeded', retryAfter);
    }

    // API errors
    if (!response.ok) {
      return new APIError(
        `API returned ${response.status}: ${response.statusText}`,
        response.status,
        response
      );
    }
  }

  return error;
}

// ============================================
// FETCH HELPER WITH TIMEOUT AND RETRY
// ============================================

/**
 * Fetch with timeout and retry logic with exponential backoff
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in ms (default 60000)
 * @param {number} retries - Number of retries (default 3)
 * @param {number} retryDelay - Initial delay between retries in ms (default 2000)
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(
  url,
  options = {},
  timeout = 60000,
  retries = 3,
  retryDelay = 2000
) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Check for rate limiting or API errors
      if (!response.ok) {
        const error = categorizeError(null, response);

        // Handle rate limiting with special backoff
        if (error.name === 'RateLimitError') {
          clearTimeout(timeoutId);
          lastError = error;

          if (attempt < retries) {
            const waitTime = error.retryAfter
              ? parseInt(error.retryAfter) * 1000
              : retryDelay * Math.pow(2, attempt); // Exponential backoff

            console.warn(
              `[RATE_LIMIT] Attempt ${attempt}/${retries} - ${url.substring(0, 100)}... Rate limited, waiting ${waitTime}ms`
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }
          throw error;
        }

        // For server errors (5xx), retry
        if (error.retryable && attempt < retries) {
          clearTimeout(timeoutId);
          lastError = error;
          const waitTime = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.warn(
            `[API_ERROR] Attempt ${attempt}/${retries} - ${url.substring(0, 100)}... ${error.message}, retrying in ${waitTime}ms`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }

        // For client errors (4xx), don't retry
        throw error;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // Categorize the error
      const categorizedError = categorizeError(error);
      lastError = categorizedError;

      // Don't retry on non-retryable errors
      if (!categorizedError.retryable) {
        console.error(
          `[FETCH_ERROR] Non-retryable error for ${url.substring(0, 100)}...: ${categorizedError.message}`
        );
        throw categorizedError;
      }

      // Log retry attempt
      const waitTime = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
      console.warn(
        `[${categorizedError.name}] Attempt ${attempt}/${retries} - ${url.substring(0, 100)}... ${categorizedError.message}`
      );

      // Wait before retry with exponential backoff
      if (attempt < retries) {
        console.warn(`[RETRY] Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  const errorType = lastError?.name || 'UNKNOWN';
  throw new Error(
    `[${errorType}] Fetch failed after ${retries} attempts: ${lastError?.message || 'Unknown error'}`
  );
}
