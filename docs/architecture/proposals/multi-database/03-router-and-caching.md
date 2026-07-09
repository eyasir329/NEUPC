# App-Layer Database Router ("Load Balancer") & Caching

You asked for a **load balancer** for the databases. For databases the correct
form is an **app-layer router**: a single module that decides, per query,
**which provider** and **which node (primary vs replica)** the query goes to.
It is not a web/HTTP load balancer, and it cannot merge Supabase + InsForge into
one logical database — nothing can. With only two projects and no clustering,
its job is much simpler than a multi-cluster router: pick a provider, pick a
node, cache.

---

## Responsibilities of the router

1. **Provider selection + failover.** Normal state: route everything to
   Supabase. If Supabase is unhealthy, **fail over to InsForge** (see failover
   logic below).
2. **Read/write splitting.** `SELECT`s that can tolerate replica lag → Supabase
   replica (once provisioned). Writes and read-your-write cases → Supabase
   primary.
3. **Connection pooling.** One pooled client per provider (use each provider's
   PgBouncer/Supavisor pooler URL — serverless functions exhaust direct
   connections fast).
4. **Cache-aside.** Check cache before hitting the DB for cacheable reads;
   populate on miss; invalidate on write.
5. **Graceful degradation.** If both providers are down, fail requests clearly
   rather than hanging; cached reads still serve stale-but-available data.

---

## Shape of the router (illustrative, not final code)

```text
lib/db/
  clients.ts        // pooled clients: Supabase primary (+ replica), InsForge standby
  health.ts         // provider health; drives failover
  router.ts         // pick provider -> node; read/write split; degrade
  cache.ts          // cache-aside wrapper (Upstash Redis + DB *_cache fallback)
```

```ts
// clients.ts — one provider pair for the whole schema
export const DB = {
  supabase: sb.primary,
  supabaseReplica: sb.replica, // optional, added in a later phase
  insforge: ins.standby,
} as const;
```

```ts
// router.ts (sketch) — provider (failover) -> node
function pick(mode: "read" | "write") {
  // 1. provider selection: Supabase primary unless it's unhealthy
  if (health.isUp("supabase")) {
    if (mode === "read" && DB.supabaseReplica && !needsFreshRead())
      return DB.supabaseReplica;                    // 2. read -> Supabase replica
    return DB.supabase;                             //    else Supabase primary
  }

  // 2b. FAILOVER: Supabase down -> InsForge standby
  //     reads: serve immediately. writes: only after standby is PROMOTED.
  if (mode === "write" && !health.isPromoted("insforge"))
    throw new WriteUnavailable();                   // fail fast
  return DB.insforge;
}
```

> Full failover semantics (promotion, write handling, failback) live in
> [`06-sync-and-failover.md`](06-sync-and-failover.md).

---

## Read / write splitting rules

| Case | Route to |
|---|---|
| Any write | Supabase **primary** |
| Public/heavy read (member pages, leaderboards) | Supabase **replica** (once provisioned) |
| Read immediately after a write (read-your-write) | Supabase **primary** (avoid lag) |
| Everything else | Supabase **primary** |

---

## Caching layer

Two tiers, cache-aside pattern:

### Tier A — Edge/shared cache (Redis, e.g. Upstash)
- **What:** hot, cross-request reads — leaderboards, public member profiles,
  problem lists, event lists, resolved `user_id → {name, avatar}` lookups.
- **Why it matters most:** it removes ~80–90% of read load from the database,
  which is what actually delivers your **performance** goal and shields
  availability.
- **Invalidation:** on write to the owning table, the router deletes the
  affected keys (write-through invalidation). Use short TTLs (30–300s) as a
  safety net.

### Tier B — DB-backed cache (your existing tables)
- You already have `api_cache`, `leaderboard_cache`, `sync_checkpoints` — keep
  them as the durable, queryable cache for expensive aggregates (things too big
  or too structured for Redis). They live in the same Supabase project as
  everything else and are mirrored to InsForge like any other table.

---

## What the router does NOT do

- ❌ It does **not** give you cross-provider transactions. InsForge is a
  standby, never written to in the same request as Supabase.
- ❌ It does **not** merge Supabase and InsForge into one logical DB. InsForge is
  reached only on failover — never queried alongside Supabase in the same
  request (that would risk stale/split reads). See
  [`06-sync-and-failover.md`](06-sync-and-failover.md).
