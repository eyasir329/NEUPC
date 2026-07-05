# 08 — Execution Roadmap

Phased, prioritized, reversible. Each phase is independently valuable — **stop
when your goals are met**. Ordered by impact-per-effort against the NFRs.

---

## Phase 0 — Measure & guardrails (before any change)

Establish the baseline the whole redesign is judged against, and the boundaries
that keep it from eroding.

- [ ] Enable `pg_stat_statements`; capture top slow/frequent queries + p95 latency
      + connection counts (baseline). → verifies P2 later *(SQL prepared: `scripts/db/phase0-baseline.sql` — run in Supabase SQL editor)*
- [x] **Audit direct Supabase usage outside the DAL (R7)** → **133 files** query
      Supabase directly (50 API routes, 44 actions, 30 non-DAL services, 9 other).
      See [`09-adr/0003-strict-layering.md`](09-adr/0003-strict-layering.md) — the
      invariant is not yet enforced; requires a **ratchet**, not a big-bang rule.
- [x] **Cron trigger config (R2)** → `vercel.json` `crons: []` is **empty** while 3
      routes check `CRON_SECRET`. Jobs rely on an **external scheduler** (or aren't
      running). **Action:** confirm the external scheduler exists, or add Vercel
      cron entries. Addressed in Phase 3.
- [x] **Connection type (R6)** → app uses `@supabase/supabase-js` over **HTTP
      (PostgREST)**, not a direct Postgres TCP connection. The serverless
      connection-exhaustion cliff **does not apply** to current usage. Pooler work
      in Phase 1 is therefore **only needed if** a direct DB driver is added later.
- [ ] Stand up the **first dashboard** (5 tiles, [`06-observability.md`](06-observability.md)).

**Exit:** baseline committed; risks R2/R6/R7 sized with real numbers. **✅ R2/R6/R7
sized (see above).** Remaining: run the baseline SQL + first dashboard.

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

- [x] **Queue + idempotent workers** — Postgres `jobs` table
      (`20260703130000_create_jobs_queue.sql`) with atomic `claim_jobs`
      (FOR UPDATE SKIP LOCKED), DAL (`services/data/jobs.js`), worker + registry
      (`services/job-worker.js`, `job-handlers.js`), drain route
      (`/api/jobs/drain`). Retries w/ backoff + jitter; dead-letters on exhaustion. (A3)
- [x] **Circuit breaker** utility (`utils/circuit-breaker.js`) — per-dependency
      fail-fast, composes with existing `fetchWithTimeout` (timeouts/retries
      already present in `problem-solving-services/_shared.js`). (A2)
- [x] **Fix cron triggers (R2)** — `vercel.json` now schedules the 3 existing
      crons + the drain route (was `[]`). Auth compatible with Vercel Cron.
- [~] **Move slow work into jobs** — seam is live; `email.send` handler wired as
      the reference. Remaining enqueue-site migrations (LLM, leaderboard, Google
      sync) are incremental, per handler, using the same pattern. (P3)
- [~] **Wrap each adapter in its breaker** — `withBreaker('<judge>', …)` around
      the existing `fetchWithTimeout` calls; incremental per adapter. (A2)

**Exit:** no external call on a user request path; a killed dependency degrades
only its own section; jobs retry and alert on dead-letter. **Infra needed:** run
the `jobs` migration; set `CRON_SECRET` in Vercel env for scheduled drains.

---

## Phase 4 — Observability & SLOs (make it provable)

- [x] **Readiness endpoint** — `/api/health/ready` probes primary DB (gates
      readiness → 200/503), plus replica, cache, queue depth, and breaker states
      (informational). `/api/health` stays as the lightweight liveness probe.
- [~] **Error monitoring** — PostHog error tracking is live (`capture_exceptions`
      in `instrumentation-client.js`). **Infra step (you):** add `@sentry/nextjs`
      *or* rely on PostHog; wire source-map upload for de-minified stack traces.
- [ ] Structured logs + correlation ids across tiers. (incremental)
- [ ] Define SLOs + alerts ([`06-observability.md`](06-observability.md)); write a
      **runbook per alert**. (in PostHog / your monitoring tool)

**Exit:** every NFR has a metric and an alert; incidents are detected by alerts,
not users. **Partially met:** readiness + client error capture live; SLO/alert
config is a dashboard task in PostHog.

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
