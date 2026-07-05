# Infra Handoff — steps only you can do

The redesign is being implemented **code-first**: everything that is code, I do in
the repo. The steps below need your dashboards / accounts / production access, so
they're handed to you with exact instructions. Do them in phase order.

Legend: ⬜ not started · ✅ done · ⏳ waiting on you

---

## Phase 0 — Measure

### ⬜ 0.1 Run the baseline SQL
- **Where:** Supabase Dashboard → SQL Editor (or `psql` against the project).
- **What:** run [`../../../scripts/db/phase0-baseline.sql`](../../../scripts/db/phase0-baseline.sql).
- **Best practice:** let the app run under normal use for ~a day first, so
  `pg_stat_statements` (section 3) reflects real traffic.
- **Deliver back to me:** the output of sections 3 (top queries) and 5 (unindexed
  FKs — should now be mostly covered once you apply migration 1.1). I'll use
  section 3 to add any *composite* indexes beyond the FK indexes.

---

## Phase 1 — Foundation

### ⬜ 1.1 Apply the FK-index migration
- **File:** `supabase/migrations/20260703120000_add_missing_fk_indexes.sql` (83
  indexes, already in the repo).
- **Option A (CLI):** `supabase db push` (applies pending migrations).
- **Option B (manual):** open the file, paste into Supabase SQL Editor, run.
- **Important:** the statements use `CREATE INDEX CONCURRENTLY` — they must **not**
  run inside a `BEGIN/COMMIT` block. The SQL Editor and `db push` run statements
  individually, so this is fine. If you wrap them in a transaction manually, drop
  `CONCURRENTLY`.
- **Verify:** re-run section 5 of the baseline SQL — the unindexed-FK list should
  shrink to ~0. Spot-check one hot query with `EXPLAIN (ANALYZE)` — a former
  `Seq Scan` should become an `Index Scan`.
- **Risk:** very low. `IF NOT EXISTS` makes it idempotent; `CONCURRENTLY` avoids
  table locks. Indexes cost a little write overhead + disk — negligible at your
  size, worth it for the read speedup.

### ✅ 1.2 Connection pooling — NO ACTION NEEDED (yet)
- Phase-0 finding: the app talks to Supabase over **HTTP (PostgREST)** via
  `@supabase/supabase-js`, **not** a direct Postgres TCP connection. The
  serverless "connection exhaustion" cliff does **not** apply to this usage.
- **Only revisit** if you later add a direct DB driver (e.g. `postgres`, Drizzle,
  Prisma). Then: use Supabase's **Supavisor pooler** URL (port `6543`, transaction
  mode) — not the direct `5432` URL. Documented here so it's not forgotten.

### ⏳ 1.3 Read replica (availability + read scaling)
- **Where:** Supabase Dashboard → Database → Read Replicas (requires a paid plan).
- **What:** provision one read replica in your primary region.
- **Then tell me:** the replica connection details / that it exists — I'll add the
  **replica routing seam** in the DAL (reads → replica, writes → primary). Until
  then the DAL is coded to route everything to the primary, so this is
  non-blocking.
- **Note:** optional at 95 users. Its real value is HA reads; add when uptime
  matters or read load grows. (NFR A1)

---

## Phase 2 — Caching

### ✅ 2.1 Provision Upstash Redis — DONE
- Database created (`proud-sparrow-84907.upstash.io`); `UPSTASH_REDIS_REST_URL`
  and `UPSTASH_REDIS_REST_TOKEN` set in `.env.local`.
- **Verified end-to-end:** raw Redis ops (set/get/mget/pipeline/del) confirmed
  against the live instance; `resolveUsers()` proven to hit Postgres on a cold
  call and **zero** DB calls on a warm call (instrumented test, not assumed).
  Along the way, fixed a real pre-existing bug: `resolveUsers()` selected a
  `username` column that doesn't exist on `users` (it lives on
  `member_profiles`, and `users`↔`member_profiles` has two FK paths, so the
  Supabase embed needed disambiguating to `member_profiles!member_profiles_user_id_fkey`).
- **Still needed:** set the same two env vars in **Vercel** production env.

---

## Phase 3 — Async / resilience (when we get there)

### ⏳ 3.1 Fix cron scheduling (R2 — possible silent failure NOW)
- **Finding:** `vercel.json` has `"crons": []` but 3 cron routes exist and check
  `CRON_SECRET`. **Your scheduled jobs may not be running.**
- **Action — confirm which is true:**
  - If an **external scheduler** (cron-job.org, GitHub Actions, etc.) hits these
    routes → confirm it's alive and passing `CRON_SECRET`.
  - If **nothing** triggers them → add Vercel Cron entries (I'll provide the
    `vercel.json` block in Phase 3) or wire the external scheduler.
- **Priority:** worth checking **now**, independent of the redesign — if these
  jobs (leaderboard update, submission fetch, daily tasks) aren't firing, data is
  silently going stale.

---

## Phase 4 — Observability (when we get there)

### ⏳ 4.1 Create a Sentry project
- **Where:** [sentry.io](https://sentry.io) → new project → Next.js.
- **Then set:** `SENTRY_DSN` (+ auth token for source-map upload) in Vercel.
- I'll wire `@sentry/nextjs` + the instrumentation and keep it inert until the DSN
  exists.

---

## Security quick-wins (independent of phases — do anytime)

These came out of the earlier professionalism audit; small and worth doing:

- ⬜ **Delete/gate `app/api/test-clist/route.js`** — unauthenticated + uses
  `supabaseAdmin` (service role, bypasses RLS). Highest-risk endpoint in the repo.
- ⬜ **Add `CRON_SECRET` check to `renew-drive-watch`** — the one cron route
  missing the auth guard the other three have.
- ⬜ **`npm audit fix`** — 25 known vulnerabilities in deps.
