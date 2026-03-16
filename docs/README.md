# Documentation

Complete developer documentation for the NEUPC Platform.

---

## 🚀 Start Here

| Doc | Description |
|---|---|
| [Getting Started](getting-started/index.md) | Local dev setup, database init, Google OAuth config |
| [Environment Variables](getting-started/environment-variables.md) | Full env var reference with setup instructions |
| [Architecture Overview](architecture/index.md) | Core patterns, data flow, key conventions |
| [Contributing Guide](CONTRIBUTING.md) | Branching, commits, code style, PR process |

---

## 📐 Architecture

| Doc | Description |
|---|---|
| [Architecture Overview](architecture/index.md) | Folder structure, 6 core patterns, data flow diagram |
| [Project Structure](architecture/project-structure.md) | Detailed file tree walkthrough of every directory |
| [Component Library](architecture/components.md) | Catalog of all 80+ React components by category |
| [Server Actions](architecture/server-actions.md) | All 30+ server action files with every exported function |
| [Data Service](architecture/data-service.md) | All 262 `data-service.js` functions grouped by domain |
| [API Routes](architecture/api-routes.md) | All 19 REST API endpoints with auth, payloads, responses |

---

## 🔐 Auth & Security

| Doc | Description |
|---|---|
| [Authentication](auth/authentication.md) | Google OAuth flow, JWT session shape, route guards |
| [Security](security/index.md) | 4-layer defense model, rate limiting, CSP headers |

---

## 🎯 Product

| Doc | Description |
|---|---|
| [Features](product/features.md) | Every feature module — Blog, Events, Chat, Mentorship, etc. |
| [Roles & Pages](product/roles-and-pages.md) | All 6 roles with every protected page path |
| [Sitemap](product/sitemap.md) | Complete route inventory (public + authenticated) |

---

## 🗄️ Database

| Doc | Description |
|---|---|
| [Database Overview](database/index.md) | 45+ tables, RLS policies, entity relationships |
| [Schema SQL](database/schema.sql) | Raw SQL — paste into Supabase SQL Editor to initialize |

---

## 🎨 Frontend

| Doc | Description |
|---|---|
| [Design System](frontend/design-system.md) | Color tokens, typography, animations, CSS utilities |

---

## 🚢 Deployment

| Doc | Description |
|---|---|
| [Deployment Guide](deployment/index.md) | Vercel deploy, CI/CD, monitoring, scaling |
| [Troubleshooting](troubleshooting.md) | Common issues and fixes |

---

## 📖 Guides

| Doc | Description |
|---|---|
| [Adding a New Feature](guides/adding-new-feature.md) | Step-by-step: schema → data-service → actions → pages |
| [Event Registration](guides/event-registration.md) | Deep implementation walkthrough with code |

---

## 📋 Reference

| Doc | Description |
|---|---|
| [Full Engineering Doc](overview/engineering-documentation.md) | End-to-end engineering overview (1,000+ lines) |
| [Hardcoded Content Audit](audits/hardcoded-content.md) | Audit of hardcoded content in the codebase |

---

## Legacy

| Doc | Description |
|---|---|
| [Legacy Documentation](legacy/website-documentation.md) | Older archived documentation |

---

## Backwards-Compatible Paths

Several historical `docs/*.md` files still exist as small "moved" stubs so older links don't break.
