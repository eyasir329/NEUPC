/**
 * @file Job worker — handler registry + queue runner (Phase 3).
 *
 * Handlers register by job `type`. `runJobs()` claims a batch, executes each
 * handler, and completes / retries / dead-letters based on the outcome. The
 * drain route (app/api/jobs/drain) calls `runJobs()` on a schedule.
 *
 * Handlers must be **idempotent** — a job may run more than once (at-least-once
 * delivery + retries). Docs: docs/architecture/system-design/05-async-and-resilience.md
 *
 * @module services/job-worker
 */

import {
  claimJobs,
  completeJob,
  failJob,
} from '@/app/_lib/services/data/jobs';

/** @type {Map<string, (payload:object, job:object)=>Promise<void>>} */
const handlers = new Map();

/**
 * Register a handler for a job type. Call at module load (see registerHandlers()).
 * @param {string} type
 * @param {(payload:object, job:object)=>Promise<void>} handler
 */
export function registerJob(type, handler) {
  handlers.set(type, handler);
}

/** Types with a registered handler (for diagnostics). */
export function registeredTypes() {
  return [...handlers.keys()];
}

/**
 * Claim and process up to `batchSize` jobs. Returns a summary for logging.
 *
 * @param {number} [batchSize=10]
 * @returns {Promise<{claimed:number, done:number, retried:number, dead:number}>}
 */
export async function runJobs(batchSize = 10) {
  const jobs = await claimJobs(batchSize);
  const summary = { claimed: jobs.length, done: 0, retried: 0, dead: 0 };

  for (const job of jobs) {
    const handler = handlers.get(job.type);

    if (!handler) {
      // No handler registered → dead-letter immediately so it doesn't loop.
      const { deadLettered } = await failJob(
        { ...job, attempts: job.max_attempts },
        new Error(`No handler registered for job type "${job.type}"`)
      );
      if (deadLettered) summary.dead += 1;
      continue;
    }

    try {
      await handler(job.payload || {}, job);
      await completeJob(job.id);
      summary.done += 1;
    } catch (err) {
      const { deadLettered } = await failJob(job, err);
      if (deadLettered) {
        summary.dead += 1;
        console.error(`[jobs] DEAD-LETTER ${job.type} (${job.id}): ${err?.message}`);
      } else {
        summary.retried += 1;
        console.warn(`[jobs] retry ${job.type} (${job.id}): ${err?.message}`);
      }
    }
  }

  return summary;
}
