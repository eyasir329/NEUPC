# 01 — Current State Assessment (as-is)

An honest read of what exists today, from the code. The redesign builds on the
strengths and targets the risks. No change is proposed here — this is the baseline.

---

## What's already good (keep it)

- **Clear layering exists.** pages → server actions / API routes → services →
  integrations. A dedicated **data-access layer** (`app/_lib/services/data/`,
  25 domain files) already centralizes most DB access. This is the single most
  valuable asset for the redesign — the seam is already there.
- **Bounded contexts are visible** in the folder structure (bootcamp, discussions,
  events, resources, members, problem-solving, chat). The domain is already
  decomposed.
- **Integrations are isolated** in `app/_lib/integrations/` (Supabase, Google
  suite, LLM, image-gen) and `problem-solving-services/` (20 judges behind an
  `aggregator`). External I/O is not scattered through the app.
- **Caching is present** (see [`04-caching.md`](04-caching.md)): `api_cache` /
  `leaderboard_cache` tables, Next.js Data Cache with `revalidatePath/Tag`, and
  HTTP cache headers on images/media.
- **Stateless-friendly:** runs on Vercel serverless; most state is in Postgres.

---

## Risks & hotspots (what the redesign targets)

| # | Finding | Impact | Addressed in |
|---|---|---|---|
| R1 | **External sync runs on the request/cron path.** 20 judges + LLM + Google called synchronously; a slow/broken judge stalls the caller. | Latency spikes, timeouts, cascading failures (P3, A2) | [`05-async-and-resilience.md`](05-async-and-resilience.md) |
| R2 | **`vercel.json` crons is empty `[]`** while 3 cron routes exist (`daily-tasks`, `fetch-submissions`, `update-leaderboard`). Scheduling is unclear/external. | Silent job failure; no retry/visibility (A3) | [`05-async-and-resilience.md`](05-async-and-resilience.md) |
| R3 | **In-process `Map` caches** (rate-limiter, scrapers) are per-instance, lost on cold start, not shared across serverless invocations. | Inconsistent behavior, ineffective at scale (P2, S1) | [`04-caching.md`](04-caching.md) |
| R4 | **No shared cache (no Redis).** Hot reads and cross-request state hit Postgres or die on cold start. | DB load, no distributed rate-limit/session cache (P2) | [`04-caching.md`](04-caching.md) |
| R5 | **DB-as-cache (`api_cache`)** puts external-API caching *inside* the primary DB. | Couples cache load to the primary; harder to isolate (P2, A1) | [`03-data-tier.md`](03-data-tier.md), [`04-caching.md`](04-caching.md) |
| R6 | **Single DB connection path**, likely direct (not pooler) from serverless. | Connection exhaustion under burst; a scaling cliff (P2, S1) | [`03-data-tier.md`](03-data-tier.md) |
| R7 | **Possible direct DB access outside the DAL** (77 API routes, 52 action files). Any bypass weakens the caching/routing seam. | Inconsistent caching/authz; harder to evolve data tier (M2) | [`02-architecture.md`](02-architecture.md) |
| R8 | **No stated observability/SLOs.** Failures are found by users, not alerts. | Slow incident response; can't prove NFRs (A1–A3) | [`06-observability.md`](06-observability.md) |
| R9 | **8-project multi-DB/failover design** was drafted for scale you don't have; adds operational surface and split-brain risk. | Over-engineering risk (all) | [`03-data-tier.md`](03-data-tier.md) reconsiders it |
| R10 | **`app/api/test-clist` is unauthenticated and uses `supabaseAdmin`** (service role bypasses RLS); live in prod. | Data exposure (security) | delete or gate (auth + non-prod only) — immediate |
| R11 | **`renew-drive-watch` cron has no `CRON_SECRET` check** (the other 3 cron routes do). | Anyone can trigger the job (security, A3) | add the same auth check — immediate |
| R12 | **17 npm vulnerabilities (6 high)** in prod dependencies; no automated updates. | Known-CVE exposure | `npm audit fix` now; Renovate/Dependabot ([`10-tooling-and-stack.md`](10-tooling-and-stack.md) Tier 3) |
| R13 | **0 of ~1,028 app files are TypeScript** despite TS being configured. | Type-safety gap (M1) | incremental migration, DAL/services first ([`10-tooling-and-stack.md`](10-tooling-and-stack.md) Tier 3) |

---

## Verification tasks (do before executing the redesign)

These confirm the assumptions above against runtime reality (measure-first):

- [ ] Grep for Supabase client usage **outside** `services/data/` to size R7
      (audit direct DB access from routes/actions/components).
- [ ] Confirm how the 3 cron routes are actually triggered (external scheduler?
      manual? not at all?) to size R2.
- [ ] Confirm whether the app uses Supabase's **pooler** URL or a direct
      connection (R6).
- [ ] Enable `pg_stat_statements`; capture the real slow/frequent queries and the
      current p95 latency + connection counts as the **baseline** the redesign is
      measured against.

> The redesign's Phase 0 ([`08-roadmap.md`](08-roadmap.md)) is exactly this
> measurement pass. Nothing structural is changed until the baseline exists.
