# NEUPC — Whole-App System Design

A proper system-design pass over the entire application, optimized for
**performance**, **availability/resilience**, **maintainability**, and
**scalability headroom**. It keeps the current stack (Next.js + Supabase + Vercel)
and evolves the architecture with clear tiers and boundaries — **not a rewrite**.

> Grounded in the real codebase: 117 pages, 77 API routes, 52 action files,
> 62 services (incl. a 25-file DAL), 20 judge integrations, 3 cron routes.
> Scale today: ~95 users / ~10 MB. Speculative items are marked **[headroom]**
> and gated by measured triggers.

## Read in order

| # | Doc | What it decides |
|---|---|---|
| 00 | [system-design.md](00-system-design.md) | NFRs, target architecture, principles — **start here** |
| 01 | [current-state.md](01-current-state.md) | As-is strengths, risks (R1–R9), verification tasks |
| 02 | [architecture.md](02-architecture.md) | Four tiers, strict layering, bounded contexts, request lifecycle |
| 03 | [data-tier.md](03-data-tier.md) | **Single primary + replica + cache** (defers the multi-DB split), pooling, indexing |
| 04 | [caching.md](04-caching.md) | Unified caching across CDN / Data Cache / Redis / DB |
| 05 | [async-and-resilience.md](05-async-and-resilience.md) | Worker/queue tier, circuit breakers, degradation — **highest availability impact** |
| 06 | [observability.md](06-observability.md) | Metrics, logs, traces, SLOs, alerting |
| 07 | [scaling-path.md](07-scaling-path.md) | Trigger-driven ladder to 10×–100× (multi-DB is the last rung) |
| 08 | [roadmap.md](08-roadmap.md) | Phased, reversible execution plan (start at Phase 0) |
| 09 | [09-adr/](09-adr/) | Architecture Decision Records (data tier, async tier, layering) |
| 10 | [tooling-and-stack.md](10-tooling-and-stack.md) | Tests, CI/CD, monitoring, caching/queue libs, perf budgets — tiered by need |

## One-paragraph summary

Keep the stack; sharpen it into **four independently-scalable, independently-failable
tiers** — edge/CDN, a stateless app tier, a data tier (**Supabase primary + read
replica + Redis**), and a new **async/worker tier** that moves all slow/external
work (judges, LLM, Google, leaderboards) off the request path. Enforce **strict
layering** (the DAL is the only door to data; adapters the only door to external
I/O) so caching, replica routing, resilience, and future data-tier changes each
have exactly one home. Make it **provable** with metrics/SLOs/alerts. The
8-project multi-DB/failover design is **deferred** to the bottom of a
trigger-driven scaling ladder — the replica + cache + async tier deliver the
performance and availability you want now, with far less risk. Execute in phases
(measure → foundation → cache → async/resilience → observability → headroom),
stopping when the goals are met.

## Relationship to the existing `../` docs

The multi-DB/failover docs in [`../proposals/multi-database/README.md`](../proposals/multi-database/README.md) are **not discarded** —
ADR [09-adr/0001-data-tier.md](09-adr/0001-data-tier.md) reclassifies them as a
**future option** at the end of [07-scaling-path.md](07-scaling-path.md), to be
reopened only if primary **write** throughput becomes the proven ceiling.
