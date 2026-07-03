# 07 — Scaling Path (headroom without over-building)

The design must grow to 10×–100× **without a rewrite** (S1) — but nothing here is
built before its **trigger** fires. Each step is independent and reversible
because the DAL and adapters hide it from the app.

---

## Trigger-driven scaling ladder

| Stage | Trigger (measured) | Action | Doc |
|---|---|---|---|
| **Now** | baseline | indexes, pooling, cache-aside, replica, async tier | 03,04,05 |
| **10×** | p95 read latency creeps up; replica read load high | add replica(s); widen cache coverage; CDN more routes | 03,04 |
| **10×** | job volume/fan-out grows | move queue to managed (QStash/SQS) + dedicated workers | 05 |
| **20×** | one table large & slow (`submissions`, `activity_logs`) | **partition** that table (by time/range) | 03 |
| **20×** | telemetry writes noisy on primary | extract `activity_logs`/`*_stats` to a **separate project** (functional split, 1 context) | 03 |
| **50×+** | a context needs independent deploy/scale | extract that **bounded context** to its own service behind an API | 02 |
| **100×+** | write throughput on primary is the ceiling (proven) | reopen the **multi-DB split** (the existing 8-project design) | `../proposals/multi-database/README.md` |

> The 8-project multi-DB/failover design ([`../proposals/multi-database/README.md`](../proposals/multi-database/README.md)) sits at
> the **bottom** of this ladder on purpose. It's the last resort for a
> write-scale ceiling — not step one. ADR
> [`09-adr/0001-data-tier.md`](09-adr/0001-data-tier.md) records why.

---

## Why this order (cheapest, safest, highest-leverage first)

1. **Indexes/pooling/cache** — 10× headroom for near-zero risk. Almost always the
   real fix at small scale.
2. **Replica** — read scaling + HA, one managed feature, no app rewrite.
3. **Async tier** — removes the latency/availability coupling to external deps;
   benefits every scale.
4. **Partitioning** — solves *one table too big* without splitting the schema.
5. **Functional split** (telemetry) — isolates the one noisy write context; keeps
   the relational core intact.
6. **Context extraction** — only when a context needs its own release/scale cadence.
7. **Multi-DB sharding** — only when the primary's *write* throughput is genuinely
   maxed, which for a 95-user relational app is a distant horizon.

---

## What NOT to do (anti-patterns for this app)

- ❌ Row-sharding by `user_id` — breaks FKs/RLS/JOINs; no benefit until enormous
  write scale.
- ❌ Splitting the tightly-coupled core (`users`, `submissions`, `problems`,
  `contests`) across servers.
- ❌ Standing up microservices before a context proves it needs independent scale.
- ❌ Adding infra (Redis clusters, managed queues, tracing) ahead of a trigger.

**Rule:** every scaling step requires a metric that crossed a threshold
([`06-observability.md`](06-observability.md)), not a hunch. Growth is earned by
evidence.
