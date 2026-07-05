# App-Layer Database Router ("Load Balancer") & Caching

You asked for a **load balancer** for the databases. For databases the correct
form is an **app-layer router**: a single module that decides, per query, **which
project** and **which node (primary vs replica)** the query goes to. It is not a
web/HTTP load balancer, and it cannot merge Supabase + InsForge into one logical
database — nothing can. It routes; the app composes results.

---

## Responsibilities of the router

1. **Table → cluster routing.** One authoritative map: each table → its logical
   cluster (from [`02-clustering-map.md`](02-clustering-map.md)).
2. **Provider selection + failover.** Each cluster has a **Supabase primary** and
   an **InsForge standby**. Normal state: route to Supabase. If a cluster's
   Supabase side is unhealthy, **fail that one cluster over to InsForge**
   (see failover logic below).
3. **Read/write splitting.** `SELECT` on a CORE table with a replica → replica.
   Writes and read-your-write cases → primary.
5. **Connection pooling.** One pooled client per project (use each provider's
   PgBouncer/Supavisor pooler URL — serverless functions exhaust direct
   connections fast).
6. **Cache-aside.** Check cache before hitting a DB for cacheable reads; populate
   on miss; invalidate on write.
7. **App-side joins.** For a query that spans clusters, fetch each side and merge
   in code (with the user side served from cache whenever possible).
8. **Graceful degradation.** If a **non-critical** cluster (ANALYTICS/CONTENT) is
   down on **both** providers, the request still succeeds with that section
   empty/cached — availability by design.

---

## Shape of the router (illustrative, not final code)

```text
lib/db/
  clients.ts        // pooled clients: 2 per cluster (Supabase primary + InsForge standby)
  table-map.ts      // table -> cluster  (generated from clustering map)
  health.ts         // per-cluster/per-provider health; drives failover
  router.ts         // pick cluster -> provider -> node; read/write split; degrade
  cache.ts          // cache-aside wrapper (Upstash Redis + DB *_cache fallback)
  resolve-user.ts   // batch user lookups from CORE/cache for app-side joins
```

```ts
// table-map.ts (excerpt) — the single source of routing truth
export const TABLE_CLUSTER = {
  users: "CORE", user_roles: "CORE", roles: "CORE", /* ... */
  bootcamps: "LEARN", lessons: "LEARN", discussion_threads: "LEARN", /* ... */
  activity_logs: "ANALYTICS", sync_jobs: "ANALYTICS", api_cache: "ANALYTICS",
  events: "CONTENT", blog_posts: "CONTENT", resources: "CONTENT", /* ... */
} as const;

// clients.ts — each cluster resolves to a Supabase primary and InsForge standby
export const CLUSTERS = {
  CORE:      { supabase: sb.core,   supabaseReplica: sb.coreReplica, insforge: ins.core },
  LEARN:     { supabase: sb.learn,  insforge: ins.learn },
  ANALYTICS: { supabase: sb.stats,  insforge: ins.stats },
  CONTENT:   { supabase: sb.content,insforge: ins.content },
} as const;
```

```ts
// router.ts (sketch) — cluster -> provider (failover) -> node
function pick(table: string, mode: "read" | "write") {
  const cluster = TABLE_CLUSTER[table];              // 1. which cluster
  const c = CLUSTERS[cluster];

  // 2. provider selection: Supabase primary unless it's unhealthy
  if (health.isUp(cluster, "supabase")) {
    if (mode === "read" && c.supabaseReplica && !needsFreshRead())
      return c.supabaseReplica;                      // 3. read -> Supabase replica
    return c.supabase;                               //    else Supabase primary
  }

  // 3b. FAILOVER: Supabase down -> InsForge standby
  //     reads: serve immediately. writes: only after standby is PROMOTED.
  if (mode === "write" && !health.isPromoted(cluster, "insforge"))
    throw new ClusterWriteUnavailable(cluster);      // fail fast; queue if non-critical
  return c.insforge;
}
```

> Keep the map **generated** from [`02-clustering-map.md`](02-clustering-map.md)
> so the doc and the code never drift. Full failover semantics (promotion,
> write handling, failback) live in [`06-sync-and-failover.md`](06-sync-and-failover.md).

---

## Read / write splitting rules

| Case | Route to |
|---|---|
| Any write | owning project **primary** |
| Public/heavy read on CORE (member pages, leaderboards) | CORE **replica** |
| Read immediately after a write (read-your-write) | **primary** (avoid lag) |
| Read on LEARN/ANALYTICS/CONTENT | that project's primary (add replica later if needed) |

---

## Caching layer

Two tiers, cache-aside pattern:

### Tier A — Edge/shared cache (Redis, e.g. Upstash)
- **What:** hot, cross-request reads — leaderboards, public member profiles,
  problem lists, event lists, resolved `user_id → {name, avatar}` lookups.
- **Why it matters most:** it removes ~80–90% of read load from every DB, which
  is what actually delivers your **performance** goal and shields availability.
- **Invalidation:** on write to the owning table, the router deletes the affected
  keys (write-through invalidation). Use short TTLs (30–300s) as a safety net.

### Tier B — DB-backed cache (your existing tables)
- You already have `api_cache`, `leaderboard_cache`, `sync_checkpoints` — keep
  them on **ANALYTICS** as the durable, queryable cache for expensive aggregates
  (things too big or too structured for Redis).

### The `resolve-user` cache (makes app-side joins cheap)
Because JOINs can't cross projects, every cross-cluster list needs user details.
Solve it once: `resolveUsers(ids[])` batches missing IDs from CORE, caches
`{id → {name, avatar, handle}}` in Redis (long TTL, invalidated on profile
update). Cross-project "join" = fetch rows from CONTENT/LEARN, then
`resolveUsers()` from cache. Near-zero CORE load.

---

## What the router does NOT do

- ❌ It does **not** give you cross-cluster transactions. Writes that must be
  atomic **must** stay within one cluster (guaranteed by the clustering: no core
  write spans a cut).
- ❌ It does **not** enforce cross-cluster FKs. The app validates on write.
- ❌ It does **not** make the clusters look like 1 database to raw SQL. Queries
  that need data from two clusters are explicit app-side joins.
- ❌ It does **not** merge Supabase and InsForge into one logical DB. InsForge is
  a **standby copy** per cluster, reached only on failover — never queried
  alongside its Supabase twin in the same request (that would risk stale/split
  reads). See [`06-sync-and-failover.md`](06-sync-and-failover.md).
