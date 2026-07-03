# Migration Plan — Phased, Reversible, Measure-First

Each phase is independently valuable and independently revertible. **Stop at any
phase** once your performance/availability goals are met — you do not have to
reach Phase 5 to get value.

---

## Phase 0 — Measure & baseline (do this first, always)

Goal: know the real hot spots before moving anything.

- [ ] Enable `pg_stat_statements` on the current DB; capture top 10 slow/frequent
      queries.
- [ ] Record baseline: p50/p95 latency, DB CPU, connection count, cache-hit ratio.
- [ ] Regenerate the clustering map from the current schema (script below) to
      confirm the cut-lines still hold.

```bash
# Regenerate FK clustering from a schema dump
F=./supabase/cloud_backup_public_20260628-092205.sql
awk '
/^ALTER TABLE/ {t=$0; sub(/.*ALTER TABLE (ONLY )?/,"",t); sub(/ .*/,"",t);
                gsub(/"|public\./,"",t); cur=t}
/REFERENCES/  {p=$0; sub(/.*REFERENCES /,"",p); sub(/[( ].*/,"",p);
                gsub(/"|public\./,"",p); if(cur&&p) print cur" -> "p}
' "$F" | sort -u > fk_edges.txt
# then run connected-components excluding the `users` hub (see 02-clustering-map.md)
```

**Exit criteria:** ranked slow-query list + baseline numbers committed to the repo.

---

## Phase 1 — Optimize the single DB (biggest ROI, no split yet)

Most of your perf goal is won here without any architecture change.

- [ ] Add indexes for the Phase-0 slow queries (FK columns, `WHERE`/`ORDER BY`).
- [ ] Switch the app to the **pooler** connection string (Supavisor/PgBouncer).
- [ ] Confirm expensive aggregates are served from `*_cache` tables, not recomputed.

**Exit criteria:** p95 latency down, connections flat under load. **If goals met,
consider stopping here.**

---

## Phase 2 — Availability: CORE read replica + Redis cache

The real "multiple servers" + availability win, minimal complexity.

- [ ] Provision the **CORE read replica** (Supabase-CORE replica).
- [ ] Stand up **Redis (Upstash)** and the cache-aside wrapper
      ([`03-router-and-caching.md`](03-router-and-caching.md)).
- [ ] Introduce the **router skeleton** (`lib/db/`) even with a single project —
      all DB access flows through it. This is the seam every later phase needs.
- [ ] Add `resolveUsers()` batch+cache helper.

**Exit criteria:** heavy public reads served from replica/cache; router is the
only DB access path.

---

> **Note on ordering:** Phases 3–5 build the **4 Supabase clusters** (all on
> Supabase). Phase 6 adds the **InsForge standby twins + sync + failover** on top.
> Do not attempt InsForge until the Supabase clusters are stable — you'd be
> mirroring a moving target.

## Phase 3 — Split off ANALYTICS on Supabase (safest cut, biggest isolation win)

Telemetry is append-only and non-critical → move it first.

- [ ] Create **Supabase-ANALYTICS**; create the ANALYTICS tables
      ([`02-clustering-map.md`](02-clustering-map.md)).
- [ ] Point new writes for `activity_logs`, `*_stats`, `sync_*`, `*_cache` there
      via the router.
- [ ] Backfill historical rows; verify counts match.
- [ ] Router: mark ANALYTICS **non-critical** → degrade gracefully if down.
- [ ] Verify an ANALYTICS outage does **not** break the app.

**Exit criteria:** logging/stats live on Supabase-ANALYTICS; app unaffected when
it's paused. **Revert = repoint router back to CORE.**

---

## Phase 4 — Split off CONTENT on Supabase (loosely-coupled public content)

- [ ] Create **Supabase-CONTENT**; migrate CONTENT clusters (events, resources,
      blog, todos, faq, committee, chat).
- [ ] Denormalize `user_id`/`created_by`; wire cross-cluster reads through
      `resolveUsers()`.
- [ ] Add orphan-reconciliation job (`user_id` vs CORE).

**Exit criteria:** content pages render via app-side joins; degrade-on-down
verified.

---

## Phase 5 — Split off LEARN on Supabase (keeps RLS)

- [ ] Create **Supabase-LEARN**; migrate the LEARN cluster.
- [ ] Repoint router; verify per-user access still enforced by RLS.
- [ ] Decide the problem-solving cluster's home
      ([`02-clustering-map.md`](02-clustering-map.md) note) — **recommended: leave
      `problems`/`submissions`/`solutions` on CORE**, keep only `*_stats` on
      ANALYTICS.

**Exit criteria:** all **4 Supabase clusters** live; submission/judge
transactions still atomic (unsplit). *This completes the single-provider design.*

---

## Phase 6 — Add InsForge standby twins + sync + failover

Only start once the 4 Supabase clusters are stable. Build twins **one cluster at a
time**, starting with the least-critical (ANALYTICS) to shake out the sync
mechanism, ending with CORE. Full detail:
[`06-sync-and-failover.md`](06-sync-and-failover.md).

- [ ] **Verify InsForge inbound-replication capability** → choose sync mechanism
      A/B/C ([`06-sync-and-failover.md`](06-sync-and-failover.md)). **Blocking.**
- [ ] For each cluster (ANALYTICS → CONTENT → LEARN → CORE):
  - [ ] Create the **`InsForge-<CLUSTER>`** project; apply the **same migration
        files** used for the Supabase twin (identical schema).
  - [ ] Establish **one-way sync** (Supabase → InsForge); monitor replication lag.
  - [ ] Add the InsForge client to the router; wire `health.ts` probes.
  - [ ] Test **read failover** by pausing the Supabase side.
  - [ ] Write & **rehearse** the **promotion** and **failback** runbooks.
- [ ] For **CORE**: additionally verify the **auth path works on the promoted
      InsForge** (no Supabase Auth there) before declaring it production-ready.
- [ ] Enforce the **split-brain rule**: at most one writable provider per cluster.

**Exit criteria:** each cluster survives a Supabase-side outage (reads immediately,
writes after promotion); failback rehearsed; replication-lag alerts live.

---

## Cross-cutting: operational conventions

- **Migrations:** one folder per cluster, applied to **both** its Supabase and
  InsForge projects from the **same files** (`supabase/migrations`,
  `db/analytics/migrations`, `db/content/migrations`, `db/learn/migrations`).
  Never let a migration assume a table that lives in another cluster.
- **Secrets:** `<CLUSTER>_SUPABASE_URL`, `<CLUSTER>_SUPABASE_POOL_URL`,
  `<CLUSTER>_INSFORGE_URL` per cluster; only the router reads them.
- **Monitoring:** one board with per-cluster, per-provider uptime, **replication
  lag**, and promotion events (see [`06-sync-and-failover.md`](06-sync-and-failover.md)).
- **Backups:** PITR on the Supabase CORE primary (critical); scheduled dumps on
  the rest. The InsForge twin is a standby, **not** a substitute for backups.

---

## Rollback posture

Because the **router is the single choke point**:

- **Cluster splits (Phases 3–5)** are reversible by flipping a table's entry in
  `table-map.ts` back to CORE and repointing reads — no app code changes.
- **InsForge twins (Phase 6)** are reversible by removing the InsForge client from
  the router; the Supabase primaries are untouched, so there is no data risk in
  backing out the standby layer.

Keep source data on the Supabase primary (or a snapshot) until a phase has been
stable in production for one full cycle.
