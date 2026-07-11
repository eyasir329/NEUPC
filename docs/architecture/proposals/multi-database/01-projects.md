# Projects & Providers

**Topology: 2 projects total — one Supabase, one InsForge.** There is no
clustering: the whole schema (110 tables) lives on both, identically. The
**Supabase** project is the **primary** (source of truth, serves live traffic),
the **InsForge** project is a **warm standby** kept in sync one-way and used
only for **failover**.

```
              PRIMARY (Supabase)              STANDBY (InsForge)      sync
              ──────────────────              ──────────────────     ───────────────
 Whole schema  Supabase (all 110 tables) ────► InsForge (all 110 tables)  Supabase → InsForge
                                                                            (one-way, continuous)

 Live traffic ───► Supabase.
 On a Supabase outage, the router fails the app over to the InsForge twin
 (reads immediately; writes once promoted).
```

> **Why one-way (Supabase → InsForge), not dual-write:** for a failover standby
> the copy must be a *faithful* mirror. Dual-writing from the app risks
> half-succeeded writes (Supabase ok, InsForge fails) that silently diverge — the
> standby would be subtly wrong exactly when you need it. One-way streaming
> replication keeps the twin correct and the app writes to **one** place.
> Full detail in [`06-sync-and-failover.md`](06-sync-and-failover.md).

---

## The two projects

### Supabase — primary 🟥 critical
- Runs the entire schema: identity + auth + RBAC + learn content + analytics +
  general content — all 110 tables, unchanged from today.
- Optionally gets a **read replica** for heavy public reads (leaderboards,
  member pages) once Phase 0–2 metrics justify it.
- Highest availability: PITR + backups on the Supabase primary.

### InsForge — standby 🟧 failover only
- A **table-for-table copy** of the entire Supabase schema, kept current via
  one-way sync.
- Auth/RLS is Supabase-native → on failover to InsForge, **authz must be
  enforced by the router** (InsForge has no Supabase Auth). See
  [`04-tradeoffs.md`](04-tradeoffs.md) §5 and
  [`06-sync-and-failover.md`](06-sync-and-failover.md).
- ⚠️ If `chat_*` uses Supabase Realtime, the InsForge twin can't replicate
  Realtime semantics — failover chat would be degraded (history only, no live).
- Never queried directly by the client; only reached through the router, and
  only on failover.

---

## Which tables live where

All of them, on both. The migration/DDL is run **twice** — once on the Supabase
project, once on the InsForge project — from the **same migration files** (see
[`05-migration-plan.md`](05-migration-plan.md)). There is no per-table
assignment to maintain.

---

## Provider capability note (now blocking, not optional)

Because InsForge must run an **exact copy** of the whole schema, its Postgres
feature set must match what the schema uses — otherwise the standby can't be
built.

| Capability | Supabase (primary) | InsForge (standby) — must verify |
|---|---|---|
| Postgres version + extensions | ✅ | ⚠️ must match enough to restore the schema |
| Logical replication **inbound** (to receive Supabase changes) | n/a | ⚠️ **critical** — is InsForge a writable Postgres that can subscribe/ingest? |
| Auth + RLS on `auth.uid()` | ✅ native | ❌ not available → router enforces authz on failover |
| Realtime (chat) | ✅ | ⚠️ likely not replicable |
| Connection pooler | ✅ Supavisor | ⚠️ verify |

> **Blocking action item:** confirm InsForge exposes a **standard Postgres you
> can replicate INTO** (logical replication subscriber, or a CDC sink target).
> If InsForge does **not** allow inbound logical replication, the sync
> mechanism must fall back to CDC-via-app or scheduled dump/restore — see
> [`06-sync-and-failover.md`](06-sync-and-failover.md) for the decision tree.
