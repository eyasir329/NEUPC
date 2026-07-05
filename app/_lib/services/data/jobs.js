/**
 * @file Async job-queue data access (Phase 3 — async/worker tier).
 *
 * Enqueue/claim/complete/fail operations over the `public.jobs` table. The
 * queue decouples slow/external work from the request path: callers `enqueue()`
 * and return immediately; a worker (see app/api/jobs/drain) drains the queue.
 *
 * Docs: docs/architecture/system-design/05-async-and-resilience.md
 *
 * @module services/data/jobs
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { _log } from './_internal';

/** Exponential backoff with jitter, capped, for a given attempt count. */
function backoffMs(attempts) {
  const base = Math.min(2 ** attempts * 1000, 5 * 60 * 1000); // cap 5 min
  return base + Math.floor(Math.random() * 1000); // jitter
}

/**
 * Enqueue a job. Returns the created (or existing, if deduped) job row.
 *
 * @param {string} type  handler key, e.g. 'email.send'
 * @param {object} [payload]  JSON-serializable args for the handler
 * @param {object} [opts]
 * @param {number} [opts.priority=0]
 * @param {string} [opts.dedupeKey]  skip if an active job with this key exists (idempotency)
 * @param {number} [opts.delayMs=0]  delay before the job becomes eligible
 * @param {number} [opts.maxAttempts=5]
 * @returns {Promise<object|null>}
 */
export async function enqueue(type, payload = {}, opts = {}) {
  const runAt = new Date(Date.now() + (opts.delayMs || 0)).toISOString();
  const row = {
    type,
    payload,
    priority: opts.priority ?? 0,
    dedupe_key: opts.dedupeKey ?? null,
    run_at: runAt,
    max_attempts: opts.maxAttempts ?? 5,
  };

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .insert(row)
    .select()
    .single();

  if (error) {
    // Unique-violation on dedupe_key means an active job already exists — that's
    // the idempotency guarantee working, not a real error.
    if (error.code === '23505') return null;
    _log('enqueue', error);
    throw new Error(error.message);
  }
  return data;
}

/**
 * Atomically claim up to `batchSize` due jobs (marks them running). Uses the
 * `claim_jobs` SQL function (FOR UPDATE SKIP LOCKED) so concurrent workers
 * never double-claim.
 *
 * @param {number} [batchSize=10]
 * @returns {Promise<object[]>}
 */
export async function claimJobs(batchSize = 10) {
  const { data, error } = await supabaseAdmin.rpc('claim_jobs', {
    batch_size: batchSize,
  });
  if (error) {
    _log('claimJobs', error);
    throw new Error(error.message);
  }
  return data ?? [];
}

/** Mark a job done. */
export async function completeJob(id) {
  const { error } = await supabaseAdmin
    .from('jobs')
    .update({
      status: 'done',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_error: null,
    })
    .eq('id', id);
  if (error) _log('completeJob', error);
}

/**
 * Record a failed attempt. Reschedules with backoff if attempts remain,
 * otherwise moves the job to the `dead` state (dead-letter) for alerting.
 *
 * @param {object} job  the claimed job row (needs id, attempts, max_attempts)
 * @param {Error} err
 */
export async function failJob(job, err) {
  const exhausted = job.attempts >= job.max_attempts;
  const patch = exhausted
    ? { status: 'dead', updated_at: new Date().toISOString(), last_error: String(err?.message || err) }
    : {
        status: 'pending',
        run_at: new Date(Date.now() + backoffMs(job.attempts)).toISOString(),
        locked_at: null,
        updated_at: new Date().toISOString(),
        last_error: String(err?.message || err),
      };

  const { error } = await supabaseAdmin.from('jobs').update(patch).eq('id', job.id);
  if (error) _log('failJob', error);
  return { deadLettered: exhausted };
}

/** Queue depth by status — for the health/readiness endpoint and monitoring. */
export async function queueStats() {
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('status')
    .in('status', ['pending', 'running', 'failed', 'dead']);
  if (error) {
    _log('queueStats', error);
    return {};
  }
  return (data ?? []).reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
}
