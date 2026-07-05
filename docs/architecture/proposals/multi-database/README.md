# Architecture — Multi-Database Design

Design docs for splitting the app's database into **4 logical clusters**, each
run on **two providers** (**Supabase primary + InsForge warm standby**), with an
**app-layer database router** and a **caching layer**, to improve **performance**
and **availability**. **8 projects = 4 clusters × 2 providers.**

> Derived from the real schema: 110 tables, 179 FK edges, ~95 users / ~10 MB.
> The clustering is computed from the foreign-key graph, not guessed.

## Read in order

1. **[00-overview.md](00-overview.md)** — the big picture & the one governing rule
2. **[01-projects.md](01-projects.md)** — the 4 clusters × 2 providers, replica, roles
3. **[02-clustering-map.md](02-clustering-map.md)** — every table → cluster (from FK graph)
4. **[03-router-and-caching.md](03-router-and-caching.md)** — the DB router ("load balancer") + cache
5. **[04-tradeoffs.md](04-tradeoffs.md)** — broken FKs, lost transactions, availability math
6. **[05-migration-plan.md](05-migration-plan.md)** — phased, reversible rollout (start at Phase 0)
7. **[06-sync-and-failover.md](06-sync-and-failover.md)** — Supabase→InsForge sync, failover, split-brain

## One-paragraph summary

Split the schema into 4 clusters along natural FK boundaries so **no core write
transaction ever spans two clusters**: **CORE** (`users` + auth + RBAC + hub, with
a read replica), **LEARN**, **ANALYTICS** (write-heavy telemetry/cache), and
**CONTENT**. Run each cluster on **Supabase** (primary, live) with an **InsForge**
**warm standby** kept current by **one-way sync (Supabase → InsForge)**. An
**app-layer router** maps each table to its cluster, picks the provider (Supabase,
or InsForge on **failover**), splits reads to the replica, resolves cross-cluster
"joins" from a **Redis** user cache, and **degrades gracefully** when a
non-critical cluster is down. Writes fail over to InsForge only after explicit
**promotion** (split-brain safety). Build the 4 Supabase clusters first
(Phases 3–5), then add the InsForge twins (Phase 6). Start with Phase 0–2
(measure, index, pool, replica, cache); go further only when metrics justify it.
