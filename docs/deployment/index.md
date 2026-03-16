# Deployment

Guide for deploying the NEUPC Platform to production and managing CI/CD.

---

## Vercel (Recommended)

The project is optimized for [Vercel](https://vercel.com), the official Next.js hosting platform.

### One-Click Deploy

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repository
3. Add environment variables (see [environment-variables.md](../getting-started/environment-variables.md))
4. Set **Node.js version** to `20.x`
5. Deploy — auto-deploys on every push to `main`

### CLI Deploy

```bash
npm i -g vercel
vercel
```

### Environment Variables on Vercel

Add all variables under **Project → Settings → Environment Variables**.

Vercel auto-sets:
- `VERCEL_URL` — deployment URL (used by Auth.js)
- `NODE_ENV=production`

You must set:
- `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`
- `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- `NEXT_PUBLIC_SITE_URL` — your production domain
- SMTP variables (for email features)
- Google Drive variables (for image uploads)

### Google OAuth Redirect URI

Add your production callback URL in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

```
https://your-domain.com/api/auth/callback/google
```

---

## Build & Start

### Production Build

```bash
npm run build     # Creates optimized production build
npm run start     # Serves the production build on port 3000
```

### Production Build with Analysis

```bash
npm run analyze   # Build with bundle analysis (ANALYZE=true)
```

---

## Post-Deploy Checklist

```
✓ Google sign-in works on production domain
✓ /sitemap.xml returns valid XML with all routes
✓ /robots.txt returns correct crawler directives
✓ /api/health returns { status: "ok" }
✓ Security headers pass at securityheaders.com
✓ Supabase Storage images load correctly
✓ Giscus comments load on /blogs/[slug]
✓ Contact form emails are delivered
✓ HTTPS is enforced (HSTS header present)
```

---

## Monitoring

### Health Check

Use `/api/health` for uptime monitoring (UptimeRobot, Vercel, etc.):

```bash
curl https://your-domain.com/api/health
# → { "status": "ok", "timestamp": "...", "uptime": 3600 }
```

### Security Headers

Test at [securityheaders.com](https://securityheaders.com/?q=your-domain.com) — should score A or A+.

### Vercel Analytics

Enable Vercel Analytics in the Vercel dashboard for Core Web Vitals monitoring.

---

## CI / Pre-Commit

The project uses a `precommit` script:

```bash
npm run precommit    # runs: lint + format check
```

**Recommended CI workflow** (GitHub Actions):

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run build
```

---

## Custom Domain

1. Add domain in Vercel → **Project → Settings → Domains**
2. Update DNS records as instructed by Vercel
3. Update `NEXT_PUBLIC_SITE_URL` env var to the new domain
4. Update Google OAuth redirect URI
5. Update CSP in `next.config.mjs` if needed

---

## Scaling Notes

| Aspect | Current | For Scale |
|---|---|---|
| Rate limiting | In-memory `Map` | Replace with Redis ([Upstash](https://upstash.com)) |
| Database | Supabase free tier | Upgrade to Pro plan |
| Image CDN | Google Drive proxy | Consider Cloudflare Images or Supabase Storage CDN |
| Sessions | JWT (stateless) | No change needed — scales horizontally |
| Edge caching | ISR via `unstable_cache` | Add CDN caching headers |
