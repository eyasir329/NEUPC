# Contributing to NEUPC

Thank you for considering contributing to the NEUPC Platform! This guide will help you get started.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Code Style Guide](#code-style-guide)
- [Architecture Rules](#architecture-rules)
- [Testing](#testing)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

---

## Code of Conduct

Be respectful, inclusive, and constructive. We are a university programming club and welcome contributors of all experience levels.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork:

```bash
git clone https://github.com/<your-username>/neupc.git
cd neupc
```

3. **Install** dependencies:

```bash
npm install
```

4. **Set up** environment variables:

```bash
cp .env.example .env.local
# Fill in the required values — see docs/getting-started/environment-variables.md
```

5. **Initialize** the database:

   - Open [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
   - Paste and run `docs/database/schema.sql`

6. **Start** the dev server:

```bash
npm run dev
# → http://localhost:3000
```

See [docs/getting-started/index.md](getting-started/index.md) for the full setup guide.

---

## Development Workflow

### Branching Strategy

```
main                  ← production-ready, auto-deploys to Vercel
  └── feat/your-feature   ← your working branch
```

**Branch naming conventions:**

| Prefix | Use |
|---|---|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `refactor/` | Code restructuring (no behavior change) |
| `perf/` | Performance improvements |
| `chore/` | Build, tooling, dependencies |
| `style/` | Formatting, CSS, UI polish |

**Example:**

```bash
git checkout -b feat/add-certificate-download
```

### Before You Start

1. Check [GitHub Issues](https://github.com/eyasir329/neupc/issues) for existing work or discussions
2. For large features, open an issue first to discuss the approach
3. Pull the latest `main` before branching

---

## Commit Conventions

We follow **Conventional Commits**. Every commit message must be prefixed:

```
<type>: <short description>

[optional body]
[optional footer]
```

### Types

| Type | Description |
|---|---|
| `feat:` | A new feature |
| `fix:` | A bug fix |
| `docs:` | Documentation changes |
| `refactor:` | Code change that neither fixes a bug nor adds a feature |
| `perf:` | Performance improvement |
| `style:` | Formatting, missing semicolons, UI styling |
| `chore:` | Maintenance — build process, dependencies |
| `test:` | Adding or updating tests |

### Examples

```bash
# Good
git commit -m "feat: add certificate PDF download"
git commit -m "fix: prevent duplicate event registration"
git commit -m "docs: add API routes reference"
git commit -m "refactor: extract blog card into reusable component"

# Bad
git commit -m "updated stuff"
git commit -m "fix bug"
git commit -m "WIP"
```

---

## Pull Request Process

1. **Ensure your branch is up to date:**

```bash
git fetch origin
git rebase origin/main
```

2. **Run checks before pushing:**

```bash
npm run lint          # ESLint — must pass
npm run build         # Production build — must succeed
npm run format:check  # Prettier — must pass
```

3. **Push and open a PR:**

```bash
git push origin feat/your-feature
```

4. **PR description should include:**
   - What the change does
   - Why it's needed
   - Screenshots for UI changes
   - Any breaking changes or migration steps

5. **Review process:**
   - At least one maintainer must approve
   - All lint and build checks must pass
   - Resolve all review comments before merging

---

## Code Style Guide

### General Rules

- **JavaScript (ES Modules + JSDoc)** — no TypeScript, but use JSDoc for complex function signatures
- **Prettier** handles formatting — run `npm run format` before committing
- **ESLint** enforces quality — `next/core-web-vitals` + `eslint-config-prettier`
- Use the `@/` path alias for all imports (configured in `jsconfig.json`)

### File Naming

| Type | Convention | Example |
|---|---|---|
| Pages | `page.js` | `app/events/page.js` |
| Layouts | `layout.js` | `app/account/layout.js` |
| Client components | `PascalCase.js` | `EventCard.js` |
| Server actions | `kebab-case-actions.js` | `blog-actions.js` |
| Utilities | `kebab-case.js` | `data-service.js` |

### Import Order

```js
// 1. React / Next.js
import { Suspense } from 'react';
import Image from 'next/image';

// 2. Third-party libraries
import { format } from 'date-fns';

// 3. Internal modules (use @/ alias)
import { requireRole } from '@/app/_lib/auth-guard';
import { getEventById } from '@/app/_lib/data-service';

// 4. Components
import EventCard from '@/app/_components/ui/EventCard';

// 5. Styles (if any)
import '@/app/_styles/custom.css';
```

### Component Patterns

```jsx
// ✅ Server Component (default) — no "use client" needed
export default async function EventsPage() {
  const events = await getPublishedEvents();
  return <EventsClient events={events} />;
}

// ✅ Client Component — only when needed
'use client';
export default function EventsClient({ events }) {
  const [filter, setFilter] = useState('all');
  // ...
}
```

---

## Architecture Rules

These are **non-negotiable conventions** that keep the codebase maintainable:

### 1. Server Components by Default

Every file is a React Server Component unless it has `"use client"`. Only add `"use client"` when you need browser APIs, event listeners, or React state/effects.

### 2. All DB Queries Through `data-service.js`

```js
// ✅ Correct
import { getEventById } from '@/app/_lib/data-service';
const event = await getEventById(id);

// ❌ Wrong — raw Supabase query in a component
const { data } = await supabase.from('events').select('*').eq('id', id);
```

### 3. All Mutations via Server Actions

No `fetch()` calls for writes. Use `"use server"` functions in `*-actions.js` files.

### 4. `requireRole()` on Every Protected Page and Action

```js
// page.js or layout.js
const { session, user } = await requireRole('admin');

// *-actions.js — MUST re-verify at mutation level
export async function deleteEventAction(id) {
  await requireRole(['executive', 'admin']); // ← always first line
  // ...
}
```

### 5. Validate with Zod, Sanitize HTML Inputs

```js
// Validate
const parsed = schema.parse(Object.fromEntries(formData));

// Sanitize plain text
const safeName = sanitizeText(parsed.name);

// Sanitize rich text (TipTap HTML)
const safeContent = sanitizeRichText(parsed.content);
```

### 6. Dual Supabase Clients

| Client | Use | Where |
|---|---|---|
| `supabase` (anon) | RLS-respecting reads | Server components |
| `supabaseAdmin` (service role) | Writes, admin reads | Server actions and API routes **only** |

**Never** import `supabaseAdmin` in component or page files.

---

## Testing

Currently, the project does not have automated test suites. Contributions that add tests are highly welcome.

**Manual verification before PR:**

1. Run `npm run lint` — zero errors
2. Run `npm run build` — clean build
3. Test your feature in the browser
4. Check mobile responsiveness
5. For admin features, test with different roles (guest, member, admin)

---

## Reporting Bugs

Open a [GitHub Issue](https://github.com/eyasir329/neupc/issues/new) with:

- **Title:** Clear, concise description
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if UI-related)
- **Browser and OS**

---

## Requesting Features

Open a [GitHub Issue](https://github.com/eyasir329/neupc/issues/new) with:

- **Title:** `feat: <short description>`
- **Problem:** What problem does this solve?
- **Proposed solution:** How should it work?
- **Alternatives considered:** Any other approaches?

---

## Questions?

- Check the [documentation](docs/README.md) first
- Open a [GitHub Discussion](https://github.com/eyasir329/neupc/discussions) for questions
- Contact the maintainers via the website contact form

Thank you for contributing! 🎉
