# Security

Defense-in-depth: four independent layers protect every request and mutation.

---

## Layer 1 — Middleware (`proxy.js`)

NextAuth middleware runs before any route handler on `/account/*`.

```js
// proxy.js
export const config = {
  matcher: ['/account/:path*'],
};
```

- Unauthenticated requests to any `/account/*` path are redirected to `/login` before any page code runs.
- Runs at the Edge — no cold start cost.

---

## Layer 2 — Page-Level Guard (`auth-guard.js`)

Every protected `page.js` and `layout.js` calls `requireRole()` as its first action:

```js
// Checks: session valid + role match + account_status === 'active' + is_active === true
const { session, user, userRoles } = await requireRole('admin');

// Accept multiple roles (user needs at least one)
const { session, user } = await requireRole(['executive', 'admin']);

// Auth-only — no role check
const { session, user } = await requireAuth();
```

Fails any check → redirects to `/account`. Uses `React.cache()` to deduplicate DB queries within a single request.

---

## Layer 3 — Server Action Guard

Every `*-actions.js` function re-runs `requireRole()` before reading `formData`. This makes server actions self-protecting against forged POST requests that bypass the page layer.

```js
'use server';

export async function deleteUserAction(id) {
  await requireRole('admin');  // ← always first
  // only reaches here if the caller is an active admin
  await deleteUser(id);
}
```

---

## Layer 4 — Supabase Row Level Security

RLS policies on every table enforce data access at the database level regardless of how queries reach Supabase. Even if the application layer is compromised, the DB rejects unauthorised reads and writes.

`supabaseAdmin` (service role) is used only in trusted server-side code to perform writes that require bypassing RLS (e.g., approving a user). It is **never imported in component files**.

---

## Input Sanitisation

All user input is validated and sanitised before reaching the database.

### Validation (`validation.js`)

| Function | Use |
|---|---|
| `stripHtml(input)` | Remove all HTML from plain text fields |
| `escapeHtml(input)` | Escape `<`, `>`, `"`, `'`, `&` for safe display |
| `sanitizeText(input, maxLength = 500)` | trim → stripHtml → length cap |
| `sanitizeRichText(input, maxLength = 50000)` | TipTap HTML — strips `<script>`, `<style>`, dangerous attributes |

### Schema Validation

Every server action validates input against a `zod` schema before processing:

```js
const schema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(50000),
});
const parsed = schema.parse(Object.fromEntries(formData));
```

### Rich Text Storage

Blog post HTML goes through `sanitize-html` with an allowlist of safe tags and attributes before being stored in Supabase — prevents XSS via stored content.

---

## Rate Limiting (`rate-limiter.js`)

Sliding-window in-memory rate limiter applied to public-facing mutations (contact form, join request, auth endpoints).

```js
const { limited, remaining, retryAfterMs } = rateLimit(userId, {
  limit: 10,
  windowMs: 60_000,  // 10 requests per 60 seconds
});

if (limited) {
  return { error: `Too many requests. Retry in ${retryAfterMs}ms.` };
}
```

**Scope note:** Per-process in-memory. Each Vercel serverless function instance has its own bucket. Sufficient for dev and moderate production traffic. For large-scale multi-instance deployments, replace the internal `Map` with a Redis client (Upstash `@upstash/ratelimit` is a drop-in compatible option).

---

## HTTP Security Headers

Set on every response via `next.config.mjs`:

| Header | Value |
|---|---|
| `X-Frame-Options` | `DENY` — prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` — prevents MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` — legacy XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `Content-Security-Policy` | `default-src 'self'`, allows `giscus.app` for comments |
| `X-Powered-By` | Removed (`poweredByHeader: false`) |

Test headers in production at [securityheaders.com](https://securityheaders.com/).

---

## Security Event Logging

`security-service.js` writes to the `security_events` table on suspicious or notable events:

- Failed authentication attempts
- Role escalation attempts
- Rate limit triggers
- Unusual admin actions

Viewable at `/account/admin/security`.

---

## Checklist for New Features

When adding a new server action or API route:

```
✓ requireRole() or requireAuth() called as first line
✓ Input validated with a zod schema
✓ Plain text fields sanitised with sanitizeText()
✓ Rich text content sanitised with sanitizeRichText()
✓ Rate limit applied if the endpoint is public-facing
✓ supabaseAdmin used for writes — never supabase (anon) for mutations
✓ No user-supplied values interpolated directly into SQL
```
