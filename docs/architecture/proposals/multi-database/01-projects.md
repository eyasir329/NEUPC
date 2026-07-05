# Projects & Providers

**Topology: 8 projects = 4 logical clusters × 2 providers.**
The 4 clusters are cut from the FK graph (see
[`02-clustering-map.md`](02-clustering-map.md)). Each cluster exists **twice**:
the **Supabase** copy is the **primary** (source of truth, serves live traffic),
the **InsForge** copy is a **warm standby** kept in sync one-way and used for
**failover**.

```
 CLUSTER      PRIMARY (Supabase)        STANDBY (InsForge)      sync
 ─────────    ──────────────────        ──────────────────     ───────────────
 CORE         Supabase-CORE      ──────► InsForge-CORE          Supabase → InsForge
 LEARN        Supabase-LEARN     ──────► InsForge-LEARN         (one-way, continuous)
 ANALYTICS    Supabase-ANALYTICS ──────► InsForge-ANALYTICS
 CONTENT      Supabase-CONTENT   ──────► InsForge-CONTENT

 Live traffic ───► Supabase copies.
 On a Supabase cluster outage, the router fails that ONE cluster over to its
 InsForge twin (reads immediately; writes once promoted). Other clusters
 stay on Supabase.
```

> **Why one-way (Supabase → InsForge), not dual-write:** for a failover standby
> the copy must be a *faithful* mirror. Dual-writing from the app risks
> half-succeeded writes (Supabase ok, InsForge fails) that silently diverge — the
> standby would be subtly wrong exactly when you need it. One-way streaming
> replication keeps the twin correct and the app writes to **one** place.
> Full detail in [`06-sync-and-failover.md`](06-sync-and-failover.md).

---

## The 4 clusters (each is one primary + one standby)

### CORE  🟥 critical
- **Primary:** Supabase-CORE. **Standby:** InsForge-CORE.
- Identity + auth + RBAC + the relational hub (`users` referenced by ~100 tables).
- Auth/RLS is Supabase-native → on failover to InsForge, **authz must be enforced
  by the router** (InsForge has no Supabase Auth). See
  [`04-tradeoffs.md`](04-tradeoffs.md) §5 and
  [`06-sync-and-failover.md`](06-sync-and-failover.md).
- Highest availability: PITR + backups on the Supabase primary; standby verified
  regularly.

### LEARN  🟧 important
- **Primary:** Supabase-LEARN. **Standby:** InsForge-LEARN.
- Bootcamp / course / discussion context (Cluster 0, 22 tables).

### ANALYTICS  🟩 non-critical, write-heavy
- **Primary:** Supabase-ANALYTICS. **Standby:** InsForge-ANALYTICS.
- Logs, `*_stats`, `sync_*`, DB-backed cache. Append-heavy.
- Because it's non-critical, failover here can be **read-only / best-effort** —
  losing recent telemetry on failover is acceptable.

### CONTENT  🟩 non-critical
- **Primary:** Supabase-CONTENT. **Standby:** InsForge-CONTENT.
- Events, resources, blog, chat, todos, faq, committee (loosely coupled).
- ⚠️ If `chat_*` uses Supabase Realtime, the InsForge twin can't replicate
  Realtime semantics — failover chat would be degraded (history only, no live).

---

## Which tables live in each cluster

Unchanged from the single-provider design — the **same clustering map applies to
both providers**, since the InsForge copy is table-for-table identical to its
Supabase primary. See [`02-clustering-map.md`](02-clustering-map.md).

The migration/DDL for a cluster is therefore run **twice**: once on the Supabase
project, once on its InsForge twin, from the **same migration files**
(see [`05-migration-plan.md`](05-migration-plan.md)).

---

## Provider capability note (now blocking, not optional)

Because InsForge must run an **exact copy** of every cluster, its Postgres feature
set must match what the schema uses — otherwise the standby can't be built.

| Capability | Supabase (primary) | InsForge (standby) — must verify |
|---|---|---|
| Postgres version + extensions | ✅ | ⚠️ must match enough to restore the schema |
| Logical replication **inbound** (to receive Supabase changes) | n/a | ⚠️ **critical** — is InsForge a writable Postgres that can subscribe/ingest? |
| Auth + RLS on `auth.uid()` | ✅ native | ❌ not available → router enforces authz on failover |
| Realtime (chat) | ✅ | ⚠️ likely not replicable |
| Connection pooler | ✅ Supavisor | ⚠️ verify |

> **Blocking action item:** confirm InsForge exposes a **standard Postgres you can
> replicate INTO** (logical replication subscriber, or a CDC sink target). If
> InsForge does **not** allow inbound logical replication, the sync mechanism must
> fall back to CDC-via-app or scheduled dump/restore — see
> [`06-sync-and-failover.md`](06-sync-and-failover.md) for the decision tree.
