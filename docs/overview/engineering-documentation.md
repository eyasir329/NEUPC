# NEUPC Platform — Engineering Documentation

This document describes the NEUPC Programming Club Platform for developers maintaining or extending the system.

---

# 1 Project Overview

## Purpose

- Operate a public-facing programming club website and an authenticated, role-based internal platform.
- Centralize club content (blogs, roadmaps, events, notices), community activity (achievements, gallery), and membership lifecycle (guest → membership application → approval).

## Target Users

- **Visitors (unauthenticated):** explore public content and club information.
- **Authenticated users (accounts via Google OAuth):** access dashboards and role-scoped functionality.
- **Club staff (executive/advisor/mentor/admin):** manage content, approvals, and operational workflows.

## Main Capabilities

- Public website: home, about, committee, blogs, roadmaps, events, achievements, gallery, developers, legal pages.
- Account system: Google OAuth login, role selection, role dashboards.
- Membership pipeline: guest account creation, membership application submission, review/approval flow.
- Admin modules: user/role management, applications, content management (blogs/events/roadmaps/gallery/notices), settings, logs/analytics/export.

---

# 2 System Architecture

## High-Level Architecture

- **Frontend:** Next.js App Router (server components + client components), Tailwind CSS.
- **Backend:** Next.js server runtime (API routes + server actions) integrated with Supabase.
- **Data & Auth:** Supabase Postgres + Supabase Auth (used for admin auth user deletion), NextAuth (Google provider) for session/auth in the app.
- **Email:** Gmail API integration via `googleapis` (verification/activation and custom email sends).
- **Media:** Google Drive integration for user avatars and content images; internal image proxy route for stable, CSP-safe rendering.

## Frontend Structure (Next.js App Router)

- `app/layout.js` is the global root layout; it:
  - Imports global CSS.
  - Loads site-wide data in parallel (session + settings + footer/social/contact).
  - Provides global UI providers (toaster, role context, page transition) and shared shell (header/footer).
- Route folders under `app/` define pages and nested layouts:
  - Public pages are primarily **server components** that fetch data and render a corresponding **client component** (e.g., `BlogsClient`, `EventsClient`, etc.).
  - Dashboard areas under `app/account/*` use layout-level guards and client-heavy UIs with code-splitting where appropriate.

## Backend Services (Supabase + APIs)

- Supabase clients are created in `app/_lib/supabase.js`:
  - `supabase` (anon key) for RLS-respecting reads.
  - `supabaseAdmin` (service-role key) for privileged writes and admin operations (server-only).
- Read-only SSR data fetchers are organized under `app/_lib/public-actions.js` and are cached using `unstable_cache` with tags.
- Mutations are implemented as **server actions** in `app/_lib/*-actions.js` and `app/_lib/user-actions.js`, typically:
  - Validate/normalize input.
  - Perform Supabase writes via `supabaseAdmin`.
  - `revalidatePath` / `revalidateTag` to update ISR/cache consumers.

## Client vs Server Responsibilities

- **Server (SSR / server actions / API routes):**
  - Session resolution via `auth()`.
  - Authorization checks via `requireAuth()` / `requireRole()`.
  - Data fetches for public pages and dashboards.
  - Write operations (admin/content/user operations) via `supabaseAdmin`.
  - Email dispatch via Gmail API.
  - Media proxy for images.
- **Client:**
  - Rich, interactive UI (dashboards, editors, animations).
  - Form UX and multi-step flows.
  - Optimistic UX where needed; final source of truth remains server-side.

## Data Flow (Typical Patterns)

1. **Public page request** → server component calls `public-actions` → `data-service` reads → render client component with initial props.
2. **Authenticated dashboard request** → middleware + `requireRole` gate → server component loads session + DB user/roles → render dashboard client.
3. **Mutation** (form submit) → client creates `FormData` → server action validates + writes via `supabaseAdmin` → triggers revalidation → UI refreshes.

## Cross-Cutting Infrastructure

- **Middleware:** `proxy.js` is the Next.js middleware entry (named deliberately) that redirects unauthenticated requests away from protected prefixes (currently `/account/*`).
- **Security headers:** configured in `next.config.mjs` (CSP, HSTS, anti-clickjacking, etc.).
- **Image configuration:** `next.config.mjs` allows safe remote domains plus internal proxy paths.

---

# 3 Application Modules

## Public Website

**Purpose**

- Provide club presence, showcase content, and drive account creation.

**Responsibilities**

- SEO-friendly SSR pages with structured data (JSON-LD).
- Public content discovery (blogs/events/roadmaps).

**Core Components**

- Page sections under `app/_components/sections/*`.
- SEO helpers in `app/_lib/seo` and JSON-LD components in `app/_components/ui/JsonLd`.
- Public data fetchers in `app/_lib/public-actions.js`.

## Authentication System

**Purpose**

- Provide Google OAuth login and unify session/user identity across the app.

**Responsibilities**

- Sign-in/out flows, session enrichment (roles + DB user id + avatar).
- Redirect control for protected routes.

**Core Components**

- NextAuth configuration: `app/_lib/auth.config.js`.
- NextAuth handlers: `app/_lib/auth.js` and API route `app/api/auth/[...nextauth]/route.js`.
- Middleware protection: `proxy.js`.
- Server guards: `app/_lib/auth-guard.js`.

## User Dashboard (Role-Based)

**Purpose**

- Provide role-scoped tools and workflows.

**Responsibilities**

- Role selection hub (`/account`).
- Dashboard shells per role (`/account/guest`, `/account/member`, `/account/executive`, `/account/mentor`, `/account/advisor`, `/account/admin`).

**Core Components**

- Dashboard configuration map: `app/_lib/roleDashboardConfig.js`.
- Guards: `requireRole()` and layout-level enforcement in each role layout.

## Admin Management System

**Purpose**

- Central administration for users, roles, approvals, settings, and system governance.

**Responsibilities**

- User lifecycle (status, roles, profiles).
- Approve/reject membership applications.
- Manage content entities (blogs/events/roadmaps/gallery/notices).
- Reporting, exports, logs.

**Core Components**

- Admin route subtree `app/account/admin/*`.
- Server actions under `app/_lib/*-actions.js`, `app/_lib/user-actions.js`, and `app/_lib/application-actions.js`.

## Content Management

**Purpose**

- Create, edit, publish, and moderate content.

**Responsibilities**

- Rich text editing and safe rendering.
- Asset management (images).

**Core Components**

- Blog actions: `app/_lib/blog-actions.js` (sanitization, Drive image upload, cache revalidation).
- Roadmap actions: `app/_lib/roadmap-actions.js`.
- Event actions: `app/_lib/event-actions.js`.
- Gallery actions: `app/_lib/gallery-actions.js`.
- Rich editor stack (TipTap + CodeMirror) used in authoring UIs.

## Event Management

**Purpose**

- Publish events and handle registrations.

**Responsibilities**

- Event listing and details.
- Eligibility gating + registration flows (role dependent).
- Event gallery association.

**Core Components**

- Public events: `app/events/*` + `public-actions`.
- Admin/executive event management: `app/account/*/events/*`.

## Roadmap System

**Purpose**

- Curate learning paths and structured resources.

**Responsibilities**

- Public roadmap listing and detail views.
- Internal authoring and moderation.

**Core Components**

- Public roadmaps: `app/roadmaps/*`.
- Roadmap actions and data-service fetchers.

## Gallery & Achievements System

**Purpose**

- Showcase club history, achievements, and event moments.

**Responsibilities**

- Merge gallery items and derived images from achievements/participations.
- Category organization and public presentation.

**Core Components**

- Public gallery: `app/gallery/page.js`.
- Achievements: `app/achievements/page.js`.

---

# 4 Route Documentation

This section documents the public routes and the authenticated dashboard routes (including role dashboards and core admin modules).

## Public Routes

### Route: /

**Purpose**

- Public homepage aggregating core content and calls-to-action.

**Main UI Sections**

- Hero, About, Events, Achievements, Blogs, Join CTA.

**Core Functionality**

- SSR fetch via `getHomePageData()` to populate sections.
- Structured data: Organization + Website JSON-LD.

**User Interactions**

- Navigate to content hubs (events/blogs/roadmaps).
- CTA to join/login.

**Data Sources**

- Settings (`website_settings` via `public-actions`).
- Events, featured blogs, achievements, participations.

**Related Routes**

- `/events`, `/blogs`, `/roadmaps`, `/join`, `/login`.

---

### Route: /about

**Purpose**

- Describe mission, vision, structure, and club identity.

**Main UI Sections**

- About content blocks + featured gallery + committee context.

**Core Functionality**

- SSR: `getAboutData()`, `getPublicFeaturedGallery()`, `getPublicCommittee()`.

**User Interactions**

- Navigate to committee and gallery.

**Data Sources**

- Settings category `about`, featured gallery items, committee query.

---

### Route: /achievements

**Purpose**

- Present achievements, participation records, and timeline.

**Main UI Sections**

- Achievements list, participations list, journey/timeline, stats.

**Core Functionality**

- SSR: `getPublicAchievements()`, `getPublicParticipations()`, `getPublicJourney()`.

**User Interactions**

- Browse achievements, open related content.

**Data Sources**

- `achievements`, `participation_records`, `journey_items`, plus stats from `about_stats` setting.

---

### Route: /blogs

**Purpose**

- Public blog index.

**Main UI Sections**

- Blog listing (cards), category and discovery UI (client-side).

**Core Functionality**

- SSR: `getPublicBlogs()`.
- Structured data: Collection JSON-LD.

**User Interactions**

- Open a blog post.

**Data Sources**

- `blog_posts` (published)

**Related Routes**

- `/blogs/[blogId]`.

---

### Route: /blogs/[blogId]

**Purpose**

- Blog article detail with comments and related posts.

**Main UI Sections**

- Article content, metadata, related posts, comments thread.

**Core Functionality**

- SSR: `getPublicBlogBySlug()`.
- Related: `getPublicBlogsByCategory()`.
- Comments: `getBlogComments(blog.id)`.

**User Interactions**

- Read article, browse related posts.
- If authenticated: interact with comments/likes (depending on implementation in client + actions).

**Data Sources**

- `blog_posts`, `blog_comments`, category queries.

---

### Route: /committee

**Purpose**

- Show current leadership: advisor, executive committee, mentors.

**Main UI Sections**

- Classified committee groups and member profiles.

**Core Functionality**

- SSR: `getPublicCommittee()`; data is transformed into display-safe objects.

**User Interactions**

- Browse profiles; open social links.

**Data Sources**

- `committee_members`, `committee_positions`, `users`, `member_profiles`, `advisor_profiles`.

---

### Route: /contact

**Purpose**

- Provide contact information, key contacts, and FAQ.

**Main UI Sections**

- Contact info, key contacts, contact form, FAQ.

**Core Functionality**

- SSR: `getContactInfo()`, `getFaqsData()`, `getPublicCommittee()`.
- Submission: server action `submitContactFormAction()` with IP-based rate limit.

**User Interactions**

- Submit contact form.

**Data Sources**

- Settings category `contact` + `faqs`.
- Writes: `contact_submissions`.

---

### Route: /developers

**Purpose**

- Present maintainers/contributors, stack, and development timeline.

**Main UI Sections**

- Core developers, contributors, tech stack overview, timeline.

**Core Functionality**

- SSR: `getDevelopersData()`.

**Data Sources**

- Settings category `developers` (and/or related settings entries as implemented in `public-actions`).

---

### Route: /events

**Purpose**

- Public events index.

**Main UI Sections**

- Event listing cards (upcoming/past), discovery UI.

**Core Functionality**

- SSR: `getPublicEvents()`.
- Structured data: Collection JSON-LD.

**User Interactions**

- Open event detail.

**Data Sources**

- `events` (published)

**Related Routes**

- `/events/[eventId]`.

---

### Route: /events/[eventId]

**Purpose**

- Event details with registration and gallery viewer.

**Main UI Sections**

- Hero (status/category/venue), info grid (date/time/location), content body, registration card, gallery viewer.

**Core Functionality**

- SSR: `getPublicEventById(eventId)`.
- Gallery: `getPublicEventGallery(event.id)`.
- Session-aware rendering: `auth()` used to adjust the registration UI.

**User Interactions**

- Register for event (role and eligibility dependent).
- Browse gallery images.

**Data Sources**

- `events`, `event_gallery`, registration tables (via dashboard actions/routes).

---

### Route: /gallery

**Purpose**

- Public media gallery aggregating images from multiple sources.

**Main UI Sections**

- Gallery grid, stats summary.

**Core Functionality**

- SSR: `getPublicGallery()` plus derived images from achievements and participation records.

**User Interactions**

- Browse images; filter/search behavior is client-managed if implemented.

**Data Sources**

- `gallery_items`, `achievements`, `participation_records`, `event_gallery`, `events`.

---

### Route: /join

**Purpose**

- Public account creation entrypoint.

**Main UI Sections**

- Feature/value props; Google OAuth CTA.

**Core Functionality**

- If already authenticated: redirect to `/account`.
- Client: `signIn('google', { callbackUrl: '/account' })`.

**Data Sources**

- Settings for copy/labels; account creation side-effects happen in NextAuth `signIn` callback.

---

### Route: /login

**Purpose**

- Auth entrypoint for existing users.

**Main UI Sections**

- Branded login card and OAuth CTA.

**Core Functionality**

- If already authenticated: redirect to `/account`.
- Client: NextAuth sign-in.

---

### Route: /roadmaps

**Purpose**

- Public roadmaps index.

**Main UI Sections**

- Roadmap listing cards.

**Core Functionality**

- SSR: `getPublicRoadmaps()`.

**Data Sources**

- `roadmaps` (published)

**Related Routes**

- `/roadmaps/[roadmapId]`.

---

### Route: /roadmaps/[roadmapId]

**Purpose**

- Roadmap detail view with related roadmaps.

**Main UI Sections**

- Roadmap content, modules/steps, related items.

**Core Functionality**

- SSR: `getPublicRoadmapBySlug()`.
- Related: `getPublicRoadmapsByCategory()`.

**Data Sources**

- `roadmaps`.

---

### Route: /privacy

**Purpose**

- Privacy policy (static legal content).

**Core Functionality**

- Static server component content.

---

### Route: /terms

**Purpose**

- Terms of service (static legal content).

**Core Functionality**

- Static server component content.

---

### Route: /verify-email

**Purpose**

- Email verification and account activation via token.

**Main UI Sections**

- Token validation state + verification action feedback.

**Core Functionality**

- SSR checks token validity against `users.verification_token`.
- Server action updates user `email_verified`, clears `verification_token`, activates account.

**Data Sources**

- `users` table (verification fields).

---

### Route: /robots.txt (generated)

**Purpose**

- Provide crawler directives.

**Core Functionality**

- Disallow `/account`, `/api`, and `/login` for most crawlers.

---

### Route: /sitemap.xml (generated)

**Purpose**

- Provide sitemap including static pages and DB-backed dynamic pages.

**Core Functionality**

- Fetches public events/blogs/roadmaps in parallel and returns entries with `lastModified`.

---

## Authenticated Areas

### Route: /account

**Purpose**

- Role hub: select dashboard for multi-role users and redirect single-role users.

**Main UI Sections**

- Account header, avatar, available roles grid, status messages, upgrade banner.

**Core Functionality**

- Server guard: `requireAuth()`.
- Dashboard options defined in `roleDashboards` map.

**User Interactions**

- Enter role dashboard.

**Data Sources**

- `users`, `user_roles`, `roles`.

---

### Route: /account/guest

**Purpose**

- Guest dashboard for authenticated users with limited access.

**Core Functionality**

- Layout enforces `guest` role.

**Primary Subroutes**

- `/account/guest/profile`: guest profile details and updates.
- `/account/guest/events`: browse/register for events (as implemented).
- `/account/guest/participation`: participation view (if enabled for guests).
- `/account/guest/notifications`: account notifications.
- `/account/guest/settings`: account settings.
- `/account/guest/membership-application`: multi-step membership application submission.

**Data Sources**

- `users`, `member_profiles` (pending stub), `join_requests`, `notifications`, `event_registrations`.

---

### Route: /account/member

**Purpose**

- Member dashboard for approved members.

**Core Functionality**

- Layout enforces `member` role.

**Primary Subroutes**

- `/account/member/events`: member-facing event registration and tracking.
- `/account/member/resources`: curated/internal resources.
- `/account/member/discussions`: forum threads and replies.
- `/account/member/problem-set`: tasks/problem sets.
- `/account/member/contests`: contest-related workflows.
- `/account/member/certificates`: view/download certificates.
- `/account/member/achievements`, `/account/member/participation`, `/account/member/gallery`.
- `/account/member/notices`, `/account/member/notifications`.
- `/account/member/profile`, `/account/member/settings`.

**Data Sources**

- `member_profiles`, `resources`, `discussion_threads`, `discussion_replies`, `task_submissions`, `event_registrations`, `certificates`, `notices`, `notifications`.

---

### Route: /account/admin

**Purpose**

- System administration dashboard and module entrypoint.

**Core Functionality**

- Layout enforces `admin` role.
- Admin overview is loaded via dynamic import for bundle isolation.

**Primary Subroutes / Modules**

- `/account/admin/users`: user management and lifecycle.
- `/account/admin/roles`: role definitions and role assignment.
- `/account/admin/applications`: membership applications review.
- `/account/admin/blogs`: blog authoring and moderation.
- `/account/admin/events`: event management.
- `/account/admin/roadmaps`: roadmap management.
- `/account/admin/gallery`: gallery management.
- `/account/admin/notices`: notices/announcements.
- `/account/admin/contact-submissions`: triage public contact submissions.
- `/account/admin/settings`: website settings by category.
- `/account/admin/analytics`: analytics dashboards.
- `/account/admin/security`: security controls and audit features.
- `/account/admin/export`: export data sets.
- `/account/admin/system-logs`: activity/system logs.
- Additional modules: achievements, committee, resources, bootcamps, etc.

**Data Sources**

- Broad access via `supabaseAdmin`; modules map to corresponding tables (e.g., `users`, `roles`, `user_roles`, `join_requests`, `website_settings`, `activity_logs`, content tables).

---

### Additional Role Dashboards (Implemented)

These dashboards exist in the codebase and follow the same guard/layout pattern:

- `/account/executive`: content and member operations.
- `/account/advisor`: oversight, approvals, analytics/budget.
- `/account/mentor`: mentoring workflows, tasks/sessions.

If you introduce new roles, extend `roles` table, `user_roles` mapping, and `roleDashboards` configuration.

---

# 5 Authentication System

## Registration (Public Account Creation)

- Entry route: `/join`.
- Mechanism: Google OAuth via NextAuth.
- Account provisioning: NextAuth `signIn` callback in `app/_lib/auth.js` creates a `users` row on first login and attempts to persist avatar via Drive.

## Login

- Entry route: `/login`.
- Mechanism: Google OAuth via NextAuth.
- Post-auth landing: `/account`.

## Email Verification

- Verification route: `/verify-email?token=...`.
- Token storage: `users.verification_token`.
- Activation: server action inside `/verify-email` page updates verification and activates the account.
- Email delivery: via Gmail API (`app/_lib/email-service.js`).

## Session Handling

- Session source: `auth()` from NextAuth.
- Session enrichment (in `session` callback):
  - Align session user id to DB user id.
  - Attach role list (`session.user.roles`) and primary role (`session.user.role`).
  - Prefer DB avatar as the source of truth.

## Protected Routes

- Middleware: `proxy.js` checks `/account/*` and redirects unauthenticated users to `/login` (preserving `callbackUrl`).
- Server guards:
  - `requireAuth()` for authentication-only.
  - `requireRole(role | role[])` for role and account_status gating.

## Role-Based Access

- Roles stored in `roles`, assigned via `user_roles`.
- Most dashboards enforce role access at layout level and re-check on server actions.

---

# 6 User Role System

## Role Model

- Users can have **multiple roles**.
- Primary role is derived by priority (see `roles.priority` usage in data-service role mapping).

## Baseline Roles

- **Guest:** authenticated user with limited dashboard access; can submit membership application.
- **Member:** approved user with internal resources, participation, and member tools.
- **Admin:** full system access.

## Extended Roles (Implemented)

- **Executive:** operational management (events/content/members).
- **Mentor:** mentoring sessions, tasks, member guidance.
- **Advisor:** oversight and approvals.

## Access Boundaries

- Public routes: no auth required.
- `/account/*`: auth required.
- Role dashboards and submodules: enforced by `requireRole()` and role layouts.
- Account status gating: access to dashboards requires `users.account_status === 'active'`.

---

# 7 Content Management

## Blogs

- Authoring and moderation occur in role dashboards (admin/executive as implemented).
- Sanitization: blog HTML is sanitized server-side (`sanitize-html`) before persistence/display.
- Media:
  - Uploads to Drive for blog images.
  - Internal proxy route supports safe rendering under CSP.
- Publishing:
  - State controlled via `status` (draft/published/archived) and featured flags.
  - Cache revalidation on publish/update affects `/blogs`, `/blogs/[blogId]`, homepage.

## Events

- Event entities are published for public view and used for registration flows.
- Detail route includes registration card and gallery viewer.
- Gallery items are associated with events (`event_gallery`).

## Roadmaps

- Published roadmaps power `/roadmaps` and `/roadmaps/[roadmapId]`.
- Related roadmaps are derived by category.

## Gallery

- Public gallery merges:
  - Dedicated gallery items.
  - Achievement and participation photos.
- Derived stats are calculated at request time from DB record counts.

## Notices

- Notices/announcements are loaded into dashboards and public sections where applicable.

---

# 8 UI Architecture

## Root Layout Responsibilities

- `app/layout.js`:
  - Global CSS and font configuration.
  - Shared providers: toast, role context, page transition.
  - Shared shell: header + footer.
  - Server-side session resolution and global settings fetch.

## Shared UI Components

- Reusable building blocks live under `app/_components/ui/*`.
- Page shells/background utilities provide consistent framing across pages.

## Responsive Layout Strategy

- Tailwind-based responsive classes are used throughout.
- Images use `next/image` with explicit remote/local patterns and device breakpoints.

## Animation System (Framer Motion)

- Global page transitions via a wrapper component.
- Section-level motion wrappers (e.g., `MotionSection`) to avoid animating the entire document.
- Dashboard code splitting is used for heavy client UIs (dynamic import).

---

# 9 Forms and Validation

## Join (/join)

- Not a form submission; initiates OAuth sign-in.
- Validation is implicitly handled by OAuth provider + server provisioning logic.

## Login (/login)

- OAuth sign-in only.

## Contact (/contact)

- Client form posts to server action `submitContactFormAction()`.
- Server-side controls:
  - IP-based rate limiting (`rateLimitPublicForm`).
  - Input sanitization and email format validation (`sanitizeText`, `isValidEmail`).

## Membership Application (/account/guest/membership-application)

- Multi-step client form posting to `submitMembershipApplicationAction()`.
- Server-side controls:
  - Requires authenticated, `active` user.
  - Ensures user currently has `guest` role.
  - Inserts/updates `join_requests` and upserts a pending `member_profiles` stub.

## Zod Validation

- Shared Zod schemas exist in `app/_lib/schemas.js` and should be used for:
  - Blog payload validation.
  - Comment payload validation.
  - Profile update validation.

---

# 10 Data Layer

## Supabase Usage

- `supabase` client: read operations that should respect RLS.
- `supabaseAdmin` client: server-only privileged operations (writes, admin reads).

## Query Organization

- Read patterns:
  - Public SSR data: `public-actions` delegates to `data-service` and is cached/tagged.
  - Dashboard data: role pages call targeted `data-service` helpers.
- Write patterns:
  - Server actions in `app/_lib/*-actions.js`.
  - Revalidation via `revalidatePath`/`revalidateTag` to keep SSR consistent.

## Typical Entities

The platform uses (at minimum) entities matching these responsibilities:

- `users`, `roles`, `user_roles`
- `member_profiles`, `advisor_profiles`, `mentor_profiles`, `admin_profiles`
- `join_requests` (membership applications)
- `blog_posts`, `blog_comments`
- `events`, `event_registrations`, `event_gallery`
- `roadmaps`
- `gallery_items`
- `achievements`, `participation_records`
- `website_settings`, `notices`, `notifications`
- `activity_logs` / system logs

---

# 11 Email System

## Verification / Activation Emails

- Sender implementation: Gmail API via OAuth2 (`googleapis`).
- Primary function: `sendActivationEmail()` and `sendActivationEmailForUser()`.
- Template behavior:
  - Supports placeholder substitution for verification link.
  - Escapes template input to avoid HTML injection.

## System Notifications

- Custom emails can be sent using `sendCustomEmail()` for operational messaging.
- In local/dev without Gmail vars, email sends are simulated as success (to avoid blocking workflows).

---

# 12 Performance Strategy

- **SSR-first public pages** with cached read helpers (`unstable_cache`) and tag-based invalidation.
- **Code splitting** for heavy dashboard clients (dynamic import in admin dashboard).
- **Image optimization** via `next/image` with tuned sizes and cache TTL; internal proxy prevents CORS/CSP breaks.
- **Animation containment**: motion wrappers and transitions are scoped to avoid expensive layout thrashing.
- **Server action size limits** configured for large uploads where needed.

---

# 13 Security Considerations

- **Authentication & authorization**
  - NextAuth session enforcement.
  - Middleware redirect for `/account/*` and server-side `requireRole()` guards.
  - Account status gating prevents suspended/banned users from entering dashboards.

- **Secret handling**
  - Service role key is enforced in production and must never reach the client.

- **Input validation & sanitization**
  - HTML sanitization for rich content (blogs).
  - Text sanitization for public forms.
  - Shared Zod schemas for structured payload validation.

- **Rate limiting**
  - In-memory sliding window limits for spam mitigation on public forms.

- **CSP and security headers**
  - Centralized headers in `next.config.mjs` (CSP, HSTS, clickjacking protection, etc.).

- **Safe image delivery**
  - Internal image proxy route plus Next image remote allow-list reduces XSS/CSP issues and blocks unexpected external domains.
