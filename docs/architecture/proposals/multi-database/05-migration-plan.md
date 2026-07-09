# Migration Plan — Phased, Reversible, Measure-First

Each phase is independently valuable and independently revertible. **Stop at any
phase** once your performance/availability goals are met — you do not have to
reach the final phase to get value.

---

## Phase 0 — Measure & baseline (do this first, always)

Goal: know the real hot spots before adding anything.

- [ ] Enable `pg_stat_statements` on the current DB; capture top 10 slow/frequent
      queries.
- [ ] Record baseline: p50/p95 latency, DB CPU, connection count, cache-hit ratio.

**Exit criteria:** ranked slow-query list + baseline numbers committed to the repo.

---

## Phase 1 — Optimize the single DB (biggest ROI, no second provider yet)

Most of your perf goal is won here without any architecture change.

- [ ] Add indexes for the Phase-0 slow queries (FK columns, `WHERE`/`ORDER BY`).
- [ ] Switch the app to the **pooler** connection string (Supavisor/PgBouncer).
- [ ] Confirm expensive aggregates are served from `*_cache` tables, not recomputed.

**Exit criteria:** p95 latency down, connections flat under load. **If goals met,
consider stopping here.**

---

## Phase 2 — Availability groundwork: read replica + Redis cache

The real "second server" + availability win, minimal complexity, still on
Supabase only.

- [ ] Provision a **Supabase read replica** for the whole schema.
- [ ] Stand up **Redis (Upstash)** and the cache-aside wrapper
      ([`03-router-and-caching.md`](03-router-and-caching.md)).
- [ ] Introduce the **router skeleton** (`lib/db/`) even with a single provider —
      all DB access flows through it. This is the seam the InsForge phase needs.

**Exit criteria:** heavy public reads served from replica/cache; router is the
only DB access path.

---

## Phase 3 — Stand up the InsForge standby (whole-schema mirror)

Only start once Phase 0–2 is stable — you'd otherwise be mirroring a moving
target.

- [ ] **Verify InsForge inbound-replication capability** → choose sync mechanism
      A/B/C ([`06-sync-and-failover.md`](06-sync-and-failover.md)). **Blocking.**
- [ ] Create the **InsForge project**; apply the **same migration files** used
      for Supabase, so the schema is identical table-for-table.
- [ ] Establish **one-way sync** (Supabase → InsForge); monitor replication lag.
- [ ] Add the InsForge client to the router; wire `health.ts` probes.
- [ ] Test **read failover** by pausing Supabase.
- [ ] Write & **rehearse** the **promotion** and **failback** runbooks.
- [ ] Verify the **auth path works on the promoted InsForge** (no Supabase Auth
      there) before declaring it production-ready.
- [ ] Enforce the **split-brain rule**: at most one writable provider at a time.

**Exit criteria:** the app survives a Supabase outage (reads immediately, writes
after promotion); failback rehearsed; replication-lag alerts live.

---

## Cross-cutting: operational conventions

- **Migrations:** one migrations folder, applied to **both** the Supabase and
  InsForge projects from the **same files**.
- **Secrets:** `SUPABASE_URL`, `SUPABASE_POOL_URL`, `INSFORGE_URL`; only the
  router reads them.
- **Monitoring:** one board with per-provider uptime, **replication lag**, and
  promotion events (see [`06-sync-and-failover.md`](06-sync-and-failover.md)).
- **Backups:** PITR on the Supabase primary (critical); the InsForge twin is a
  standby, **not** a substitute for backups.

---

## Rollback posture

Because the **router is the single choke point**:

- **Phase 3 (InsForge standby)** is reversible by removing the InsForge client
  from the router; the Supabase primary is untouched, so there is no data risk
  in backing out the standby layer.

Keep source data on the Supabase primary (or a snapshot) until a phase has been
stable in production for one full cycle.
