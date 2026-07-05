/**
 * @file Job queue drain endpoint (Phase 3 — async/worker tier).
 *
 * Claims and processes a batch of queued jobs. Invoked on a schedule (Vercel
 * Cron / external scheduler) — see vercel.json. Protected by CRON_SECRET,
 * matching the other cron routes.
 *
 * Docs: docs/architecture/system-design/05-async-and-resilience.md
 *
 * @module JobsDrainRoute
 */

import { NextResponse } from 'next/server';
import { runJobs } from '@/app/_lib/services/job-worker';
import { registerHandlers } from '@/app/_lib/services/job-handlers';

// Allow more time than a normal request — draining is background work.
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

  registerHandlers();

  const started = Date.now();
  try {
    // Drain in a few batches per invocation, stopping when the queue is empty
    // or we approach the time budget.
    let total = { claimed: 0, done: 0, retried: 0, dead: 0 };
    for (let i = 0; i < 5; i++) {
      const summary = await runJobs(20);
      total = {
        claimed: total.claimed + summary.claimed,
        done: total.done + summary.done,
        retried: total.retried + summary.retried,
        dead: total.dead + summary.dead,
      };
      if (summary.claimed === 0) break; // queue drained
      if (Date.now() - started > 45_000) break; // time budget guard
    }

    return NextResponse.json({
      success: true,
      ...total,
      durationMs: Date.now() - started,
    });
  } catch (err) {
    console.error('[jobs/drain] error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'drain failed' },
      { status: 500 }
    );
  }
}
