# 04 — Caching Strategy

One coherent caching model across all layers. Today caching is real but scattered
and partly in-process (R3) or in the primary DB (R5). NFRs: P1, P2.

---

## The cache layers (fastest → most durable)

| Layer | Where | Good for | TTL | Shared? |
|---|---|---|---|---|
| **CDN / Edge** | Vercel edge | static assets, media, cacheable public pages | long / immutable | yes (global) |
| **Next.js Data Cache** | framework | rendered routes & `fetch`/`unstable_cache` results | per-route + tags | per-region |
| **Shared cache (Redis)** | Upstash | hot cross-request reads, `resolve-user`, rate-limit, sessions, external-API responses | 30s–1h | **yes** |
| **DB-backed cache** | Postgres `*_cache` | large/structured aggregates too big for Redis | minutes–hours | yes |

**Change from today:** introduce **Redis** as the shared tier, move external-API
caching from `api_cache` (in the primary) into Redis, and retire in-process `Map`
caches for anything that must be consistent across instances.

---

## Cache-aside pattern (the default)

```text
read(key):
  v = cache.get(key);         if hit → return v
  v = dal.query(...);         // replica
  cache.set(key, v, ttl);     return v

write(entity):
  dal.write(...);             // primary, transactional
  cache.invalidate(keysFor(entity));   // targeted
  revalidateTag(tagFor(entity));       // Next.js Data Cache
```

- **Invalidate on write, TTL as a safety net.** Targeted key invalidation on
  mutation; short TTLs catch anything missed.
- **Namespace keys by context** (`ps:leaderboard:*`, `identity:user:*`,
  `content:blog:*`) so a context can be flushed independently (A2).

---

## What to cache (by context)

| Data | Layer | Key / tag | Invalidate on |
|---|---|---|---|
| Public member pages | Data Cache + Redis | `identity:user:{id}` | profile/role change |
| `resolve-user` (id → name/avatar/handle) | Redis | `identity:user:{id}` | profile update |
| Leaderboards | Redis + DB `leaderboard_cache` | `ps:leaderboard:{scope}` | leaderboard recompute job |
| Problem/tag/judge lookups | Redis | `ps:problem:*` | sync job |
| External judge API responses | Redis (was `api_cache`) | `ext:{judge}:{q}` | TTL only |
| Public content (blog, resources, events) | CDN + Data Cache | tag `content`, `events` | publish/edit |
| Rate-limit counters | Redis | `rl:{ip|user}:{route}` | TTL (sliding) |

---

## The `resolve-user` cache (cross-cutting)

`users` is referenced everywhere. Any list (blog, discussions, events) needs
author/user display data. Solve it once:

- `resolveUsers(ids[])` → batch-fetch missing ids from the primary, cache
  `{id → {name, avatar, handle}}` in Redis with a long TTL, invalidate on profile
  update. Every list becomes: fetch rows (replica) + `resolveUsers()` (cache) —
  near-zero repeated user lookups. (P2)

This helper is also exactly what a future data-tier split would need, so building
it now is not throwaway.

---

## Rules

1. **Never cache authz decisions across users.** Cache data, gate per-request.
2. **Cache keys are owned by the DAL**, so invalidation lives next to the write.
3. **In-process caches only for immutable, request-scoped data** (e.g. a config
   loaded once). Anything cross-request/cross-instance → Redis. (Fixes R3.)
4. **Cacheability is a per-context decision**, recorded in the table above and
   kept current as contexts change.
