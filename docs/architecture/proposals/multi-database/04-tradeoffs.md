# Tradeoffs — Read This Before Building

This design is **safe** because the cut-lines follow the FK graph. But splitting
one database into four across two providers still has real costs. Listed here
honestly so the decision is made with eyes open.

---

## 1. You lose cross-cluster foreign keys

~100 tables FK to `users`. Every table that leaves CORE loses **database-enforced**
referential integrity to `users`.

- **Consequence:** an orphaned `user_id` (pointing at a deleted user) will no
  longer be blocked by the database.
- **Mitigation:** the router validates on write; run a periodic reconciliation
  job that scans non-CORE `user_id`s against CORE and flags orphans.

## 2. You lose cross-cluster JOINs

"Show these blog posts with author names" was one indexed JOIN. Now it's:
fetch posts from CONTENT → collect `user_id`s → `resolveUsers()` from cache/CORE
→ merge. More code, more round-trips.

- **Mitigation:** the `resolve-user` cache (see
  [`03-router-and-caching.md`](03-router-and-caching.md)) makes this cheap, but it
  is still more moving parts than a JOIN.

## 3. You lose cross-cluster transactions

You **cannot** wrap a write to CONTENT and a write to CORE in one atomic
transaction. Partial failure = inconsistent state.

- **Mitigation:** the clustering guarantees **no core write transaction spans a
  cut**. If a future feature needs atomicity across projects, either keep those
  tables together, or accept eventual consistency with an outbox + retry.

## 4. Availability math — and how the InsForge standby fixes it

Two forces pull in opposite directions here.

**Force 1 — splitting *lowers* availability.** If a request needs data from N
independent databases each at 99.9% uptime, its availability is `0.999^N`:

| DBs on the request path | Availability | Downtime/year |
|---|---|---|
| 1 | 99.90% | ~8.8 h |
| 2 | 99.80% | ~17.5 h |
| 4 | 99.60% | ~35 h |

**Force 2 — the InsForge standby *raises* it back up.** A cluster is available if
**either** provider is up. Two independent 99.9% providers in parallel give
`1 - (0.001 × 0.001) = 99.9999%` *for that cluster* — **provided failover
actually works**. That last clause is the whole ballgame:

- Read failover is automatic → reads approach the parallel (high) number.
- **Write failover requires promotion** (§ below and
  [`06-sync-and-failover.md`](06-sync-and-failover.md)). Until an operator/runbook
  promotes InsForge, **writes to a downed critical cluster fail.** So write
  availability is only as good as your promotion speed, not the theoretical
  99.9999%.

**Net:** the standby turns the `0.999^N` liability into a genuine availability
*gain* for reads, and a bounded-by-promotion-time gain for writes — but **only if
the failover/promotion path is tested**. An untested standby adds cost and
complexity while delivering none of the availability. See the rehearsal checklist
in [`06-sync-and-failover.md`](06-sync-and-failover.md).

Non-critical clusters (ANALYTICS/CONTENT) also stay off the critical path: if both
their providers are down, the router degrades gracefully.

## 5. RLS / auth is Supabase-specific

Your security model is Postgres RLS on `auth.uid()`. InsForge projects
(ANALYTICS/CONTENT) won't have Supabase Auth.

- **Consequence:** access control for InsForge tables must be enforced in the
  **app/router**, not the database. That's a security-sensitive shift — a bug in
  the router now bypasses authz that RLS used to guarantee.
- **Mitigation:** centralize authz checks in the router; the only path to InsForge
  data is through it. Never expose InsForge directly to the client.

## 6. Operational surface grows 4×

Four projects = 4 dashboards, 4 backup policies, 4 migration pipelines, 4 sets of
credentials/secrets, 4 monitoring targets, cross-provider version skew.

- **Mitigation:** see [`05-migration-plan.md`](05-migration-plan.md) — one shared
  migrations folder per project, one secrets convention, one monitoring board.

## 7. Two providers = two failure modes & two SQL dialects

Supabase and InsForge may differ in extensions, Postgres version, Realtime,
connection pooler behavior, and pricing. Something that works on Supabase may not
on InsForge.

- **Action item:** verify InsForge's Postgres feature parity **before** moving
  any table (see [`01-projects.md`](01-projects.md) provider table).

---

## Honest bottom line

At **95 users / 10 MB**, none of the above is *required* by load — a single
Supabase project with indexes + pooling + a replica + Redis would outperform this
4-project split and be far simpler to operate. This design is worth building if
your real goals are (a) **blast-radius isolation** of the write-heavy/telemetry
subsystems, (b) **independent scaling/cost** per context, or (c) a deliberate
system-design investment for anticipated growth. If the goal is purely
"faster + more available today," do [`05-migration-plan.md`](05-migration-plan.md)
**Phase 0–2 only** and stop.
