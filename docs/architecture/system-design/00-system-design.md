# NEUPC — Whole-App System Design

> **Purpose:** a proper system-design pass over the entire application, optimizing
> for **performance**, **availability/resilience**, **maintainability**, and
> **scalability headroom** — in that combined priority.
> **Approach:** deliberate *target architecture* + migration path on the current
> stack (Next.js + Supabase + Vercel). Not a rewrite; an evolution with clear
> boundaries. Speculative pieces are marked **[headroom]** so they aren't built
> before they're needed.

---

## 0. Context — what we're designing for

- **Product:** competitive-programming community platform (members, bootcamps,
  contests, problem-solving sync, discussions, events, resources, blog, chat).
- **Scale today:** ~95 users, ~2,275 submissions, ~10 MB. Single Supabase Postgres.
- **Stack today:** Next.js App Router on Vercel; 117 pages, 77 API routes,
  52 server-action files, 62 services (incl. a 25-file data-access layer),
  20 external-judge integrations, 3 cron routes, Google/LLM integrations.
- **The honest constraint:** at this scale, **latency and downtime come from the
  application and its external dependencies, not from database load.** The design
  reflects that — it hardens the app and its I/O boundaries, and keeps the data
  tier simple, while leaving clean seams to scale each part independently later.

See [`01-current-state.md`](01-current-state.md) for the as-is assessment.

---

## 1. Non-functional requirements (the targets we design to)

| # | NFR | Target | Rationale |
|---|---|---|---|
| P1 | Page TTFB (cached routes) | < 200 ms p95 | CDN/edge + Data Cache |
| P2 | API/action latency (DB path) | < 300 ms p95 | pooling + indexes + cache-aside |
| P3 | External-sync isolation | a slow judge never blocks a user request | move to worker/queue |
| A1 | Core read availability | ≥ 99.9% | replica + graceful degradation |
| A2 | Blast-radius isolation | one subsystem failing ≠ whole app down | bounded contexts + degrade |
| A3 | Background-job resilience | jobs retry, don't lose data, don't fan out failures | queue + idempotency |
| M1 | Change safety | a change touches one layer, has a test seam | strict layering |
| M2 | Single data-access path | no ad-hoc DB calls from routes/components | DAL is the only door |
| S1 | Growth headroom | 10×–100× users with no rewrite | stateless app + scalable tiers |

These NFRs are the acceptance criteria for the whole design. Every later doc ties
back to one or more of them.

---

## 2. Target architecture (at a glance)

```text
        ┌────────────────────────────────────────────────────────────┐
        │                        Clients (browser)                    │
        └───────────────┬───────────────────────────┬────────────────┘
                        │ HTTPS                      │
                ┌───────▼────────┐          ┌────────▼─────────┐
                │  CDN / Edge    │          │  Static assets   │
                │  (Vercel edge, │          │  images, media   │
                │  cache headers)│          │  (immutable)     │
                └───────┬────────┘          └──────────────────┘
                        │
        ┌───────────────▼─────────────────────────────────────────────┐
        │              Next.js App (stateless, horizontally scalable)  │
        │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │
        │  │ Server Comp. │  │ Server Actions│ │ Route Handlers/API │  │
        │  │ (render)     │  │ (mutations)   │ │ (integration/webhk)│  │
        │  └──────┬───────┘  └──────┬────────┘ └─────────┬──────────┘  │
        │         └───────── Application/Domain services ─┘            │
        │                          │  (the ONLY DB door: DAL)          │
        └───────────┬──────────────┼───────────────────┬──────────────┘
                    │              │                   │
         ┌──────────▼───┐  ┌───────▼────────┐  ┌───────▼──────────┐
         │ Cache tier   │  │  Data tier     │  │  Async/worker    │
         │ (shared:     │  │  Supabase      │  │  tier            │
         │  Redis) +    │  │  primary       │  │  queue + workers │
         │  Data Cache  │  │  + read replica│  │  (judge sync,    │
         └──────────────┘  └────────────────┘  │  LLM, email,     │
                                                │  leaderboard)    │
                                                └───────┬──────────┘
                                                        │
                                            ┌───────────▼───────────┐
                                            │ External deps         │
                                            │ judges, Google, LLM   │
                                            │ (behind adapters +    │
                                            │  circuit breakers)    │
                                            └───────────────────────┘
```

Four tiers, each independently scalable and independently failable:

1. **Edge/CDN** — static + cacheable dynamic; first line of performance & availability.
2. **App tier** — stateless Next.js; render + mutations + integration endpoints.
3. **Data tier** — Supabase primary + read replica + shared cache.
4. **Async/worker tier** — everything slow or external, off the request path.

---

## 3. The design documents

| File | Covers | NFRs |
|---|---|---|
| [`01-current-state.md`](01-current-state.md) | As-is assessment: strengths, risks, hotspots | — |
| [`02-architecture.md`](02-architecture.md) | Target architecture, tiers, boundaries, layering rules | M1,M2,S1 |
| [`03-data-tier.md`](03-data-tier.md) | **Data-tier decision** (single+replica vs multi-DB), pooling, indexing, RLS | P2,A1,S1 |
| [`04-caching.md`](04-caching.md) | Unified caching strategy across all layers | P1,P2 |
| [`05-async-and-resilience.md`](05-async-and-resilience.md) | Worker/queue tier, circuit breakers, retries, degradation | P3,A2,A3 |
| [`06-observability.md`](06-observability.md) | Metrics, logs, traces, SLOs, alerting | A1,A2,A3 |
| [`07-scaling-path.md`](07-scaling-path.md) | Concrete triggers & steps for 10×/100× growth | S1 |
| [`08-roadmap.md`](08-roadmap.md) | Phased, prioritized, reversible execution plan | all |
| [`09-adr/`](09-adr/) | Architecture Decision Records (one file per decision) | all |
| [`10-tooling-and-stack.md`](10-tooling-and-stack.md) | Professional tooling: tests, CI/CD, monitoring, perf budgets, caching/queue libs | all |

---

## 4. Design principles (apply everywhere)

1. **Keep the request path short.** Anything slow or external (judges, LLM, email,
   heavy aggregation) goes to the **async tier**, never inline in a user request. (P3)
2. **One door to data.** Routes/components/actions never touch Supabase directly —
   only the **DAL** (`services/data/*`). This is the seam for caching, routing,
   replicas, and future data-tier changes. (M2)
3. **Degrade, don't fail.** A dependency being down removes a *section*, not the
   *page*. Non-critical data is best-effort. (A2)
4. **Stateless app tier.** No in-process state that matters across requests; shared
   state lives in the cache/data tier so the app scales horizontally. (S1)
5. **Simple until measured.** Add infrastructure only when an NFR is missed with
   evidence. Every **[headroom]** item is deferred until its trigger fires
   ([`07-scaling-path.md`](07-scaling-path.md)). (all)
6. **Decisions are recorded.** Non-obvious choices get an ADR
   ([`09-adr/`](09-adr/)) so future-you knows *why*, not just *what*.
