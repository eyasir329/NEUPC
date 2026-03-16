# API Routes

REST API endpoints under `app/api/`. All routes use Next.js Route Handlers.

---

## Authentication

### `POST|GET /api/auth/[...nextauth]`

NextAuth.js catch-all handler for Google OAuth sign-in, callback, session, and sign-out.

**File:** `app/api/auth/[...nextauth]/route.js`

| Endpoint | Purpose |
|---|---|
| `GET /api/auth/signin` | Sign-in page redirect |
| `GET /api/auth/callback/google` | Google OAuth callback |
| `GET /api/auth/session` | Return current session (JSON) |
| `POST /api/auth/signout` | Sign out and clear JWT |

---

## Health Check

### `GET /api/health`

Lightweight monitoring endpoint for uptime services (UptimeRobot, Vercel, load balancers).

**File:** `app/api/health/route.js`

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-03-17T00:00:00.000Z",
  "uptime": 3600,
  "version": "0.1.0",
  "environment": "production"
}
```

**Headers:** `Cache-Control: no-store, no-cache, must-revalidate`

---

## Image Proxy

### `GET /api/image/[id]`

Proxies images from Google Drive and external URLs through the app's own domain. Solves CSP, CORS, and hostname-whitelist issues.

**File:** `app/api/image/[id]/route.js`

**Modes:**

| Pattern | Purpose |
|---|---|
| `/api/image/{driveFileId}` | Proxy a Google Drive file by its file ID |
| `/api/image/proxy?url={encoded}` | Proxy any external image URL |

**Behavior:**
- Caches for 7 days (`Cache-Control: public, max-age=604800, immutable`)
- Falls back to placeholder image (`/placeholder-event.svg`) if upstream fails
- Tries Google CDN first, then Drive thumbnail as fallback

---

## Account

### `POST /api/account/heartbeat`

Client calls this every 60 seconds while the tab is open to track online status.

**File:** `app/api/account/heartbeat/route.js`

**Auth:** Required (session-based)

**What it does:**
- Updates `users.last_seen` timestamp
- Sets `users.is_online = true` (unless account is blocked/suspended)

**Response:** `{ ok: true }` or `{ error: "..." }`

---

### `GET /api/account/events/[eventId]/registrations`

Returns registrations for an event (for the current user's context).

**File:** `app/api/account/events/[eventId]/registrations/route.js`

---

### `GET /api/account/messages`

Returns messages for the authenticated user's chat conversations.

**File:** `app/api/account/messages/route.js`

---

### `GET /api/account/status-reason`

Returns the account status reason for the current user.

**File:** `app/api/account/status-reason/route.js`

---

## Admin

### `GET /api/admin/users`

Returns the full user list with filters.

**File:** `app/api/admin/users/route.js`

**Auth:** `admin` role required

---

### `POST /api/admin/users/create`

Create a new user manually.

**File:** `app/api/admin/users/create/route.js`

---

### `GET /api/admin/users/[userId]`

Get a specific user's full profile.

**File:** `app/api/admin/users/[userId]/route.js`

---

### `PUT /api/admin/users/[userId]/edit`

Update a user's profile, status, or roles.

**File:** `app/api/admin/users/[userId]/edit/route.js`

---

### `POST /api/admin/users/actions`

Bulk user actions (suspend, activate, ban, delete).

**File:** `app/api/admin/users/actions/route.js`

---

### `GET /api/admin/blogs/[blogId]/comments`

Returns all comments for a blog post (including pending).

**File:** `app/api/admin/blogs/[blogId]/comments/route.js`

---

### `GET /api/admin/events/[eventId]/registrations`

Returns all registrations for an event.

**File:** `app/api/admin/events/[eventId]/registrations/route.js`

---

### `PUT /api/admin/events/[eventId]/registrations/[registrationId]`

Update a specific registration (confirm, mark attended).

**File:** `app/api/admin/events/[eventId]/registrations/[registrationId]/route.js`

---

## Code Execution

### `POST /api/code/execute`

Executes code snippets via the [Wandbox](https://wandbox.org) online compiler API. Used in blog code blocks for interactive code execution.

**File:** `app/api/code/execute/route.js`

**Auth:** Required (any authenticated user)

**Supported languages:** C, C++, C#, Go, Java, JavaScript, PHP, Python, Ruby, Rust, TypeScript

**Request body:**

```json
{
  "language": "python",
  "code": "print('Hello, World!')",
  "stdin": ""
}
```

**Limits:** Code max 20,000 chars, stdin max 5,000 chars.

**Response:**

```json
{
  "result": {
    "language": "python",
    "version": "cpython-3.12.7",
    "output": "Hello, World!",
    "compile": null,
    "run": { "stdout": "Hello, World!", "stderr": "", "code": 0 }
  }
}
```

---

### `POST /api/code/explain`

AI-powered code explanation (if configured).

**File:** `app/api/code/explain/route.js`

---

### `POST /api/code/format`

Code formatting endpoint.

**File:** `app/api/code/format/route.js`

---

## Debug (Development Only)

### `GET /api/debug/users`

Returns user data for debugging. **Only available in development.**

**File:** `app/api/debug/users/route.js`

---

## Auth Guards for API Routes

All protected API routes use `requireApiSession()` from `app/_lib/api-guard.js`:

```js
import { requireApiSession, isAuthError } from '@/app/_lib/api-guard';

export async function POST(request) {
  const authResult = await requireApiSession();
  if (isAuthError(authResult)) return authResult; // 401 response

  // Proceed with authenticated logic
}
```
