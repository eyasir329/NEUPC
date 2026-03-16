# Role-Based Routes (Text Reference)

This repository previously contained Draw.io diagram source files (`.xml`) describing role dashboards and permissions. Those diagram files were removed as part of a cleanup to keep the repo free of `.xml` / `.drawio` artifacts.

This document remains as a **text-first** reference for how role dashboards are organized.

## Where to look for canonical details

- `docs/product/sitemap.md` — route inventory (public + authenticated)
- `docs/overview/engineering-documentation.md` — architecture, modules, and security strategy
- `docs/product/roles-and-pages.md` — role-to-page mapping (high-level)
- `docs/security/index.md` — security/authorization notes

## Role dashboards (high-level)

All authenticated dashboards live under `/account/*` and are protected by middleware + server-side guards.

- **Guest** (`/account/guest/*`): onboarding + membership application flow
- **Member** (`/account/member/*`): core member experience (events, resources, profile, etc.)
- **Mentor** (`/account/mentor/*`): mentoring workflows (mentees, sessions, guidance)
- **Advisor** (`/account/advisor/*`): oversight / review / reporting
- **Executive** (`/account/executive/*`): club operations (events, publishing, certificates, reporting)
- **Admin** (`/account/admin/*`): full system administration (users/roles/security/content)

Notes:

- Exact pages evolve; treat the above as an orientation map and defer to `SITEMAP.md` for current routes.
- Authorization is enforced in code (middleware + guards); docs describe intent but code is source-of-truth.

## Optional: Recreating diagrams (without committing XML)

If you need diagrams for a presentation:

1. Create them locally in diagrams.net (or any diagram tool).
2. Export to **PNG/PDF** for sharing.
3. Avoid committing `.xml` / `.drawio` sources if the repo policy is to keep those artifacts out.
