# ADR 0002 — Async/worker tier for slow & external work

- **Status:** Accepted
- **Date:** 2026-07-03
- **Context docs:** [`../05-async-and-resilience.md`](../05-async-and-resilience.md)

## Context

Slow/external work (20 judge integrations, LLM, Google sync, leaderboard
recompute) currently runs on the request or cron path. A slow/failed dependency
raises user-facing latency and can cascade. `vercel.json` crons is empty while
cron route code exists, so scheduling/retry/visibility are unclear.

## Decision

Introduce an **async worker tier**: a queue + **idempotent, retried,
dead-lettered** workers. All slow/external work is enqueued; user requests return
fast. Start with a **Postgres-backed queue** (`jobs` table / pg-boss / Supabase
Queues) — no new infra — and graduate to a managed queue only when volume/fan-out
triggers it.

## Rationale

- Removes external-dependency latency and failure from the request path (P3, A2).
- Idempotency + retry + dead-letter make background work durable and visible (A3).
- Postgres-backed queue fits current scale with zero added infrastructure; the
  worker interface is unchanged when the backend is later swapped.

## Consequences

- (+) User latency decoupled from judges/LLM/Google; failures isolated.
- (+) Jobs are observable and recoverable; cron silent-failure trap (R2) fixed.
- (−) Introduces eventual consistency for synced data (must design optimistic/stale
  UI) and requires idempotency discipline.
- **Revisit backend when:** job throughput or fan-out outgrows a DB-backed queue →
  managed queue + dedicated workers ([`../07-scaling-path.md`](../07-scaling-path.md)).

## Alternatives considered

- **Keep synchronous** — rejected (the core availability/latency problem).
- **Managed queue from day one** — deferred (infra ahead of need; DB queue suffices
  now and the interface hides the choice).
