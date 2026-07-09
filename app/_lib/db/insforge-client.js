/**
 * @file InsForge runtime CRUD/SQL client (replication apply + failover reads).
 * @module db/insforge-client
 *
 * The sibling `insforge.js` is health-check-only. This module adds the runtime
 * surface used by the multi-database router:
 *   - `applyChange()` — applies one outbox change (insert/update/delete) to the
 *     InsForge mirror. Insert/update use PostgREST upsert (merge-duplicates on
 *     the primary key) so replays are idempotent; delete filters by PK. The
 *     change is applied from the outbox row's column payload — NOT by re-running
 *     the original Supabase query (Supabase embedded-join selects don't port).
 *   - `insforgeQuery()` — raw SQL for failover reads and consistency checks.
 *
 * Transport: InsForge's PostgREST-style REST API (see `/api/docs/db/rest-api`):
 *   - POST/PATCH/DELETE /api/database/records/{table}
 *   - POST              /api/database/advance/rawsql   (parameterized)
 * Auth: `Authorization: Bearer ${INSFORGE_API_KEY}`.
 *
 * Design: docs/architecture/proposals/multi-database/06-sync-and-failover.md
 */

const INSFORGE_URL = process.env.INSFORGE_URL;
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY;

/** True when the runtime InsForge client has the env it needs. */
export const isInsforgeRuntimeConfigured = !!(INSFORGE_URL && INSFORGE_API_KEY);

const DEFAULT_TIMEOUT_MS = 10_000;

function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${INSFORGE_API_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function ensureConfigured() {
  if (!isInsforgeRuntimeConfigured) {
    throw new Error(
      'InsForge runtime client not configured (set INSFORGE_URL and INSFORGE_API_KEY).'
    );
  }
}

/**
 * Builds a PostgREST filter query string from a primary-key object.
 * `{ id: 'x' }` → `id=eq.x`; composite keys AND together.
 * Values are URL-encoded; PostgREST matches on the text form.
 * @param {Record<string, unknown>} pk
 * @returns {string}
 */
function pkToFilter(pk) {
  return Object.entries(pk)
    .map(([col, val]) => `${encodeURIComponent(col)}=eq.${encodeURIComponent(String(val))}`)
    .join('&');
}

async function insforgeFetch(path, { method = 'GET', headers = {}, body, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  ensureConfigured();
  const res = await fetch(`${INSFORGE_URL}${path}`, {
    method,
    headers: authHeaders(headers),
    body: body != null ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(`InsForge ${method} ${path} failed (${res.status}): ${detail}`);
  }
  // DELETE without Prefer returns 204/no body.
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Applies one replication change to the InsForge mirror. Idempotent:
 * insert/update upsert on the primary key, delete is a no-op if already gone.
 *
 * @param {{table: string, op: 'insert'|'update'|'delete', pk: Record<string, unknown>, payload?: Record<string, unknown>|null}} change
 * @returns {Promise<void>}
 */
export async function applyChange({ table, op, pk, payload }) {
  const encodedTable = encodeURIComponent(table);

  if (op === 'delete') {
    await insforgeFetch(`/api/database/records/${encodedTable}?${pkToFilter(pk)}`, {
      method: 'DELETE',
    });
    return;
  }

  // insert AND update both become an idempotent upsert keyed on the PK, so a
  // re-delivered outbox row (at-least-once) converges rather than erroring.
  if (!payload) {
    throw new Error(`applyChange: '${op}' on ${table} requires a payload`);
  }
  await insforgeFetch(`/api/database/records/${encodedTable}`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: [payload], // records API requires an array, even for one row
  });
}

/**
 * Executes a raw SQL query against InsForge (failover reads, consistency checks).
 * @param {string} query - SQL text (use `params` for values to avoid injection).
 * @param {unknown[]} [params] - positional parameters ($1, $2, ...).
 * @returns {Promise<{rows: any[], rowCount: number|null}>}
 */
export async function insforgeQuery(query, params = []) {
  const out = await insforgeFetch('/api/database/advance/rawsql', {
    method: 'POST',
    body: { query, params },
  });
  return { rows: out?.rows ?? [], rowCount: out?.rowCount ?? null };
}
