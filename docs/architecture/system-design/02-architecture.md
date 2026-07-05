# 02 — Target Architecture

The target architecture keeps the current stack but sharpens the boundaries and
adds the async tier. Four tiers, strict layering, one door to data.

---

## The four tiers

### Tier 1 — Edge / CDN  (performance & first-line availability)
- Static assets & media: long-lived `immutable` cache (already done for images).
- Cacheable dynamic routes: served from Vercel's edge/Data Cache; a DB blip
  doesn't take down cached public pages.
- Security headers, redirects, and cheap auth gating at the edge where possible.

### Tier 2 — App tier  (stateless, horizontally scalable)
Next.js App Router, three entry types with distinct roles:

| Entry | Role | Rule |
|---|---|---|
| **Server Components** | render read views | read via services/DAL only; cache-friendly |
| **Server Actions** | mutations | validate → authz → DAL write → invalidate cache |
| **Route Handlers (`app/api`)** | integrations, webhooks, cron entry, machine APIs | thin; delegate to services |

The app tier holds **no cross-request state**. Rate-limit counters, sessions,
hot lookups → cache tier (not in-process `Map`s). This is what makes horizontal
scaling and failover clean. (S1)

### Tier 3 — Data tier
Supabase Postgres **primary + read replica**, fronted by the DAL and the shared
cache. RLS remains the authz backbone. Full decision (single-vs-multi-DB,
pooling, indexing) in [`03-data-tier.md`](03-data-tier.md).

### Tier 4 — Async / worker tier
Everything slow, external, or bursty runs here, off the request path: judge sync,
LLM calls, email/notifications, leaderboard recompute, Google syncs. Queue +
idempotent workers + circuit breakers. Full design in
[`05-async-and-resilience.md`](05-async-and-resilience.md).

---

## Layering rules (enforceable, this is maintainability)

```text
  Components / Pages
        │  may call ↓            (never import integrations or supabase directly)
  Server Actions / Route Handlers
        │  may call ↓            (thin: validate, authz, orchestrate)
  Application / Domain services   (app/_lib/services/*)
        │  may call ↓            (business logic; compose DAL + integrations)
  ┌─────┴───────────────┐
  Data Access Layer      External Integration Adapters
  (services/data/*)      (integrations/*, problem-solving-services/*)
        │                        │
   Supabase (DB)           Judges / Google / LLM
```

**Invariants (M1, M2):**
1. **Only the DAL touches Supabase.** No `createClient` / raw queries in
   pages, components, actions, or route handlers. (Fixes R7.)
2. **Only adapters touch external services.** Business code depends on an adapter
   interface, not on `fetch` to a judge.
3. **Dependencies point downward only.** A lower layer never imports an upper one.
4. **Route handlers & actions are thin.** No business logic inline — delegate to a
   service. Keeps logic testable and reusable across entry types.

> **How to enforce:** an ESLint boundary rule (or a simple CI grep) that forbids
> importing `integrations/supabase` outside `services/data/`, and forbids
> importing `integrations/*` outside `services/`. Cheap, and it keeps the seams
> from eroding over time. See [`08-roadmap.md`](08-roadmap.md) Phase 1.

---

## Bounded contexts (already present — formalize them)

The folder structure already reflects these. Treating them as explicit contexts
gives blast-radius isolation (A2) and clean scaling seams (S1):

| Context | Owns | Criticality |
|---|---|---|
| **Identity & Access** | users, auth, roles, permissions, profiles | 🟥 critical |
| **Problem-Solving** | judges sync, submissions, stats, leaderboard | 🟧 heavy I/O |
| **Learning** | bootcamps, courses, lessons, tasks, discussions | 🟧 important |
| **Community** | events, contests, gallery, committee, achievements | 🟩 |
| **Content** | resources, blog, roadmaps, notices, faq | 🟩 read-heavy |
| **Messaging** | chat, notifications | 🟩 |

Each context: its own DAL files, its own cache keyspace, its own degrade behavior.
This is the unit of isolation and, if ever needed, the unit of extraction
([`07-scaling-path.md`](07-scaling-path.md)).

---

## Request lifecycle (the golden path)

```text
Read (page):
  client → edge (cache hit? serve) → server component → service → DAL
         → cache-aside (hit? return) → replica → render → cache

Write (action):
  client → server action → validate(zod) → authz(RLS + app check)
         → service → DAL write (primary, transaction) → invalidate cache keys
         → revalidatePath/Tag → return

Slow/external work:
  request → enqueue job → return fast (202/optimistic)
          → worker picks up → adapter (circuit breaker) → DAL write
          → invalidate cache → (optional) notify
```

The redesign's whole performance/availability thesis is in that third path:
**the user request never waits on a judge, an LLM, or an email.**
