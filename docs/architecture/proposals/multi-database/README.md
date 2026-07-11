# Architecture — Multi-Database Design

Design docs for running the app's database on **two providers**: **Supabase as
the primary** (all live traffic) and **InsForge as a full warm standby** — a
single, exact schema-for-schema, table-for-table mirror of the whole database,
not split or clustered. Goal: **availability** via failover, with a caching
layer for **performance**.

> Derived from the real schema: 110 tables, 179 FK edges, ~95 users / ~10 MB.

## Read in order

1. **[00-overview.md](00-overview.md)** — the big picture & the one governing rule
2. **[01-projects.md](01-projects.md)** — the 2 projects (Supabase primary, InsForge standby)
3. **[03-router-and-caching.md](03-router-and-caching.md)** — the DB router ("load balancer") + cache
4. **[04-tradeoffs.md](04-tradeoffs.md)** — lost cross-provider transactions, availability math
5. **[05-migration-plan.md](05-migration-plan.md)** — phased, reversible rollout (start at Phase 0)
6. **[06-sync-and-failover.md](06-sync-and-failover.md)** — Supabase→InsForge sync, failover, split-brain

## One-paragraph summary

Run the **entire schema** on **Supabase** (primary, live) with a single
**InsForge** project as a **full warm standby** — a table-for-table copy of the
whole database, kept current by **one-way sync (Supabase → InsForge)**. There is
no clustering and no per-table routing: every table lives in exactly one place
on each provider, and the two copies are identical. An **app-layer router**
picks the provider (Supabase normally, InsForge only on **failover**), and a
**Redis** cache absorbs hot reads so the databases stay idle-cheap and
available. Writes fail over to InsForge only after explicit **promotion**
(split-brain safety). Start with Phase 0–2 (measure, index, pool, cache) on
Supabase alone; add the InsForge standby (later phases) only once that's stable.
