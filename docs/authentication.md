# Authentication

Google OAuth via Auth.js v5 beta, JWT sessions, role-based access guards.

---

## Provider & Config

- **Provider:** Google OAuth only (`app/_lib/auth.js`)
- **Sessions:** JWT — no database session table
- **Middleware:** `proxy.js` — protects every `/account/*` route

```js
// proxy.js excerpt
export const config = {
  matcher: ['/account/:path*'],
};
```

---

## Sign-in Flow

```
User clicks "Sign in with Google"
        │
        ▼
/api/auth/signin → Google consent screen
        │
        ▼
/api/auth/callback/google
        │
        ▼
signIn callback  (app/_lib/auth.js)
  ├─ First sign-in  → createUser()
  │                   account_status: 'pending'
  │                   is_active:      false
  └─ Returning      → updateUser()
                      is_active:      true
                      last_login:     now()
        │
        ▼
session callback
  ├─ getUserByEmail()  → attach DB user id + name to token
  └─ getUserRoles()    → set session.user.role = primary role
        │
        ▼
JWT issued
        │
        ▼
redirect → /account
```

---

## Sign-out Flow

```
User clicks "Sign out"
        │
        ▼
signOut callback
  └─ updateUser()  is_active: false, updated_at: now()
        │
        ▼
JWT cleared → redirect /login
```

---

## Session Shape

```js
session.user = {
  id:    "uuid",                  // DB users.id
  name:  "Full Name",
  email: "user@example.com",
  image: "https://lh3.googleusercontent.com/…",
  role:  "guest"                  // primary role from DB
       | "member"
       | "mentor"
       | "executive"
       | "advisor"
       | "admin"
}
```

---

## New User Lifecycle

```
1. First Google sign-in
   └─ DB record created: account_status = 'pending', role = none

2. Admin reviews application (/account/admin/applications)
   └─ approveApplicationAction() called
      ├─ account_status → 'active'
      └─ role assigned (usually 'member')

3. User signs in again
   └─ auth guard passes, user lands on /account/member
```

Until step 2, the user can only access `/account/guest/*` pages (limited dashboard, membership application form).

---

## Route Guards

### `requireRole(role, options?)` — `app/_lib/auth-guard.js`

Used at the top of every protected `page.js` and `layout.js`.

```js
// Single role
const { session, user, userRoles } = await requireRole('admin');

// Accept multiple roles (user needs at least one)
const { session, user } = await requireRole(['executive', 'admin']);
```

**What it checks:**

1. Valid session (JWT present and not expired)
2. User record exists in DB
3. `account_status === 'active'`
4. `is_active === true`
5. User has the required role

Fails any check → redirects to `/account`.

Uses `React.cache()` internally — calling `requireRole()` from both `layout.js` and `page.js` in the same request makes only **one** DB query.

### `requireAuth()` — auth-only, no role check

Used on the `/account` hub page where any authenticated user is allowed.

```js
const { session, user, userRoles } = await requireAuth();
```

### Server action re-verification

Every `*-actions.js` function also calls `requireRole()` or `requireAuth()` as its first line:

```js
'use server';

export async function deleteEventAction(id) {
  await requireRole(['executive', 'admin']); // ← re-verified at mutation level
  // ...
}
```

This prevents forged POST requests from bypassing the page-level guard.

---

## Role Switching

Users may hold multiple roles (e.g., a member who is also a mentor). The active role is stored in the JWT and can be switched without signing out:

```js
// app/_lib/actions.js
await switchRoleAction('mentor', '/account/mentor');
// Updates session + redirects to the target role's dashboard
```

---

## Auth Files

| File | Purpose |
|---|---|
| `app/_lib/auth.js` | NextAuth config — provider, signIn, session, signOut callbacks |
| `app/_lib/auth-guard.js` | `requireRole()`, `requireAuth()`, `getCachedUserByEmail()`, `getCachedUserRoles()` |
| `app/_lib/actions.js` | `signInAction`, `signOutAction`, `switchRoleAction`, `setRoleAction` |
| `proxy.js` | NextAuth middleware — blocks unauthenticated `/account/*` requests |
| `app/api/auth/[...nextauth]/route.js` | NextAuth GET + POST handler |
