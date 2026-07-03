# 05 — Async / Worker Tier & Resilience

This is the **highest-impact** part of the redesign. Today, slow/external work
(20 judges, LLM, Google, leaderboard recompute) runs on the request or cron path
(R1, R2), so one slow dependency degrades user-facing latency and can cascade.
NFRs: P3, A2, A3.

---

## Principle: nothing slow on the request path

```text
BEFORE:  user request ──► sync judge fetch (5–30s, may fail) ──► response  ❌
AFTER:   user request ──► enqueue job ──► fast response (202/optimistic)   ✅
                                   │
                          worker ──► adapter(circuit breaker, retry) ──► DAL
                                   └──► invalidate cache / notify
```

---

## The worker tier

A queue + idempotent workers. Concrete options (pick per ADR
[`09-adr/0002-async-tier.md`](09-adr/0002-async-tier.md)):

- **Lightweight (recommended start):** a `jobs` table in Postgres as the queue +
  a Vercel Cron that drains it, or **Supabase Queues / pg-boss**. No new infra,
  fits current scale.
- **[headroom]:** a managed queue (Upstash QStash / SQS) + dedicated workers when
  job volume or fan-out grows.

### What moves to the worker tier

| Work | Trigger | Idempotency key |
|---|---|---|
| Judge submission sync (per user/judge) | schedule + on-demand | `(user_id, judge, cursor)` |
| Leaderboard recompute | schedule + after sync | `leaderboard:{scope}:{window}` |
| LLM calls (editorials, tags, text-gen) | on-demand (enqueue) | request hash |
| Email / notifications | on event | `(event_id, channel)` |
| Google Calendar / Drive sync | schedule + webhook | resource id + version |

### Job requirements (A3)

1. **Idempotent** — safe to run twice (dedupe on the key). Serverless retries and
   at-least-once queues make this mandatory.
2. **Retried with backoff** — transient failures retry; permanent failures go to a
   **dead-letter** state with an alert, not silent loss.
3. **Bounded** — per-judge concurrency limits so one integration can't starve the
   pool.
4. **Observable** — each job emits start/end/outcome + duration
   ([`06-observability.md`](06-observability.md)).

> **Fix R2 first:** the 3 existing cron routes must have a **known, monitored
> trigger** (Vercel Cron entries or an external scheduler) and be **idempotent**.
> An empty `vercel.json` crons array with live cron code is a silent-failure trap.

---

## Resilience patterns (per external dependency)

Every adapter in `integrations/*` and `problem-solving-services/*` gets:

### Circuit breaker
Track failures per dependency; after N failures **open** the circuit → fail fast
(serve cached/stale, skip the call) for a cooldown, then **half-open** to probe.
Stops a dead judge from consuming workers and timing out requests. (A2)

### Timeouts + retries
- Hard timeout on every external call (no unbounded `fetch`).
- Retry only **idempotent** reads, with exponential backoff + jitter.

### Bulkheads
Per-dependency concurrency caps (a "bulkhead") so judge X's slowness can't consume
all worker capacity and take down judge Y's sync. (A2)

### Graceful degradation (the app-tier contract)
- A context whose data is unavailable renders **empty/stale with a notice**, not an
  error page. Non-critical sections are best-effort.
- Example: leaderboard stale → show last cached value + "updated N min ago".
  Judge down → that judge's stats omitted, rest of the page fine. (A2)

---

## Failure-mode matrix (design the degradation explicitly)

| Dependency down | User-visible effect (target) | Mechanism |
|---|---|---|
| One judge | that judge's data stale/omitted; sync retries later | breaker + degrade |
| All judges | problem-solving stats stale; rest of app normal | breaker + cache |
| LLM | AI features queued/disabled; core unaffected | enqueue + feature flag |
| Google | calendar/drive features degrade; core unaffected | breaker + degrade |
| Redis | fall back to DB/Data Cache (slower, still works) | cache optional-by-design |
| Read replica | reads go to primary (higher load, still works) | DAL fallback |
| Primary DB | writes fail fast; cached reads still serve public pages | edge/Data Cache + PITR |

> Designing this matrix **is** the availability work. Availability isn't "nothing
> ever fails" — it's "when X fails, only X degrades."
