# NEUPC Documentation

Developer documentation for the NEUPC platform. Organized by intent — start with
**Getting Started**, reach for **Reference** when you need a lookup, read
**Architecture** to understand *why* the system is shaped the way it is.

```text
docs/
├── getting-started/   → set up and run the project locally
├── architecture/      → how the system is built + the forward-looking redesign
│   ├── system-design/ → whole-app redesign (performance, availability, tooling)
│   └── proposals/     → forward-looking designs not yet adopted
├── reference/         → API routes, database schema (information lookups)
├── features/          → per-feature deep dives
├── operations/        → runbooks for recurring operational tasks
└── diagrams/          → source .drawio diagrams
```

---

## 1. Getting Started

New to the project? Do these in order.

| # | Document | What you'll do |
|---|---|---|
| 1 | [Setup Guide](getting-started/index.md) | Clone, install, configure, run locally, deploy to Vercel |
| 2 | [Environment Variables](getting-started/environment-variables.md) | Every env var: what it's for, where to get it, security notes |
| 3 | [Local Supabase](getting-started/local-supabase.md) | Run the full database stack locally with Docker |

## 2. Architecture

How the system works today, and where it's going.

| Document | Read it for |
|---|---|
| [Architecture Overview](architecture/README.md) | Core patterns, security model, data flow — **read this first** |
| [Project Structure](architecture/project-structure.md) | Full file tree with explanations |
| [Data Service](architecture/data-service.md) | The centralized data-access layer (`data-service.js`) |
| [Server Actions](architecture/server-actions.md) | Mutation layer — auth, validation, sanitization patterns |
| [Components](architecture/components.md) | Shared component conventions and catalog |
| [**Whole-App System Design**](architecture/system-design/README.md) | The redesign for performance, availability, maintainability, scalability — **direction of travel** |
| [Multi-Database Proposal](architecture/proposals/multi-database/README.md) | Deferred future option (see system-design ADR 0001) |

## 3. Reference

Look things up.

| Document | Contents |
|---|---|
| [API Routes](reference/api-routes.md) | REST API endpoint reference |
| [Database Schema](reference/database-schema.md) | Table catalogue, RLS policies, relationships, useful SQL |

## 4. Features

Per-feature technical deep dives.

| Document | Feature |
|---|---|
| [Features Overview](features/README.md) | Every feature, the roles that access it, the actions that power it |
| [Homepage Deep Dive](features/homepage-root-page.md) | Root page technical breakdown with diagrams |
| [Bootcamps](features/bootcamps.md) | Bootcamp system architecture |
| [Bootcamp Panels](features/bootcamps-panels.md) | Role-specific bootcamp panels |
| [Bootcamp Security](features/bootcamps-security.md) | Bootcamp access control & security model |
| [Daily Activity](features/daily-activity.md) | Activity tracking system |

## 5. Operations

Runbooks for recurring operational tasks.

| Document | Task |
|---|---|
| [Google Drive Token Refresh](operations/google-drive-token-refresh.md) | Rotating/refreshing the Drive refresh token |

## 6. Diagrams

Source `.drawio` files (open in [draw.io](https://app.diagrams.net/)) live in
[`diagrams/`](diagrams/) — homepage runtime/DFD/ER/sequence diagrams and the
problem-solving ER + data-flow diagrams.

---

## Related

| Location | What |
|---|---|
| [Browser Extension README](../browser-extension/README.md) | Chrome/Firefox extension: install, 41+ platforms, architecture |
| [Supabase config](../supabase/README.md) | Local Supabase stack configuration |
