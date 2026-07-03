# 08 — Execution Roadmap

Phased, prioritized, reversible. Each phase is independently valuable — **stop
when your goals are met**. Ordered by impact-per-effort against the NFRs.

---

## Phase 0 — Measure & guardrails (before any change)

Establish the baseline the whole redesign is judged against, and the boundaries
that keep it from eroding.

- [ ] Enable `pg_stat_statements`; capture top slow/frequent queries + p95 latency
      + connection counts (baseline). → verifies P2 later
- [ ] Audit **direct Supabase usage outside the DAL** (R7) — list every offender.
- [ ] Confirm how the 3 cron routes are triggered (R2); confirm pooler vs direct
      connection (R6).
- [ ] Stand up the **first dashboard** (5 tiles, [`06-observability.md`](06-observability.md)).

**Exit:** baseline committed; risks R2/R6/R7 sized with real numbers.

---

## Phase 1 — Harden the foundation (biggest ROI, lowest risk)

- [ ] Add indexes for Phase-0 slow queries; verify with `EXPLAIN ANALYZE`. (P2)
- [ ] Switch app to the **pooler** connection string. (P2, S1)
- [ ] Enforce layering: **DAL is the only Supabase door**; adapters are the only
      external door — ESLint boundary rule / CI grep. (M1, M2; fixes R7)
- [ ] Route public/heavy reads through the DAL's **replica** path (provision the
      read replica). (A1)

**Exit:** p95 down, connections flat, boundary rule green in CI, replica serving
reads. **If perf/availability goals are met, you can pause here.**

---

## Phase 2 — Caching tier (performance)

- [ ] Add **Redis (Upstash)** + cache-aside wrapper in the DAL. (P1, P2)
- [ ] Implement `resolveUsers()` batch+cache. (P2)
- [ ] Move external-API caching from `api_cache` → Redis (R5); retire cross-request
      in-process `Map`s (R3).
- [ ] Namespace cache keys per context; wire targeted invalidation on writes.

**Exit:** cache hit ratio > 80% on hot keys; DB read load drops.

---

## Phase 3 — Async / resilience tier (availability — highest impact)

- [ ] Introduce the **queue + idempotent workers** (start: `jobs` table / pg-boss /
      Supabase Queues). (A3)
- [ ] Move judge sync, leaderboard recompute, LLM, email, Google sync **off the
      request/cron path** into jobs. (P3)
- [ ] Fix cron triggers + make jobs idempotent + retried + dead-lettered (R2, A3).
- [ ] Add **circuit breakers, timeouts, bulkheads** to every adapter. (A2)
- [ ] Implement the **degradation contract** per the failure-mode matrix. (A2)

**Exit:** no external call on a user request path; a killed dependency degrades
only its own section; jobs retry and alert on dead-letter.

---

## Phase 4 — Observability & SLOs (make it provable)

- [ ] Structured logs + correlation ids across tiers.
- [ ] Instrument routes/actions, adapters (breaker state), jobs, cache, data tier.
- [ ] Define SLOs + alerts ([`06-observability.md`](06-observability.md)); write a
      **runbook per alert**.
- [ ] Extend `/api/health` to a per-dependency **readiness** check.

**Exit:** every NFR has a metric and an alert; incidents are detected by alerts,
not users.

---

## Phase 5 — Headroom (only when a trigger fires)

Do **not** pre-build. Execute a step from [`07-scaling-path.md`](07-scaling-path.md)
only when its measured trigger crosses threshold (partitioning, telemetry split,
context extraction, and — last — the multi-DB split).

---

## Sequencing rationale

```text
0 Measure ─► 1 Foundation ─► 2 Cache ─► 3 Async/Resilience ─► 4 Observability ─► 5 Headroom
  (see)       (perf, safe)    (perf)     (availability!)         (prove it)        (earn it)
```

- Foundation first: indexes/pooling/boundaries are prerequisites and pure win.
- Cache before async: many "slow" paths just need a cache; reduces async scope.
- Async is the availability centerpiece — but it rests on cache (degrade to stale)
  and observability-readiness.
- Observability last of the *core* phases so it instruments the final shape — but
  its **first dashboard ships in Phase 0** so every phase is evidence-driven.

## Reversibility

Every phase backs out cleanly: the **DAL** hides cache/replica/data changes from
the app; the **adapter interface** hides resilience patterns; the **queue** is
additive (fall back to synchronous if disabled). No phase is a one-way door.
