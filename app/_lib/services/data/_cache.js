/**
 * @file Shared cache-aside layer (Phase 2 — caching tier).
 *
 * A thin wrapper over Upstash Redis implementing the cache-aside pattern for
 * the data-access layer. Designed to be **inert until configured**: with no
 * Upstash env vars, every call falls through to the loader (behaves exactly as
 * if there were no cache), so shipping this changes nothing until you provision
 * Redis and set the env vars.
 *
 * Required env (when enabling):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Docs: docs/architecture/system-design/04-caching.md
 *
 * Lives inside the DAL on purpose — the DAL is the only place cache-aside and
 * invalidation should be wired (ADR 0003). Not `server-only` so it can be unit
 * tested, but it must only ever be imported by DAL code.
 *
 * @module services/data/_cache
 */

import { Redis } from '@upstash/redis';

// ── Client (lazy, optional) ──────────────────────────────────────────────────
let _redis;
let _initialized = false;

function getRedis() {
  if (_initialized) return _redis;
  _initialized = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  _redis = url && token ? new Redis({ url, token }) : null;
  return _redis;
}

/** Whether a shared cache is configured. */
export function isCacheEnabled() {
  return getRedis() !== null;
}

// ── Key namespacing ──────────────────────────────────────────────────────────
// Namespace keys per bounded context so a context can be flushed independently
// (docs/architecture/system-design/04-caching.md). e.g. key('identity','user',id)
export function key(namespace, ...parts) {
  return [namespace, ...parts].join(':');
}

// Default TTLs (seconds) — short, since invalidation-on-write is the primary
// mechanism and TTL is only the safety net.
export const TTL = {
  short: 30,
  medium: 300,
  long: 3600,
};

// ── Cache-aside ──────────────────────────────────────────────────────────────
/**
 * Read-through cache. Returns the cached value if present; otherwise runs
 * `loader()`, stores the result, and returns it. If the cache is unconfigured
 * or errors, transparently falls back to `loader()` (cache is optional — never
 * a hard dependency; A2 in the resilience design).
 *
 * @template T
 * @param {string} cacheKey  namespaced key (use `key()`)
 * @param {() => Promise<T>} loader  fetches fresh value on miss
 * @param {number} [ttlSeconds=TTL.medium]
 * @returns {Promise<T>}
 */
export async function cached(cacheKey, loader, ttlSeconds = TTL.medium) {
  const redis = getRedis();
  if (!redis) return loader();

  try {
    const hit = await redis.get(cacheKey);
    if (hit !== null && hit !== undefined) return hit;
  } catch (err) {
    // Cache read failure must never break the request — fall through to loader.
    console.warn(`[cache] read failed for ${cacheKey}:`, err?.message);
    return loader();
  }

  const value = await loader();
  try {
    if (value !== null && value !== undefined) {
      await redis.set(cacheKey, value, { ex: ttlSeconds });
    }
  } catch (err) {
    console.warn(`[cache] write failed for ${cacheKey}:`, err?.message);
  }
  return value;
}

/**
 * Invalidate one or more exact keys. Call from DAL write functions after a
 * successful mutation. Safe no-op when the cache is unconfigured.
 *
 * @param {...string} keys
 */
export async function invalidate(...keys) {
  const redis = getRedis();
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch (err) {
    console.warn(`[cache] invalidate failed:`, err?.message);
  }
}

/**
 * Batch get for many keys at once (used by resolveUsers). Returns an array
 * aligned to the input keys, with `null` for misses. Empty array (not a DB
 * call) when the cache is unconfigured, so callers treat everything as a miss.
 *
 * @param {string[]} keys
 * @returns {Promise<Array<any|null>>}
 */
export async function mget(keys) {
  const redis = getRedis();
  if (!redis || keys.length === 0) return keys.map(() => null);
  try {
    return await redis.mget(...keys);
  } catch (err) {
    console.warn(`[cache] mget failed:`, err?.message);
    return keys.map(() => null);
  }
}

/**
 * Set many key/value pairs, each with the same TTL. Safe no-op when
 * unconfigured. Uses a pipeline to avoid N round-trips.
 *
 * @param {Array<[string, any]>} entries
 * @param {number} [ttlSeconds=TTL.long]
 */
export async function msetWithTtl(entries, ttlSeconds = TTL.long) {
  const redis = getRedis();
  if (!redis || entries.length === 0) return;
  try {
    const pipe = redis.pipeline();
    for (const [k, v] of entries) {
      if (v !== null && v !== undefined) pipe.set(k, v, { ex: ttlSeconds });
    }
    await pipe.exec();
  } catch (err) {
    console.warn(`[cache] mset failed:`, err?.message);
  }
}
