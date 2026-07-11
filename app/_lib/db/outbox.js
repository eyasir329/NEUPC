/**
 * @file Replication outbox — enqueue writes and replay them into InsForge.
 * @module db/outbox
 *
 * `enqueue()` records one change (called from the router's `dbWrite`, after the
 * Supabase mutation commits). `replayBatch()` is run by the replayer cron: it
 * atomically claims a batch of pending rows (in write order), applies each to
 * InsForge via the runtime client, and marks them done or schedules a retry.
 *
 * Guarantees: at-least-once (a crash mid-apply leaves the row 'running'; it is
 * reclaimed after the visibility window) + idempotent apply (PK upsert / delete
 * by PK), so re-delivery converges instead of corrupting.
 *
 * The outbox is Supabase-local infrastructure and is never itself replicated.
 *
 * Design: docs/architecture/proposals/multi-database/06-sync-and-failover.md
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { applyChange, isInsforgeRuntimeConfigured } from './insforge-client';

const OUTBOX = 'replication_outbox';

/**
 * Records a change to replicate. Best-effort and non-throwing by default: a
 * failure to enqueue must not fail the user's write (the Supabase write already
 * committed). Returns whether the row was enqueued so callers can log drift.
 *
 * @param {{table: string, op: 'insert'|'update'|'delete', pk: Record<string, unknown>, payload?: Record<string, unknown>|null}} change
 * @returns {Promise<boolean>}
 */
export async function enqueue({ table, op, pk, payload = null }) {
  try {
    const { error } = await supabaseAdmin.from(OUTBOX).insert({
      table_name: table,
      op,
      pk,
      payload: op === 'delete' ? null : payload,
    });
    if (error) {
      console.warn(`[outbox] enqueue failed for ${table}/${op}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[outbox] enqueue threw for ${table}/${op}:`, err?.message);
    return false;
  }
}

/**
 * Claims and replays up to `limit` pending rows into InsForge.
 *
 * @param {number} [limit=50]
 * @returns {Promise<{claimed: number, done: number, retried: number, dead: number, skipped: boolean}>}
 */
export async function replayBatch(limit = 50) {
  const result = { claimed: 0, done: 0, retried: 0, dead: 0, skipped: false };

  if (!isInsforgeRuntimeConfigured) {
    // Nothing to replay to — leave rows pending so they drain once configured.
    result.skipped = true;
    return result;
  }

  const { data: claimed, error } = await supabaseAdmin.rpc('claim_replication_outbox', {
    batch_size: limit,
  });
  if (error) throw new Error(`claim_replication_outbox failed: ${error.message}`);
  if (!claimed || claimed.length === 0) return result;

  result.claimed = claimed.length;

  for (const row of claimed) {
    try {
      await applyChange({
        table: row.table_name,
        op: row.op,
        pk: row.pk,
        payload: row.payload,
      });
      await markDone(row.id);
      result.done += 1;
    } catch (err) {
      const dead = row.attempts >= row.max_attempts;
      await markFailed(row.id, err?.message ?? String(err), dead);
      if (dead) result.dead += 1;
      else result.retried += 1;
    }
  }

  return result;
}

async function markDone(id) {
  await supabaseAdmin
    .from(OUTBOX)
    .update({ status: 'done', processed_at: new Date().toISOString(), last_error: null })
    .eq('id', id);
}

async function markFailed(id, message, dead) {
  // `attempts` was already incremented by the claim function. A non-dead row
  // returns to 'pending' so a later invocation retries it; a dead row parks in
  // 'dead' for inspection (never silently dropped).
  await supabaseAdmin
    .from(OUTBOX)
    .update({ status: dead ? 'dead' : 'pending', last_error: message?.slice(0, 2000) })
    .eq('id', id);
}

/**
 * Replication lag/health for monitoring: pending backlog, dead-letter count, and
 * age of the oldest pending row (seconds). Safe when the table is empty.
 *
 * @returns {Promise<{pending: number, dead: number, oldestPendingAgeSec: number|null}>}
 */
export async function replicationLag() {
  const [pendingRes, deadRes, oldestRes] = await Promise.all([
    supabaseAdmin.from(OUTBOX).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from(OUTBOX).select('*', { count: 'exact', head: true }).eq('status', 'dead'),
    supabaseAdmin
      .from(OUTBOX)
      .select('created_at')
      .eq('status', 'pending')
      .order('id', { ascending: true })
      .limit(1),
  ]);

  const oldest = oldestRes.data?.[0]?.created_at;
  const oldestPendingAgeSec = oldest
    ? Math.round((Date.now() - new Date(oldest).getTime()) / 1000)
    : null;

  return {
    pending: pendingRes.count ?? 0,
    dead: deadRes.count ?? 0,
    oldestPendingAgeSec,
  };
}
