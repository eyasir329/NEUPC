/**
 * @file Replication outbox drainer (multi-database tier — Supabase → InsForge).
 *
 * Claims pending `replication_outbox` rows and applies them to the InsForge
 * mirror. Invoked on a schedule (Vercel Cron / external scheduler) — protected
 * by CRON_SECRET, matching the other cron routes. Idempotent + at-least-once, so
 * running it more often than needed is safe.
 *
 * Design: docs/architecture/proposals/multi-database/06-sync-and-failover.md
 *
 * @module CronReplicateOutboxRoute
 */

import { NextResponse } from 'next/server';
import { replayBatch, replicationLag } from '@/app/_lib/db/outbox';

// Draining is background work — allow more time than a normal request.
export const maxDuration = 60;

function verifyCronSecret(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn('CRON_SECRET not configured');
    return true; // Allow in development
  }
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const started = Date.now();
  try {
    // Drain in a few batches per invocation, stopping when the outbox is empty
    // or we approach the time budget.
    let total = { claimed: 0, done: 0, retried: 0, dead: 0, skipped: false };
    for (let i = 0; i < 5; i++) {
      const summary = await replayBatch(50);
      total = {
        claimed: total.claimed + summary.claimed,
        done: total.done + summary.done,
        retried: total.retried + summary.retried,
        dead: total.dead + summary.dead,
        skipped: summary.skipped,
      };
      if (summary.skipped || summary.claimed === 0) break; // drained or not configured
      if (Date.now() - started > 45_000) break; // time budget
    }

    const lag = await replicationLag();

    return NextResponse.json({
      ok: true,
      ...total,
      lag,
      durationMs: Date.now() - started,
    });
  } catch (err) {
    console.error('[replicate-outbox] drain failed:', err?.message);
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'drain failed' },
      { status: 500 }
    );
  }
}
