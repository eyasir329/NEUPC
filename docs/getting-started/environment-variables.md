# Environment Variables

Complete reference for all environment variables used by the NEUPC Platform.

---

## Quick Setup

```bash
cp .env.example .env.local
# Fill in the values below
```

> **Never commit `.env.local` to version control.** It is already in `.gitignore`.

---

## Required Variables

These must be set for the application to function.

### Supabase

| Variable | Description | Where to find |
|---|---|---|
| `SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_KEY` | Anonymous/public API key (safe to expose) | Same location |
| `SUPABASE_SERVICE_KEY` | Service role secret key (**server-only**) | Same location |

> **Security:** `SUPABASE_SERVICE_KEY` bypasses Row Level Security. It must **never** be prefixed with `NEXT_PUBLIC_` and must never reach the client bundle.

### Auth.js (NextAuth)

| Variable | Description | How to generate |
|---|---|---|
| `NEXTAUTH_URL` | Your application url | e.g. `http://localhost:3000/` |
| `NEXTAUTH_SECRET` | JWT signing secret | `openssl rand -base64 32` |

> Set `NEXTAUTH_URL` to your canonical URL for NextAuth.js to function correctly.

### Google OAuth

| Variable | Description | Where to find |
|---|---|---|
| `AUTH_GOOGLE_ID` | Google OAuth 2.0 Client ID | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `AUTH_GOOGLE_SECRET` | Google OAuth 2.0 Client Secret | Same location |

**Setup steps:**
1. Create a project in Google Cloud Console
2. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Add **Authorized redirect URIs:**
   - Dev: `http://localhost:3000/api/auth/callback/google`
   - Prod: `https://your-domain.com/api/auth/callback/google`

### Site URL

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (no trailing slash) | `http://localhost:3000` or `https://neupc.vercel.app` |

Used for SEO metadata, sitemaps, canonical URLs, and OG images. The `NEXT_PUBLIC_` prefix makes it available on the client side.

---

## Optional Variables

### Email (Gmail / Nodemailer)

Required for contact form emails, verification emails, and notifications.

| Variable | Description |
|---|---|
| `GMAIL_USER` | Gmail address |
| `GMAIL_CLIENT_ID` | OAuth Client ID |
| `GMAIL_CLIENT_SECRET` | OAuth Client Secret |
| `GMAIL_REFRESH_TOKEN` | OAuth Refresh Token |

> For Gmail: Setting up OAuth2 requires generating OAuth credentials and obtaining a refresh token from the Google Cloud Platform.

### Google Drive (Avatar & Image Storage)

Required for uploading user avatars and content images to Google Drive.

| Variable | Description |
|---|---|
| `GDRIVE_CLIENT_ID` | Google OAuth Client ID |
| `GDRIVE_CLIENT_SECRET` | Google OAuth Client Secret |
| `GDRIVE_REFRESH_TOKEN` | Google OAuth Refresh Token |
| `GDRIVE_FOLDER_ID` | Google Drive folder ID for uploads |

**Setup steps:**
1. Enable the [Drive API](https://console.cloud.google.com/apis/api/drive.googleapis.com)
2. Configure OAuth Consent Screen & get OAuth credentials.
3. Obtain a Refresh Token by authenticating yourself via a script.
4. Create a Drive folder and make sure its permissions allow your operations.
5. Copy the folder ID from the Drive URL.

---

### Gemini API (AI Features)

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Gemini API Key |

Get your API key from [Google AI Studio](https://aistudio.google.com/).

---

## Variable Prefix Rules

| Prefix | Behavior |
|---|---|
| `NEXT_PUBLIC_` | Exposed to the browser (bundled into client JS) |
| No prefix | Server-only — accessible in server components, server actions, API routes |

**Rule:** Never prefix sensitive keys (`SUPABASE_SERVICE_KEY`, `AUTH_SECRET`, `GDRIVE_PRIVATE_KEY`) with `NEXT_PUBLIC_`.

---

## Vercel Deployment

When deploying to Vercel, add all variables under **Project → Settings → Environment Variables**.

Vercel auto-sets:
- `VERCEL_URL` — the deployment URL (used by Auth.js)
- `NODE_ENV` — set to `production`

You must manually set:
- All Supabase variables
- `AUTH_SECRET`
- Google OAuth credentials
- `NEXT_PUBLIC_SITE_URL` (your production domain)
- SMTP variables (if using email)
- Google Drive variables (if using image uploads)

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `SUPABASE_SERVICE_KEY` undefined | Env var not set or has `NEXT_PUBLIC_` prefix | Set in `.env.local` without prefix |
| Google sign-in fails | Redirect URI mismatch | Add exact callback URL to Google Cloud Console |
| Images don't load from Supabase | Hostname not whitelisted | Check `remotePatterns` in `next.config.mjs` |
| `NEXTAUTH_SECRET` error | Missing or invalid secret | Generate with `openssl rand -base64 32` |
