# 03 — Data Tier

Covers the data-tier **decision** (you asked me to reconsider the 8-project
multi-DB/failover design), plus pooling, indexing, and RLS. NFRs: P2, A1, S1.

---

## The decision: single primary + read replica + shared cache

**Recommendation: do NOT build the 8-project (2 provider × 4 cluster) split now.**
Adopt a **single Supabase primary + read replica + Redis** data tier, with the DAL
as the seam that lets you split later *if and only if* a real trigger fires.

### Why (measured against your NFRs)

| Factor | 8-project multi-DB/failover | Single primary + replica + cache | Winner |
|---|---|---|---|
| Performance (P2) | cross-cluster app-side joins replace indexed JOINs → *more* round-trips | JOINs stay in-DB; cache absorbs hot reads | **single** |
| Availability (A1) | `0.999^N` across clusters; standby only helps *if* failover is tested & promoted | replica gives HA reads; far fewer moving parts to fail | **single** (at this scale) |
| Maintainability (M1) | 8 projects, 2 providers, sync pipelines, split-brain rules, dual auth | one schema, one auth (RLS), one migration path | **single** |
| Scalability headroom (S1) | scales writes eventually — but you're 3–4 orders of magnitude away from needing it | replica + cache + partitioning covers 100× from 95 users | **single** |
| Data integrity | cross-cluster FKs unenforceable; no cross-cluster transactions | FKs, transactions, RLS all intact | **single** |

At **95 users / 10 MB**, the multi-DB split trades away integrity, latency, and
simplicity to solve a write-scale problem you will not have for a very long time.
The replica + cache delivers the *availability and performance* you actually asked
for, with a fraction of the risk.

> The existing 8-project docs in [`../proposals/multi-database/README.md`](../proposals/multi-database/README.md) remain a valid
> **future option**, not the current plan. See ADR
> [`09-adr/0001-data-tier.md`](09-adr/0001-data-tier.md) and the trigger in
> [`07-scaling-path.md`](07-scaling-path.md) that would reopen it.

---

## Target data-tier topology

```text
        writes ─────────────► Supabase PRIMARY ─────► (PITR + backups)
                                    │  logical replication
        heavy/public reads ◄──── READ REPLICA
                                    ▲
        cache-aside  ◄──────── Redis (shared) ──── absorbs hot reads
        (resolve-user, leaderboards, public lists, rate-limit, sessions)
```

- **Primary:** all writes, read-your-write reads, transactions, RLS.
- **Read replica:** public/heavy reads (member pages, leaderboards, listings) —
  routed by the DAL. Doubles as a hot standby → HA reads (A1).
- **Redis:** the shared cache tier (details in [`04-caching.md`](04-caching.md)).
  Moves external-API caching **out of** `api_cache` (R5) and gives distributed
  rate-limiting/sessions (fixes R3/R4).

---

## Connection pooling (fixes R6 — a real scaling cliff)

Serverless functions open many short-lived connections; Postgres has a hard
connection ceiling. Under any burst you hit it and requests fail — a cliff, not a
slope.

- [ ] Use Supabase's **Supavisor / PgBouncer pooler** connection string in the app
      (transaction mode) — not the direct connection.
- [ ] DAL owns the client; one pooled client per runtime.
- [ ] Verify: connection count stays flat while concurrency rises. (P2, S1)

---

## Indexing (biggest single perf lever — P2)

Driven by the Phase-0 baseline, not guesswork. Expected wins from the schema
shape:

- [ ] Index every **foreign key** used in JOINs/filters (many FK columns to
      `users`, `problems`, `contests`, etc. are prime candidates).
- [ ] Composite indexes for hot `WHERE ... ORDER BY` (e.g. submissions by user +
      time; activity feeds; leaderboard source queries).
- [ ] Partial indexes for status-filtered queries (e.g. active/enrolled rows).
- [ ] Confirm each with `EXPLAIN (ANALYZE)` before/after — index used, latency down.

> Most "we need to shard" instincts at small scale are actually 3–5 missing
> indexes. Fix these first; re-measure before anything structural.

---

## RLS & the DAL contract (M2)

- **RLS stays** as the authz backbone — it's defense-in-depth even with app checks.
- **The DAL is the only door** (Invariant from [`02-architecture.md`](02-architecture.md)):
  it selects primary vs replica, applies cache-aside, and is the single place a
  future data-tier change (partitioning, extraction, or — if ever — the cluster
  split) is wired. No route/action/component queries Supabase directly.

---

## Scaling levers, in the order you'd actually use them

1. Indexes + pooling + cache-aside (covers you to ~10×). ← **do these**
2. Read replica(s) for read scaling + HA (this design). ← **do this**
3. **[headroom]** Table partitioning for the few large append tables
   (`submissions`, `activity_logs`) — when a single table gets large.
4. **[headroom]** Move write-heavy telemetry (`activity_logs`, `*_stats`) to a
   separate project — *functional* split, one context, only if it's noisy.
5. **[headroom]** The full multi-DB split — only if write throughput on the
   primary is genuinely the ceiling. See [`07-scaling-path.md`](07-scaling-path.md).

Each step is independent and reversible because the DAL hides it from the app.
