# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the NEUPC Next.js 16 App Router project. PostHog is initialized client-side via `instrumentation-client.js` (the recommended approach for Next.js 15.3+), a reverse proxy is configured in `next.config.mjs` to route events through `/ingest`, and a server-side PostHog client is available at `app/_lib/posthog-server.js`. User identification runs on every page load via `PostHogIdentify` in the root layout, and on every server-side sign-in via the NextAuth callback.

## Event inventory

| Event | Description | File |
|-------|-------------|------|
| `sign_in_clicked` | User clicks the 'Continue with Google' button to initiate OAuth sign-in | `app/join/JoinClient.js` |
| `contact_form_submitted` | Visitor submits the public contact form | `app/contact/ContactClient.js` |
| `user_signed_up` | New user account created via Google OAuth (server-side) | `app/_lib/auth/auth.js` |
| `user_signed_in` | Existing user successfully signs in (server-side) | `app/_lib/auth/auth.js` |
| `event_viewed` | User opens an event's detail view | `app/account/_components/events/EventDetail.js` |
| `event_created` | Admin creates a new club event | `app/account/admin/events/_components/EventManagementClient.js` |
| `solution_uploaded` | Member uploads a coding solution for a problem | `app/account/member/problem-solving/_components/SolutionModal.js` |
| `problem_viewed` | Member opens a problem's detail modal | `app/account/member/problem-solving/_components/ProblemList.js` |
| `user_approved` | Admin approves a pending user account (server-side) | `app/api/admin/users/actions/route.js` |
| `user_suspended` | Admin suspends a user account (server-side) | `app/api/admin/users/actions/route.js` |
| `application_approved` | Admin approves a membership application | `app/account/_components/applications/ApplicationsClient.js` |
| `application_rejected` | Admin rejects a membership application | `app/account/_components/applications/ApplicationsClient.js` |

## Files created

| File | Purpose |
|------|---------|
| `instrumentation-client.js` | Client-side PostHog initialization (Next.js 15.3+ pattern) |
| `app/_lib/posthog-server.js` | Server-side PostHog Node client factory |
| `app/_components/ui/PostHogIdentify.js` | Client component that calls `posthog.identify` on session mount |

## Files modified

| File | Change |
|------|--------|
| `next.config.mjs` | Added PostHog reverse proxy rewrites and PostHog hosts to `connect-src` CSP |
| `app/layout.js` | Added `PostHogIdentify` component with session user data |
| `.env.local` | Added `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard**: [Analytics basics (wizard)](https://us.posthog.com/project/496622/dashboard/1796161)
- **Sign-in Conversion Funnel**: [Insight](https://us.posthog.com/project/496622/insights/56aqx98C) — tracks `sign_in_clicked` → `user_signed_in` drop-off
- **New User Signups Over Time**: [Insight](https://us.posthog.com/project/496622/insights/K8yJc7HV) — weekly `user_signed_up` trend over 90 days
- **Problem-Solving Engagement**: [Insight](https://us.posthog.com/project/496622/insights/nzXIjx3u) — daily `problem_viewed` vs `solution_uploaded`
- **Contact Form Submissions**: [Insight](https://us.posthog.com/project/496622/insights/1ihAWC7j) — daily `contact_form_submitted` bar chart
- **Membership Application Outcomes**: [Insight](https://us.posthog.com/project/496622/insights/fh4CYgEF) — weekly `application_approved` vs `application_rejected` stacked bar

## Verify before merging

- [ ] Run a full production build (`npm run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any deployment environment configs (Vercel, etc.) so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — the `PostHogIdentify` component in the layout handles this, but verify it fires on page refresh for logged-in users.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
