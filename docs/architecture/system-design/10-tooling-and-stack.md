# 10 — Tooling & Tech Stack (professional, performance-driven)

The feature stack is strong (Next.js, Supabase, react-hook-form, zod, tiptap,
recharts, framer-motion). What's missing is the **engineering tooling** that makes
a codebase professional and keeps it fast: tests, CI/CD, error monitoring, git
hooks, performance budgets, a shared cache/queue. This doc lists what to add,
**why**, and in what order — tiered so nothing is adopted before it earns its place.

> **Audit of what exists (2026-07-03):** 78 deps, TypeScript configured but the app
> is JS (`jsconfig.json`), ESLint + Prettier present, `.github/` exists **but no
> workflows**, **no test runner**, **no error monitoring**, **no git hooks**,
> `zod` present but used in only ~2 files, rate-limiting via in-process `Map`.

---

## Tier 1 — Essential (a professional project has these)

These close correctness/reliability gaps and are low-risk, high-leverage. Map to
NFRs M1 (change safety), A1–A3 (reliability), P1–P2 (performance).

| Tool | Fills gap | Why this one |
|---|---|---|
| **Vitest** + **@testing-library/react** | no unit/component tests | Vite-native, fast, Jest-compatible API; test services, DAL, utils, components |
| **Playwright** | no end-to-end tests | reliable cross-browser E2E; smoke-test critical flows (login, submit, enroll) |
| **GitHub Actions CI** | `.github/` empty | gate every PR: lint + typecheck + test + build; the single biggest quality lever |
| **Husky** + **lint-staged** | no pre-commit checks | run lint/format/typecheck on changed files before commit — errors caught locally, not in CI |
| **Sentry** (`@sentry/nextjs`) | no error monitoring (R8) | capture runtime errors + performance traces in prod; ties directly to [`06-observability.md`](06-observability.md) |
| **Zod everywhere** (already a dep) | validation in ~2 files only | validate **every** server-action input + external API response + `.env`. One schema, reused client+server |

### The CI pipeline (Tier 1 backbone)

```text
PR opened ─► GitHub Actions:
   1. install (cached)
   2. lint            (eslint, incl. layering boundary rule — ADR 0003)
   3. typecheck       (tsc --noEmit)
   4. test            (vitest run + coverage)
   5. build           (next build)
   6. e2e (smoke)     (playwright, critical paths)
   └─► all green → mergeable
```

This one addition (CI) is what most separates a hobby repo from a professional one.

---

## Tier 2 — Performance-driven (the "performance" mandate)

Directly serve P1/P2 and make performance **measurable and enforced**, not hoped for.

| Tool | Purpose | Notes |
|---|---|---|
| **@upstash/redis** | shared cache tier | the Redis from [`04-caching.md`](04-caching.md); serverless-native, HTTP-based |
| **@upstash/ratelimit** | distributed rate limiting | replaces in-process `Map` rate-limiter (R3); correct across serverless instances |
| **@vercel/og** / Next Image | image performance | you already cache images immutably; ensure `next/image` + modern formats everywhere |
| **@next/bundle-analyzer** | bundle budgets | you already have an `analyze` script — wire it to fail CI on regressions |
| **Lighthouse CI** (`@lhci/cli`) | perf budgets in CI | assert TTFB/LCP/CLS budgets per PR so pages can't silently get slower (P1) |
| **Vercel Speed Insights** + **Web Vitals** | real-user perf (RUM) | field data, not just lab; feeds the SLO dashboard ([`06-observability.md`](06-observability.md)) |
| **pg-boss** *(or Supabase Queues)* | async/worker tier | the queue from [`05-async-and-resilience.md`](05-async-and-resilience.md); Postgres-backed, no new infra |

### Performance budgets (enforce, don't hope)

```text
Bundle:   route JS  < 200 KB gz   (bundle-analyzer + size-limit gate)
LCP:      < 2.5 s   p75           (Lighthouse CI + Speed Insights)
TTFB:     < 200 ms  p95 (cached)  (Speed Insights → SLO)
CLS:      < 0.1                    (Lighthouse CI)
```

Budgets that fail CI are the only budgets that hold.

---

## Tier 3 — Maintainability & DX (professional polish)

Raise code quality and contributor velocity (M1). Adopt as the team/codebase grows.

| Tool | Purpose |
|---|---|
| **TypeScript migration** | app is JS with TS configured — migrate incrementally (`allowJs`, rename hot files first: DAL, services, actions). Biggest long-term maintainability win |
| **eslint-plugin-boundaries** | machine-enforce the layering rules (ADR 0003) — DAL-only DB access, adapter-only external I/O |
| **Commitlint + Conventional Commits** | consistent history; enables automated changelogs/releases |
| **Renovate** or **Dependabot** | automated, batched dependency updates + security patches |
| **Knip** / **ts-prune** | find dead code and unused deps (78 deps is a lot — prune safely) |
| **Storybook** *(optional)* | isolate/document the `_components/ui` library; visual review |

---

## Tier 4 — [headroom] Adopt only when a trigger fires

Do **not** add these preemptively (see [`07-scaling-path.md`](07-scaling-path.md)).

| Tool | Adopt when |
|---|---|
| **OpenTelemetry** tracing | a latency mystery spans multiple tiers and logs aren't enough |
| **Managed queue** (QStash/SQS) + workers | job volume/fan-out outgrows pg-boss |
| **Turborepo / pnpm workspaces** | the app splits into packages or a context is extracted |
| **Feature-flag service** (Flagsmith/PostHog flags) | you need runtime flags / gradual rollouts / kill-switches |
| **CDN image service** (Cloudinary/imgix) | image transformation load justifies offloading |
| **k6 / Artillery** load testing | before a launch or a scale step, to validate capacity |

---

## Recommended `package.json` scripts (professional baseline)

```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:cov": "vitest run --coverage",
    "analyze": "ANALYZE=true next build",
    "lhci": "lhci autorun",
    "check": "npm run lint && npm run typecheck && npm run test",  // pre-push gate
    "prepare": "husky"
  }
}
```

---

## Adoption order (map to the roadmap)

| Add in | Tools | Roadmap phase |
|---|---|---|
| First | Vitest, Testing Library, GitHub Actions CI, Husky+lint-staged, Zod-everywhere | Phase 0–1 ([`08-roadmap.md`](08-roadmap.md)) |
| With caching | @upstash/redis, @upstash/ratelimit | Phase 2 |
| With async tier | pg-boss / Supabase Queues | Phase 3 |
| With observability | Sentry, Speed Insights, Lighthouse CI, bundle budgets | Phase 4 |
| Ongoing | TS migration, boundaries plugin, Renovate, commitlint, Knip | continuous |
| Later | Tier 4 | on trigger |

## Guardrails (so this doesn't become tool sprawl)

1. **Every tool maps to an NFR or a named gap** — no tool for its own sake (CLAUDE.md §2).
2. **A tool that isn't wired into CI is decoration** — tests/budgets/lints must gate PRs to matter.
3. **Prefer stack-native** (Vercel/Supabase/Upstash) over new infra at this scale.
4. **Tier 4 stays unbuilt** until [`07-scaling-path.md`](07-scaling-path.md) triggers fire.
