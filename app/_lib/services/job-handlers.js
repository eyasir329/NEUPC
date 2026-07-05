/**
 * @file Job handler registry (Phase 3 — async/worker tier).
 *
 * Wires job `type` → implementation. Import this module once (the drain route
 * does) to register all handlers before draining the queue.
 *
 * Add a handler by:
 *   1. writing an idempotent async fn (payload, job) => Promise<void>
 *   2. registerJob('your.type', fn) below
 *   3. enqueue('your.type', {...}) from anywhere on the write path
 *
 * Docs: docs/architecture/system-design/05-async-and-resilience.md
 *
 * @module services/job-handlers
 */

import { registerJob } from '@/app/_lib/services/job-worker';
import { sendCustomEmail } from '@/app/_lib/services/email-service';

let _registered = false;

/** Idempotently register all job handlers. Safe to call multiple times. */
export function registerHandlers() {
  if (_registered) return;
  _registered = true;

  // ── email.send ──────────────────────────────────────────────────────────
  // Moves transactional email off the request path (P3). Idempotent enough for
  // at-least-once: a rare duplicate email is acceptable; wrap with a dedupeKey
  // at enqueue time when exactly-once matters.
  registerJob('email.send', async (payload) => {
    const { to, subject, html } = payload;
    if (!to || !subject) throw new Error('email.send requires { to, subject, html }');
    await sendCustomEmail(to, subject, html);
  });

  // ── Future handlers (enqueue sites already exist as sync calls today) ─────
  // registerJob('llm.analyze', async (payload) => { ... });        // AI analysis
  // registerJob('leaderboard.recompute', async () => { ... });     // heavy aggregate
  // registerJob('google.calendar.sync', async (payload) => { ... });
}
