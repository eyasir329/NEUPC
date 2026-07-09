/**
 * @file Provider health + circuit breaker for the multi-database router.
 * @module db/health
 *
 * Cheap liveness probes for Supabase (primary) and InsForge (mirror), with an
 * N-strike circuit breaker so a single blip doesn't flap the router. The router
 * calls `isSupabaseUp()` to decide whether reads go to Supabase or fail over to
 * InsForge. Results are cached briefly so probing doesn't run on every request.
 *
 * Design: docs/architecture/proposals/multi-database/06-sync-and-failover.md
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { insforgeQuery, isInsforgeRuntimeConfigured } from './insforge-client';

const PROBE_TIMEOUT_MS = 3_000;
// Consecutive failures before a provider is considered "down". A single slow
// request shouldn't trigger failover; sustained failure should.
const FAILURE_THRESHOLD = 3;
// How long a probe result is trusted before re-probing (avoids per-request DB hits).
const CACHE_TTL_MS = 5_000;

const state = {
  supabase: { up: true, consecutiveFailures: 0, checkedAt: 0, latencyMs: 0 },
  insforge: { up: true, consecutiveFailures: 0, checkedAt: 0, latencyMs: 0 },
};

function record(provider, ok, latencyMs) {
  const s = state[provider];
  s.checkedAt = Date.now();
  s.latencyMs = latencyMs;
  if (ok) {
    s.consecutiveFailures = 0;
    s.up = true;
  } else {
    s.consecutiveFailures += 1;
    if (s.consecutiveFailures >= FAILURE_THRESHOLD) s.up = false;
  }
  return s.up;
}

async function probeSupabase() {
  const start = Date.now();
  try {
    // Lightweight round-trip through PostgREST. `head` avoids transferring rows.
    const { error } = await supabaseAdmin
      .from('website_settings')
      .select('*', { count: 'exact', head: true })
      .abortSignal(AbortSignal.timeout(PROBE_TIMEOUT_MS));
    return record('supabase', !error, Date.now() - start);
  } catch {
    return record('supabase', false, Date.now() - start);
  }
}

async function probeInsforge() {
  if (!isInsforgeRuntimeConfigured) {
    // Not configured → treat as unavailable for failover, but don't spam probes.
    state.insforge = { up: false, consecutiveFailures: FAILURE_THRESHOLD, checkedAt: Date.now(), latencyMs: 0 };
    return false;
  }
  const start = Date.now();
  try {
    await insforgeQuery('select 1');
    return record('insforge', true, Date.now() - start);
  } catch {
    return record('insforge', false, Date.now() - start);
  }
}

async function freshOrProbe(provider, probe) {
  const s = state[provider];
  if (Date.now() - s.checkedAt < CACHE_TTL_MS) return s.up;
  return probe();
}

/** @returns {Promise<boolean>} whether Supabase is currently considered up. */
export function isSupabaseUp() {
  return freshOrProbe('supabase', probeSupabase);
}

/** @returns {Promise<boolean>} whether the InsForge mirror is reachable (for failover reads). */
export function isInsforgeUp() {
  return freshOrProbe('insforge', probeInsforge);
}

/**
 * Snapshot of both providers' health for /api/health/ready and monitoring.
 * Forces a fresh probe of each so the endpoint reflects current reality.
 * @returns {Promise<{supabase: object, insforge: object}>}
 */
export async function healthSnapshot() {
  await Promise.all([probeSupabase(), probeInsforge()]);
  return {
    supabase: { ...state.supabase },
    insforge: { ...state.insforge },
  };
}
