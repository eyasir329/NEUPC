/**
 * @file In-memory rate limiter for API routes and server actions.
 * Uses a sliding-window approach with automatic cleanup.
 *
 * NOTE: This is per-process. In serverless/edge environments each
 * cold start gets its own window. For production-scale apps consider
 * Redis-backed rate limiting, but this provides meaningful protection
 * against brute-force and spam within a single deployment instance.
 *
 * @module rate-limiter
 */

/** @type {Map<string, { count: number, resetAt: number }>} */
const buckets = new Map();

/** Clean stale entries every 5 minutes to prevent memory leaks. */
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Check whether a request should be rate-limited.
 *
 * @param {string} key — Unique identifier (e.g. IP, userId, or composite).
 * @param {object} [options]
 * @param {number} [options.limit=60]     — Max requests per window.
 * @param {number} [options.windowMs=60000] — Window size in ms (default 60 s).
 * @returns {{ limited: boolean, remaining: number, retryAfterMs: number }}
 */
export function rateLimit(key, { limit = 60, windowMs = 60_000 } = {}) {
  cleanup();

  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    // New window
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: limit - 1, retryAfterMs: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    const retryAfterMs = bucket.resetAt - now;
    return { limited: true, remaining: 0, retryAfterMs };
  }

  return { limited: false, remaining: limit - bucket.count, retryAfterMs: 0 };
}

/**
 * Pre-configured rate limiter for public forms (contact, etc.).
 * 5 submissions per 15 minutes per IP.
 */
export function rateLimitPublicForm(ip) {
  return rateLimit(`form:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
}

/**
 * Pre-configured rate limiter for API routes.
 * 100 requests per minute per IP.
 */
export function rateLimitApi(ip) {
  return rateLimit(`api:${ip}`, { limit: 100, windowMs: 60_000 });
}

/**
 * Pre-configured rate limiter for auth-related operations.
 * 10 attempts per 15 minutes per IP.
 */
export function rateLimitAuth(ip) {
  return rateLimit(`auth:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
}
