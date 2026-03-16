# Troubleshooting

Common issues and their solutions.

---

## Authentication

| Symptom | Cause | Fix |
|---|---|---|
| Sign-in redirects to `/account` but shows "pending" | First user has no role | Run SQL to set `account_status = 'active'` and assign admin role (see [getting-started](getting-started/index.md)) |
| Google sign-in fails with redirect error | Redirect URI mismatch | Add exact callback URL to Google Cloud Console: `http://localhost:3000/api/auth/callback/google` |
| "INVALID_ISSUER" or similar auth error | `AUTH_SECRET` missing or changed | Regenerate with `openssl rand -base64 32`, update `.env.local`, clear cookies |
| Session lost after deploy | `AUTH_SECRET` changed between deploys | Use the same `AUTH_SECRET` across all environments |
| Role switching doesn't work | Stale JWT | Sign out and sign back in to refresh token |

---

## Database

| Symptom | Cause | Fix |
|---|---|---|
| `SUPABASE_SERVICE_KEY` undefined | Env var not set or prefixed with `NEXT_PUBLIC_` | Set in `.env.local` without prefix |
| RLS policy blocks query | Using `supabase` (anon) for admin operations | Use `supabaseAdmin` in server actions |
| Table not found | Schema not applied | Run `docs/database/schema.sql` in Supabase SQL Editor |
| Duplicate key error | Unique constraint violation | Check existing data before insert |

---

## Images

| Symptom | Cause | Fix |
|---|---|---|
| Supabase Storage images don't load | Hostname not in `remotePatterns` | Add your Supabase hostname to `next.config.mjs` |
| Google Drive images show placeholder | Drive file not publicly shared or API quota exceeded | Check Drive sharing settings; verify proxy at `/api/image/[id]` |
| Images broken after CSP update | CSP `img-src` too restrictive | Add the image domain to CSP in `next.config.mjs` |

---

## Email

| Symptom | Cause | Fix |
|---|---|---|
| Emails not sending | SMTP vars missing | Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| Gmail "Less secure app" error | Using password instead of App Password | Enable 2FA, generate App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) |
| Email works locally, fails on Vercel | Env vars not set on Vercel | Add SMTP vars in Vercel → Project → Settings → Environment Variables |

---

## Build & Development

| Symptom | Cause | Fix |
|---|---|---|
| `npm run build` fails on `sanitize-html` | Missing dependency | Run `npm install` — it's a direct dependency |
| Tailwind classes not working | Wrong PostCSS config | Ensure `postcss.config.mjs` uses `@tailwindcss/postcss`, not `tailwindcss` |
| ESLint "unknown utility class" warnings | Tailwind v4 reports custom classes | Add custom classes to `global.css` with `@layer utilities` |
| Hot reload not working | Turbopack issue | Restart `npm run dev`; clear `.next/` folder if needed |
| `Module not found: @/app/...` | Path alias broken | Verify `jsconfig.json` has `"@/*": ["./*"]` mapping |

---

## Deployment

| Symptom | Cause | Fix |
|---|---|---|
| Vercel build fails | Node version mismatch | Set Node.js to `20.x` in Vercel settings |
| API routes return 500 | Missing env vars on Vercel | Verify all required env vars are set |
| CORS errors in production | CSP headers too restrictive | Update `connect-src` in `next.config.mjs` |
| Giscus comments don't appear | GitHub Discussions not enabled | Enable Discussions on your repo; install Giscus app |

---

## Performance

| Symptom | Cause | Fix |
|---|---|---|
| Slow initial page load | Large client bundle | Check for unnecessary `"use client"` directives; use dynamic imports |
| Dashboard loading slowly | Multiple sequential DB queries | Fetch data in parallel with `Promise.all()` |
| Image optimization slow | Too many concurrent optimizations | Adjust `minimumCacheTTL` in `next.config.mjs` |

---

## Quick Debug Commands

```bash
# Check if the app builds cleanly
npm run build

# Check for lint errors
npm run lint

# Check formatting
npm run format:check

# Fix formatting automatically
npm run format

# Check health endpoint
curl http://localhost:3000/api/health

# Check env vars are loaded (dev only)
curl http://localhost:3000/api/debug/users
```
