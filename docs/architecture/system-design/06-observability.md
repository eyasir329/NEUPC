# 06 — Observability & SLOs

You can't defend performance/availability you can't see. Today failures are found
by users (R8). This tier makes the NFRs measurable and alertable. NFRs: A1–A3.

---

## The three signals

| Signal | Captures | Tooling (fits stack) |
|---|---|---|
| **Metrics** | latency (p50/p95/p99), error rate, throughput, cache hit ratio, queue depth, job outcomes, DB connections | Vercel Analytics + Supabase metrics; PostHog for product; optional Prometheus **[headroom]** |
| **Logs** | structured request/job logs with correlation id, context, outcome | Vercel logs / a log sink; JSON, not `console.log` strings |
| **Traces** | request → service → DAL → external call spans | OpenTelemetry **[headroom]**; start with span-like structured logs |

Start lightweight (metrics + structured logs + correlation ids); add tracing when
a real latency mystery justifies it.

---

## What to instrument (mapped to NFRs)

- **Per route/action:** duration, status, which context, cache hit/miss. → P1, P2
- **Per external call (adapter):** dependency name, duration, outcome, breaker
  state. → A2 (this is how you *see* a judge degrading before users do)
- **Per job:** enqueue→start latency, run duration, outcome, retries, dead-letters.
  → A3
- **Data tier:** connection count, replica lag, slow queries. → P2, A1
- **Cache:** hit ratio per keyspace (a falling ratio predicts DB load). → P2

Every request/job carries a **correlation id** end-to-end so a user report maps to
exact logs across tiers.

---

## SLOs (the contract; alerts derive from these)

| SLO | Target | Alert when |
|---|---|---|
| Public page availability | 99.9% | error budget burn > 2%/hr |
| Cached page TTFB | < 200 ms p95 | p95 > 400 ms for 10 min |
| DB-path action latency | < 300 ms p95 | p95 > 600 ms for 10 min |
| Job success rate | > 99% | any dead-letter, or success < 95%/hr |
| Cache hit ratio (hot keys) | > 80% | < 60% for 15 min |
| Replica lag | < 5 s | > 30 s |
| External breaker | closed | any breaker open > 5 min |

Alerts route to one channel; each alert links to a **runbook**
([`08-roadmap.md`](08-roadmap.md) tracks writing them). An alert with no runbook is
just noise.

---

## Health & readiness

- `app/api/health` already exists (`no-store`) — extend to a **readiness** check:
  primary reachable, replica reachable, Redis reachable, queue drainable. Return
  per-dependency status so degradation is visible, not binary.
- A simple **status view** (internal) showing per-context + per-dependency health
  turns "is it down?" into a glance. (A2)

---

## First dashboard (build this in Phase 0/1)

One board, five tiles: **request p95**, **error rate**, **cache hit ratio**,
**queue depth / job outcomes**, **DB connections + replica lag**. That's enough to
run the redesign by evidence and to prove the NFRs are met.
