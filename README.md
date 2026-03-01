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

→ See **[docs/getting-started.md](docs/getting-started.md)** for environment variables, database schema setup, and OAuth configuration.

---

## Documentation

| Doc | What it covers |
|---|---|
| [getting-started.md](docs/getting-started.md) | Env vars, database init, Google OAuth, running locally, deploying |
| [architecture.md](docs/architecture.md) | Folder structure, RSC-first pattern, dual Supabase clients, caching strategy |
| [authentication.md](docs/authentication.md) | Google OAuth flow, JWT session shape, new-user lifecycle, route guards |
| [roles-and-pages.md](docs/roles-and-pages.md) | All six roles with every protected page path and description |
| [features.md](docs/features.md) | Every feature module — Blog, Events, Chat, Mentorship, Discussions, etc. |
| [server-actions.md](docs/server-actions.md) | All 30+ action files with their exported server functions |
| [data-service.md](docs/data-service.md) | All 262 `data-service.js` functions grouped by domain |
| [database.md](docs/database.md) | Schema overview, table catalogue, RLS policy rationale |
| [security.md](docs/security.md) | 4-layer guard model, rate limiter, input sanitisation, HTTP headers |
| [design-system.md](docs/design-system.md) | Color tokens, typography, animations, global CSS utilities |
| [database-schema.sql](docs/database-schema.sql) | Raw SQL — paste into Supabase SQL Editor to initialise the schema |

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
