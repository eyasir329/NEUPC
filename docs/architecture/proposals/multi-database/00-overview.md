# Multi-Database Architecture — Overview

> **Status:** Design proposal. Nothing here is wired up yet.
> **Goal (as requested):** improve **performance** and **availability** by
> mirroring the database across two providers (Supabase + InsForge), with an
> **app-layer database router** ("load balancer") and a **caching layer**.
> **Scale today:** ~95 users, ~2,275 submissions, ~10 MB of data.

---

## TL;DR — What this design actually does

We do **NOT** shard rows and we do **NOT** split the schema into clusters.
The **entire schema lives in one place per provider**: one **Supabase** project
(primary, live) and one **InsForge** project (warm standby) that is an exact,
table-for-table copy of it.

**2 projects total.**

| Provider | Role | Contains |
|---|---|---|
| **Supabase** | Primary (live traffic) | The whole schema — all 110 tables |
| **InsForge** | Warm standby (failover only) | Identical copy of the whole schema |

The InsForge project is a **full copy** of the Supabase primary, kept current by
**one-way sync (Supabase → InsForge)**. The app writes only to Supabase;
InsForge serves reads on failover and takes writes only after explicit
**promotion**. See [`06-sync-and-failover.md`](06-sync-and-failover.md).

An **app-layer router** in the Next.js app decides, per query:
**provider (Supabase, or InsForge on failover) → node**, with read→replica /
write→primary splitting on Supabase.
A **cache layer** (Redis/Upstash + your existing `*_cache` tables) absorbs the
hot reads so the database stays idle-cheap and available.

---

## The one rule that governs everything

**There is only one schema, and it exists twice — once per provider, never split.**

1. All 110 tables stay together, on Supabase, exactly as they are today. No FK,
   JOIN, or transaction ever needs to cross a boundary, because there is no
   boundary within the schema — only between the two providers.
2. The InsForge copy is not queried in parallel with Supabase. It exists solely
   to take over if Supabase goes down.
3. Writes always go to Supabase. InsForge only becomes writable after an
   explicit **promotion** step during an outage (see
   [`06-sync-and-failover.md`](06-sync-and-failover.md)).

See [`04-tradeoffs.md`](04-tradeoffs.md) for every consequence, honestly listed.

---

## Documents in this folder

| File | What it covers |
|---|---|
| [`00-overview.md`](00-overview.md) | This file — the big picture |
| [`01-projects.md`](01-projects.md) | The 2 projects, replica, providers, responsibilities |
| [`03-router-and-caching.md`](03-router-and-caching.md) | App-layer DB router ("load balancer") + cache design |
| [`04-tradeoffs.md`](04-tradeoffs.md) | Lost cross-provider guarantees, availability math — eyes open |
| [`05-migration-plan.md`](05-migration-plan.md) | Phased rollout, reversible, measure-first |
| [`06-sync-and-failover.md`](06-sync-and-failover.md) | Supabase→InsForge sync, failover, split-brain, failback |

---

## Guiding principles

1. **Measure before adding a standby.** Optimize the single Supabase DB first.
   ([`05-migration-plan.md`](05-migration-plan.md) Phase 0.)
2. **Availability comes from the standby + cache, not from splitting data.**
   A single, whole-database standby gives an availability *gain* — see
   [`04-tradeoffs.md`](04-tradeoffs.md).
3. **The router is the single choke point.** All DB access goes through it, so
   provider selection and failover logic live in exactly one place.
