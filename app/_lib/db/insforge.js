/**
 * @file InsForge standby client — minimal health check only.
 * @module db/insforge
 *
 * InsForge holds a schema-only mirror of the Supabase database (see
 * docs/architecture/proposals/multi-database/). It is not queried for reads
 * or writes yet — this module only exposes a health check, surfaced in
 * /api/health/ready, so the standby's reachability is observable. Live
 * failover/sync is a later phase
 * (docs/architecture/proposals/multi-database/05-migration-plan.md).
 */

const insforgeUrl = process.env.INSFORGE_URL;
const insforgeApiKey = process.env.INSFORGE_API_KEY;

export const isInsforgeConfigured = !!(insforgeUrl && insforgeApiKey);

/**
 * Checks whether the InsForge standby is reachable.
 * @returns {Promise<{ok: boolean, latencyMs: number, error?: string}>}
 */
export async function checkInsforgeHealth() {
  if (!isInsforgeConfigured) {
    return { ok: false, latencyMs: 0, error: 'not configured' };
  }

  const start = Date.now();
  try {
    const res = await fetch(`${insforgeUrl}/api/health`, {
      headers: { Authorization: `Bearer ${insforgeApiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    return { ok: res.ok, latencyMs };
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - start, error: err.message };
  }
}
