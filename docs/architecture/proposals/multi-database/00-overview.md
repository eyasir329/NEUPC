# Multi-Database Architecture — Overview

> **Status:** Design proposal. Nothing here is wired up yet.
> **Goal (as requested):** improve **performance** and **availability** by spreading
> data across multiple database projects (Supabase + InsForge), with an
> **app-layer database router** ("load balancer") and a **caching layer**.
> **Scale today:** ~95 users, ~2,275 submissions, ~10 MB of data.

---

## TL;DR — What this design actually does

We do **NOT** shard rows and we do **NOT** split the tightly-coupled core.
Instead we split the schema along its **natural bounded contexts** (derived from
the real foreign-key graph, see [`02-clustering-map.md`](02-clustering-map.md))
into **4 logical clusters**, and run each cluster on **two providers**: a
**Supabase primary** (live) and an **InsForge warm standby** (failover).

**8 projects = 4 clusters × 2 providers.**

| Cluster | Supabase (primary, live) | InsForge (standby, failover) | Contains |
|---|---|---|---|
| **CORE** | Supabase-CORE (+ read replica) | InsForge-CORE | `users`, roles/permissions, profiles, the relational hub |
| **LEARN** | Supabase-LEARN | InsForge-LEARN | courses, lessons, bootcamps, discussions |
| **ANALYTICS** | Supabase-ANALYTICS | InsForge-ANALYTICS | activity_logs, *_stats, sync_jobs, api_cache |
| **CONTENT** | Supabase-CONTENT | InsForge-CONTENT | events, resources, blog, chat, todos |

Each InsForge project is a **table-for-table copy** of its Supabase primary, kept
current by **one-way sync (Supabase → InsForge)**. The app writes only to
Supabase; InsForge serves reads on failover and takes writes only after explicit
**promotion**. See [`06-sync-and-failover.md`](06-sync-and-failover.md).

An **app-layer router** in the Next.js app decides, per query:
**table → cluster → provider (Supabase, or InsForge on failover) → node**,
with read→replica / write→primary splitting.
A **cache layer** (Redis/Upstash + your existing `*_cache` tables) absorbs the
hot reads so the databases stay idle-cheap and available.

---

## The one rule that governs everything

**Foreign keys, JOINs, and transactions cannot cross a database server boundary.**

Your `users` table is referenced by ~100 other tables. Therefore:

1. `users` + auth + RBAC **must stay together** on CORE. They are the hub.
2. A table can only move to another project if it is **loosely coupled** to the
   core — i.e. its only real link is `user_id`, which we handle by **denormalizing
   the user_id** and resolving user details from CORE (or from cache), *not* by a
   database JOIN.
3. Any query that would have JOINed across the cut becomes an
   **application-side join** (fetch from project A, fetch from project B, merge in
   code). This is acceptable **only** for the loosely-coupled contexts we chose.

See [`04-tradeoffs.md`](04-tradeoffs.md) for every consequence, honestly listed.

---

## Documents in this folder

| File | What it covers |
|---|---|
| [`00-overview.md`](00-overview.md) | This file — the big picture |
| [`01-projects.md`](01-projects.md) | The 4 projects + replica, providers, responsibilities |
| [`02-clustering-map.md`](02-clustering-map.md) | Every table → which project, **derived from the FK graph** |
| [`03-router-and-caching.md`](03-router-and-caching.md) | App-layer DB router ("load balancer") + cache design |
| [`04-tradeoffs.md`](04-tradeoffs.md) | Broken FKs, lost transactions, availability math — eyes open |
| [`05-migration-plan.md`](05-migration-plan.md) | Phased rollout, reversible, measure-first |
| [`06-sync-and-failover.md`](06-sync-and-failover.md) | Supabase→InsForge sync, per-cluster failover, split-brain, failback |

---

## Guiding principles

1. **Measure before moving.** No table leaves CORE until metrics prove it needs to.
   ([`05-migration-plan.md`](05-migration-plan.md) Phase 0.)
2. **Availability comes from the replica + cache, not from more servers.**
   More independent servers on a critical path *lowers* availability
   (`0.999⁴ ≈ 99.6%`). See [`04-tradeoffs.md`](04-tradeoffs.md).
3. **Only loosely-coupled contexts move off CORE.** The cut-lines are chosen so
   that **no core write transaction** spans two projects.
4. **The router is the single choke point.** All DB access goes through it, so the
   table→project map lives in exactly one place and is easy to change.
