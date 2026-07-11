/**
 * @file Multi-database router — the single choke point for reads and writes.
 * @module db/router
 *
 * Extends the existing read seam (`supabaseRead()` in
 * app/_lib/integrations/supabase.js) and cache-aside layer
 * (app/_lib/services/data/_cache.js) into one place that decides, per operation:
 *
 *   dbWrite() — run the mutation on Supabase (source of truth), enqueue the
 *               change to the replication outbox (→ InsForge, async), then
 *               invalidate affected cache keys. Both databases end up consistent
 *               without an inline second write (see outbox.js / the design docs).
 *
 *   dbRead()  — serve from cache; on miss, read from Supabase (primary/replica),
 *               or fail over to the InsForge mirror when Supabase is unhealthy.
 *
 * Inert by default: with no Redis, no replica, and no InsForge env, dbRead falls
 * through to the Supabase admin client and dbWrite just runs the mutation +
 * (best-effort) enqueue — behavior identical to calling supabaseAdmin directly.
 *
 * Design: docs/architecture/proposals/multi-database/03-router-and-caching.md
 */

import { supabaseAdmin, supabaseRead } from '@/app/_lib/integrations/supabase';
import { cached, invalidate } from '@/app/_lib/services/data/_cache';
import { enqueue } from './outbox';
import { isSupabaseUp, isInsforgeUp } from './health';
import { insforgeQuery } from './insforge-client';

/**
 * Performs a write against Supabase and records it for replication to InsForge.
 *
 * The caller supplies `mutate(client)`, which must `.select()` the affected
 * row(s) so the router can derive the outbox entry from the **actual result**
 * (not the original query object — Supabase embedded-join selects don't port to
 * InsForge, and insert-generated ids aren't known until after the mutation
 * runs). Works with both `.single()` results (`data` is one row) and
 * multi-row results (`data` is an array) — every affected row is enqueued.
 *
 * For `delete`, supabase-js's default response has no `data` unless the query
 * added `.select()`; callers that skip `.select()` on a delete must pass
 * `pk` explicitly (payload is irrelevant for deletes).
 *
 * @template T
 * @param {object} args
 * @param {string} args.table          affected table name
 * @param {'insert'|'update'|'delete'} args.op
 * @param {(client: import('@supabase/supabase-js').SupabaseClient) => Promise<{data: T, error: any}>} args.mutate
 * @param {string[]} [args.pkColumns=['id']]  columns that form the primary key, read off each result row
 * @param {Record<string, unknown>} [args.pk]  explicit PK (required for deletes without `.select()`)
 * @param {string[]} [args.cacheKeys]   cache keys to invalidate on success
 * @param {boolean} [args.replicate=true]  set false for Supabase-only tables (e.g. auth-specific, or the outbox itself)
 * @returns {Promise<{data: T, error: any}>}
 */
export async function dbWrite({
  table,
  op,
  mutate,
  pkColumns = ['id'],
  pk,
  cacheKeys = [],
  replicate = true,
}) {
  const res = await mutate(supabaseAdmin);
  if (res.error) return res; // don't replicate or invalidate a failed write

  if (replicate) {
    const rows = Array.isArray(res.data) ? res.data : res.data ? [res.data] : null;

    if (rows) {
      for (const row of rows) {
        const rowPk = Object.fromEntries(pkColumns.map((c) => [c, row[c]]));
        await enqueue({ table, op, pk: rowPk, payload: op === 'delete' ? null : row });
      }
    } else if (op === 'delete' && pk) {
      await enqueue({ table, op, pk, payload: null });
    } else {
      // No rows returned and no explicit pk — the mutation likely omitted
      // `.select()`. Surface it loudly rather than silently dropping the change.
      console.warn(
        `[router] dbWrite(${table}/${op}) had no result rows and no explicit pk — ` +
          `change NOT replicated. Add .select() to the mutation or pass pk explicitly.`
      );
    }
  }

  if (cacheKeys.length) await invalidate(...cacheKeys);

  return res;
}

/**
 * Cache-aside read with provider failover.
 *
 * @template T
 * @param {object} args
 * @param {() => Promise<T>} args.query   loader that reads via the passed-in mode
 * @param {string} [args.cacheKey]        namespaced key; omit to skip caching
 * @param {number} [args.ttl]             cache TTL seconds
 * @returns {Promise<T>}
 *
 * Note: the `query` loader chooses its own client (via `pickReadClient` or
 * `readWithFailover`); read-your-write pinning is a loader concern, not dbRead's.
 */
export async function dbRead({ query, cacheKey, ttl }) {
  const run = () => query();
  if (!cacheKey) return run();
  return cached(cacheKey, run, ttl);
}

/**
 * Returns the client a read loader should use RIGHT NOW: Supabase (replica when
 * available and not a fresh read) normally, else the Supabase primary. Callers
 * that can tolerate the InsForge fallback should use `readWithFailover` instead.
 *
 * @param {{freshRead?: boolean}} [opts]
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function pickReadClient({ freshRead = false } = {}) {
  return freshRead ? supabaseAdmin : supabaseRead();
}

/**
 * Runs a read against Supabase; if Supabase is unhealthy AND the InsForge mirror
 * is up, retries the equivalent read against InsForge (raw SQL). The caller
 * supplies both forms because the supabase-js query and the InsForge SQL are not
 * interchangeable (PostgREST embedded joins don't port).
 *
 * @template T
 * @param {object} args
 * @param {() => Promise<T>} args.supabaseRead  primary read (supabase-js)
 * @param {(q: typeof insforgeQuery) => Promise<T>} [args.insforgeReadSql]  failover read (raw SQL)
 * @returns {Promise<T>}
 */
export async function readWithFailover({ supabaseRead: primaryRead, insforgeReadSql }) {
  if (await isSupabaseUp()) {
    try {
      return await primaryRead();
    } catch (err) {
      // fall through to failover only if Supabase is actually down
      if (await isSupabaseUp()) throw err;
    }
  }

  if (insforgeReadSql && (await isInsforgeUp())) {
    return insforgeReadSql(insforgeQuery);
  }

  // No healthy provider / no failover form supplied — do the primary read so the
  // caller gets Supabase's real error rather than a masked one.
  return primaryRead();
}
