# ADR 0003 — Strict layering: one door to data, one door to external I/O

- **Status:** Accepted
- **Date:** 2026-07-03
- **Context docs:** [`../02-architecture.md`](../02-architecture.md)

## Context

The app already has a data-access layer (`services/data/*`) and isolated
integration adapters (`integrations/*`, `problem-solving-services/*`). But with
77 API routes and 52 action files, some may access Supabase or external services
directly, eroding the seam that caching, replica routing, and future data-tier
changes depend on.

## Decision

Enforce, in CI:

1. **Only the DAL** (`services/data/*`) imports `integrations/supabase`.
2. **Only services** import integration adapters (`integrations/*`,
   `problem-solving-services/*`).
3. Dependencies point **downward only**; route handlers and actions stay **thin**.

Enforcement via an ESLint boundary rule (`import/no-restricted-paths` or
`eslint-plugin-boundaries`) or, minimally, a CI grep.

## Rationale

- The DAL must be the single place to add cache-aside, select primary/replica, and
  later swap/partition/extract the data tier without touching callers (M2, S1).
- Adapter isolation is where circuit breakers/timeouts/bulkheads live; business
  code must depend on the interface, not raw `fetch` (A2).
- Machine-enforced boundaries stop erosion over time far more reliably than
  convention (M1).

## Consequences

- (+) Every cross-cutting concern (cache, resilience, routing, observability) has
  exactly one home.
- (+) Changes are localized and testable; the whole scaling ladder stays reversible.
- (−) Requires fixing existing violations (sized in Phase 0) and adding the CI rule.

## Alternatives considered

- **Convention only** — rejected (erodes silently; the seams are load-bearing for
  the redesign).
