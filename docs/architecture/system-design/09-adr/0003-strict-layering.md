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

## Phase-0 audit result (2026-07-03) — the invariant is currently violated

The audit found the "DAL is the only door" invariant is **aspirational, not
enforced**: **133 files** import the Supabase client (`supabaseAdmin` /
`integrations/supabase`) and run queries directly, outside `services/data/`:

| Area | Files |
|---|---|
| API routes (`app/api/**`) | 50 |
| Server actions (`app/_lib/actions/**`) | 44 |
| Non-DAL services (`app/_lib/services/**`) | 30 |
| Other `_lib` | 5 |
| Pages / components | 4 |

**Consequence for rollout:** a hard `error`-level boundary rule cannot be turned
on today — it would fail every build. The professional path is a **ratchet**:

1. Ship the boundary rule at **`warn`** severity (stops *new* violations; existing
   133 keep building).
2. Migrate violations into the DAL **incrementally**, area by area, each change
   independently testable.
3. Flip the rule to **`error`** per-directory as each area reaches zero
   (`app/api/**` first, then actions, then services), until it's global.

This makes the invariant real without a big-bang refactor. Tracked as ongoing
work in [`../08-roadmap.md`](../08-roadmap.md) Phase 1.
