# ADR 0001 — Data tier: single primary + replica + cache (defer multi-DB split)

- **Status:** Accepted
- **Date:** 2026-07-03
- **Context docs:** [`../03-data-tier.md`](../03-data-tier.md), [`../07-scaling-path.md`](../07-scaling-path.md)

## Context

An 8-project (2 providers × 4 clusters) multi-DB + failover design was previously
drafted ([`../../proposals/multi-database/README.md`](../../proposals/multi-database/README.md)). The whole-app redesign was asked to
reconsider it. Current scale: ~95 users, ~10 MB, heavily relational schema with
`users` referenced by ~100 tables and RLS-based authz. Goals: performance,
availability, maintainability, scalability headroom.

## Decision

Adopt a **single Supabase primary + read replica + Redis shared cache** as the
data tier. **Defer** the multi-DB split; keep it as the last rung of the scaling
ladder, gated by a measured write-throughput trigger.

## Rationale

- Cross-cluster splits break in-DB JOINs, cross-cluster transactions, and
  FK/RLS enforcement — regressing performance and integrity to solve a
  **write-scale** problem that does not exist at this scale.
- Availability math: `0.999^N` across clusters *reduces* availability unless
  failover is fully built and tested; a replica delivers HA reads with far less
  surface.
- A replica + cache + (later) partitioning covers 10×–100× growth from 95 users.
- The DAL seam means the split can still be adopted later with no app rewrite.

## Consequences

- (+) Simplicity, integrity, lower latency, one auth model (RLS), one migration path.
- (+) Clear, reversible scaling ladder ([`../07-scaling-path.md`](../07-scaling-path.md)).
- (−) A single primary handles all writes — acceptable now; revisit at the trigger.
- **Reopen when:** primary **write** throughput is the proven ceiling (not read
  latency, which the replica/cache handle). Then reconsider functional split →
  then the multi-DB design.

## Alternatives considered

- **8-project multi-DB + InsForge failover** — rejected now (over-engineered for
  scale; integrity/latency cost). Retained as a future option.
- **Single DB, no replica** — rejected (no read-HA; single point of failure for
  reads).
