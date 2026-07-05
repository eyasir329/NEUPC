/**
 * @file Readiness check API endpoint (Phase 4 — observability).
 *
 * Deeper than /api/health (liveness): probes each dependency and reports
 * per-dependency status, so degradation is visible instead of binary. Returns
 * 200 when core (DB) is healthy, 503 when it isn't. Non-critical dependencies
 * (replica, cache) being down is reported but does NOT fail readiness — the app
 * degrades gracefully (A2).
 *
 * Docs: docs/architecture/system-design/06-observability.md
 *
 * @module ReadinessCheck
 */

import { NextResponse } from 'next/server';
import {
  supabaseAdmin,
  hasReadReplica,
  supabaseReadReplica,
} from '@/app/_lib/integrations/supabase';
import { isCacheEnabled } from '@/app/_lib/services/data/_cache';
import { queueStats } from '@/app/_lib/services/data/jobs';
import { breakerStates } from '@/app/_lib/utils/circuit-breaker';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function ping(client) {
  const t = Date.now();
  try {
    // Cheap round-trip: HEAD-style count on a tiny table.
    const { error } = await client
      .from('website_settings')
      .select('*', { count: 'exact', head: true });
    if (error) return { ok: false, ms: Date.now() - t, error: error.message };
    return { ok: true, ms: Date.now() - t };
  } catch (err) {
    return { ok: false, ms: Date.now() - t, error: err?.message };
  }
}

export async function GET() {
  const checks = {};

  // Core: primary DB (critical — gates readiness)
  checks.primary = await ping(supabaseAdmin);

  // Non-critical: replica (only if configured)
  checks.replica = hasReadReplica
    ? await ping(supabaseReadReplica)
    : { ok: true, skipped: 'no replica configured' };

  // Non-critical: shared cache
  checks.cache = { ok: true, enabled: isCacheEnabled() };

  // Queue depth + breaker snapshot (informational)
  let queue = {};
  try {
    queue = await queueStats();
  } catch (err) {
    queue = { error: err?.message };
  }
  checks.queue = queue;
  checks.breakers = breakerStates();

  // Readiness is gated ONLY by the primary DB.
  const ready = checks.primary.ok === true;

  return NextResponse.json(
    {
      status: ready ? 'ready' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: ready ? 200 : 503,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    }
  );
}
