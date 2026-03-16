# NEUPC — Netrokona University Programming Club

A full-stack club management platform for competitive programming communities — events, blog CMS, mentorship, discussions, contests, and a complete admin back-office for six user roles.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Auth.js](https://img.shields.io/badge/Auth.js-v5_beta-7C3AED)](https://authjs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 — App Router, Turbopack, React Server Components |
| Language | JavaScript (ES Modules + JSDoc) |
| Styling | Tailwind CSS v4, `@tailwindcss/forms`, `@tailwindcss/typography` |
| Database | Supabase — PostgreSQL, RLS, 45+ tables |
| Auth | Auth.js v5 beta — Google OAuth, JWT sessions |
| Rich Text | TipTap v3 — 12 extensions, lowlight syntax highlighting |
| Forms | react-hook-form + zod |
| Email | Nodemailer |
| Comments | Giscus (GitHub Discussions) |
| Icons | lucide-react + @heroicons/react |
| Deploy | Vercel |

---

## Quick Start

```bash
git clone https://github.com/eyasir329/neupc.git
cd neupc
npm install
cp .env.example .env.local   # fill in your values
npm run dev                  # http://localhost:3000
```

→ See **[docs/getting-started/index.md](docs/getting-started/index.md)** for environment variables, database schema setup, and OAuth configuration.

---

## Documentation

→ Full index: **[docs/README.md](docs/README.md)**

| Doc | What it covers |
|---|---|
| [Getting started](docs/getting-started/index.md) | Setup, database init, Google OAuth, running locally |
| [Environment variables](docs/getting-started/environment-variables.md) | Full env var reference with setup instructions |
| [Architecture](docs/architecture/index.md) | Folder structure, core patterns, data flow |
| [Project structure](docs/architecture/project-structure.md) | Detailed file tree walkthrough |
| [Component library](docs/architecture/components.md) | All 80+ React components by category |
| [API routes](docs/architecture/api-routes.md) | All 19 REST API endpoints documented |
| [Server actions](docs/architecture/server-actions.md) | All 30+ action files with exported functions |
| [Data service](docs/architecture/data-service.md) | All 262 `data-service.js` functions |
| [Authentication](docs/auth/authentication.md) | Google OAuth flow, JWT sessions, route guards |
| [Roles & pages](docs/product/roles-and-pages.md) | All six roles with every protected page path |
| [Features](docs/product/features.md) | Every feature module — Blog, Events, Chat, etc. |
| [Database](docs/database/index.md) | 45+ tables, RLS policies, entity relationships |
| [Security](docs/security/index.md) | 4-layer guard model, rate limiter, CSP headers |
| [Design system](docs/frontend/design-system.md) | Color tokens, typography, animations |
| [Deployment](docs/deployment/index.md) | Vercel deploy, CI/CD, monitoring, scaling |
| [Troubleshooting](docs/troubleshooting.md) | Common issues and fixes |
| [Contributing](docs/CONTRIBUTING.md) | Branching, commits, code style, PR process |
| [Adding features](docs/guides/adding-new-feature.md) | Step-by-step guide for new features |
| [Engineering doc](docs/overview/engineering-documentation.md) | Full end-to-end engineering overview |
| [Schema SQL](docs/database/schema.sql) | Raw SQL for Supabase schema setup |

---

## Scripts

```bash
npm run dev     # development (Turbopack, http://localhost:3000)
npm run build   # production build
npm run start   # production server
npm run lint    # ESLint — next/core-web-vitals
```

---

## Contributing

```bash
git checkout -b feat/your-feature
# make changes
npm run lint && npm run build
git commit -m "feat: what you did"
git push origin feat/your-feature
# open a pull request
```

Prefix commits with `feat:` `fix:` `docs:` `refactor:` `perf:` `chore:`.
Core rules: Server Components by default · all DB calls through `data-service.js` · all mutations in `*-actions.js` with `requireRole()` at the top · validate with `zod`, sanitise HTML inputs.

---

MIT — see [LICENSE](LICENSE).
