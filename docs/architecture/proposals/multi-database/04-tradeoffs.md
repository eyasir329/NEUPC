# Tradeoffs — Read This Before Building

This design is **simpler** than a clustered split: the schema never moves, it's
just mirrored to a second provider. But adding a second provider still has real
costs. Listed here honestly so the decision is made with eyes open.

---

## 1. The standby can drift from the primary

InsForge is only as good as the sync. If sync lags or breaks silently, the
standby is stale exactly when you need it.

- **Consequence:** a failover during a sync outage serves old data (reads) or
  is unusable for writes until re-synced.
- **Mitigation:** monitor replication lag as a first-class metric; alert on it.
  See [`06-sync-and-failover.md`](06-sync-and-failover.md).

## 2. You can't do cross-provider transactions

You **cannot** wrap a write that touches Supabase and a write that touches
InsForge in one atomic transaction — but you never need to, because all writes
always go to Supabase. The only place this matters is failover: **once
InsForge is promoted, Supabase (if it comes back) is the one that's now stale**
and must be reconciled, not the other way around.

- **Mitigation:** the split-brain rule — at most one provider is writable at a
  time (see [`06-sync-and-failover.md`](06-sync-and-failover.md)).

## 3. Availability math — and how the InsForge standby fixes it

Two forces pull in opposite directions here.

**Force 1 — a request that depends on the DB being up is bounded by that DB's
uptime.** At 99.9% uptime alone, that's ~8.8 h of downtime/year.

**Force 2 — the InsForge standby raises it back up.** The app is available if
**either** provider is up. Two independent 99.9% providers in parallel give
`1 - (0.001 × 0.001) = 99.9999%` — **provided failover actually works**. That
last clause is the whole ballgame:

- Read failover is automatic → reads approach the parallel (high) number.
- **Write failover requires promotion** (§ below and
  [`06-sync-and-failover.md`](06-sync-and-failover.md)). Until an
  operator/runbook promotes InsForge, **writes fail** when Supabase is down. So
  write availability is only as good as your promotion speed, not the
  theoretical 99.9999%.

**Net:** the standby turns a single-provider liability into a genuine
availability *gain* for reads, and a bounded-by-promotion-time gain for writes —
but **only if the failover/promotion path is tested**. An untested standby adds
cost and complexity while delivering none of the availability. See the
rehearsal checklist in [`06-sync-and-failover.md`](06-sync-and-failover.md).

## 4. RLS / auth is Supabase-specific

Your security model is Postgres RLS on `auth.uid()`. InsForge won't have
Supabase Auth.

- **Consequence:** access control on InsForge must be enforced in the
  **app/router**, not the database, for as long as the app is running against
  the promoted InsForge standby. That's a security-sensitive shift — a bug in
  the router now bypasses authz that RLS used to guarantee.
- **Mitigation:** centralize authz checks in the router; the only path to
  InsForge data is through it. Never expose InsForge directly to the client.

## 5. Operational surface grows 2×

Two projects = 2 dashboards, 2 backup policies, 2 migration runs per schema
change, 2 sets of credentials/secrets, 2 monitoring targets, cross-provider
version skew.

- **Mitigation:** see [`05-migration-plan.md`](05-migration-plan.md) — one
  shared migrations folder applied to both projects, one secrets convention,
  one monitoring board.

## 6. Two providers = two failure modes & two SQL dialects

Supabase and InsForge may differ in extensions, Postgres version, Realtime,
connection pooler behavior, and pricing. Something that works on Supabase may
not on InsForge.

- **Action item:** verify InsForge's Postgres feature parity **before**
  standing up the standby (see [`01-projects.md`](01-projects.md) provider
  table).

---

## Honest bottom line

At **95 users / 10 MB**, the InsForge standby is not *required* by load — a
single well-indexed, pooled Supabase project with Redis in front of it would
already meet today's performance needs. This design is worth building if your
real goal is **availability during a Supabase outage** — i.e. you want the app
to survive Supabase being down, not just run faster. If the goal is purely
"faster today," do [`05-migration-plan.md`](05-migration-plan.md) **Phase 0–2
only** and stop; add the InsForge standby later when availability becomes the
priority.
