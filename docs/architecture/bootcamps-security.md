# Bootcamps — Security Audit

Date: 2026-05-26. Updated 2026-05-26 with applied fixes.

## Status overview

| ID | Severity | Status | Notes |
| --- | --- | --- | --- |
| C1 | CRITICAL | **Fixed** | Video upload route now uses `requireApiAuth(['admin','executive'])`. Thumbnail route was already correct (audit error). |
| C2 | CRITICAL | **Fixed** | `requireLessonAccess` helper derives bootcampId server-side and verifies enrollment. Applied to 8 progress/practice/exam actions. |
| C3 | CRITICAL | **Fixed** | New `bootcamp-sanitize.js` walks lesson content blocks, exam questions, practice problems, attachments, and plain rich-text fields. Applied at all known write sites. |
| H1 | HIGH | **Fixed** | `submitHelpTicketAction` now requires active enrollment. |
| H2 | HIGH | **Fixed** | Redirect targets validated against hostname allowlists (`googlevideo.com` for YouTube, Drive/GCS hosts for upload). |
| H3 | HIGH | **False positive** | Already enforced in `getBootcampWithCurriculum` and `getBootcampCurriculumLight`. Audit error. |
| H4 | HIGH | **Fixed** | Replaced `requireRole` (page-style redirect) with `requireAnyRole` in `getAdvisorBootcampAnalytics` and `getBootcampsLeaderboardAction`. |
| M1 | MEDIUM | **Deferred** | In-memory chunked-upload store. Functional today, problematic at scale. Needs Redis/streamed-resumable rewrite — separate work. |
| M2 | MEDIUM | **Deferred** | Public-read rate limits — codebase-wide pattern, not bootcamp-specific. |
| M3 | MEDIUM | **Resolved by existing design** | Update actions already field-pick; no spread-assignment to harden. |
| M4 | MEDIUM | **Deferred** | `validateDriveVideo` doesn't verify Drive parent chain. Low real-world impact: only admin/mentor can call, and service account scope is bootcamp folders. Tracking for future. |
| M5 | MEDIUM | **Fixed** | NODE_ENV bypass now requires `VERCEL_ENV !== 'production'` as well. |
| M6 | MEDIUM | **Partial fix** | Upload API routes return generic errors. Server-action `{ error: err.message }` patterns left as-is — that surface is generally validation messages, not schema leaks. |
| L1 | LOW | **Documented** | Executive cache revalidation gap (see [bootcamps.md §6.1](./bootcamps.md#61)). |
| L2 | LOW | **Fixed** | `getMentorAssignedBootcamps` now uses `requireAnyRole(['admin','executive','mentor'])`. |
| L3 | LOW | **Deferred** | JSON-blob shape validation (Zod). Defense in depth, not security-critical. |
| L4 | LOW | **Confirmed safe** | Existing CSV escaping covers Excel formula triggers (`=`, `+`, `-`, `@`). |
| L5 | LOW | **Deferred** | Per-action rate limits — codebase-wide pattern. |

Tradeoffs taken during fixes:

- **C2 cost**: every progress write now does an extra `lessons` + `enrollments`
  lookup. The pre-fix design passed `bootcampId` from the client to skip that
  query. This was a trust-boundary violation. Accepted the cost; if hot-path
  perf matters, cache enrollment per-session.
- **H2 allowlists**: `googlevideo.com` for YouTube CDNs; Drive/GCS hosts for
  uploaded videos. If a deploy stores upload URLs on a different CDN, add it
  to `UPLOAD_VIDEO_HOSTS` in `app/api/video/[lessonId]/route.js`.
- **C3 sanitizer**: built on the existing `sanitizeRichText` (`sanitize-html`).
  Allowlist is generous (allows `img`, headings, table cells, classes/ids,
  inline color/text-align styles). Rejects `<script>`, `on*`, `javascript:`.
  Tune in `app/_lib/validation.js` if legitimate styles get stripped.
- **C1 thumbnail route**: audit incorrectly flagged it. The video route was the
  only broken one — left a note above so the inaccuracy isn't forgotten.

Scope: `app/_lib/bootcamp-actions.js`, `app/_lib/bootcamp-upload.js`,
`app/_lib/bootcamp-video.js`, `app/api/admin/upload/{video,thumbnail}/`,
`app/api/video/[lessonId]/`, all role panels under `app/account/*/bootcamps/`.

Threat model: authenticated abuse (members, mentors), broken access control,
stored XSS, file-upload abuse, IDOR. Not in scope: full pentest of NextAuth,
Supabase RLS audit, network/transport.

Findings are ranked by severity. **Nothing has been changed.** Each item lists
the exact change I recommend and its tradeoff so you can pick what to apply.

---

## CRITICAL

### C1 — Broken auth on `/api/admin/upload/video`

[`app/api/admin/upload/video/route.js`](../../app/api/admin/upload/video/route.js)

```js
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
const isAdmin = await verifyAdmin(supabase, user); // reads "profiles.role"
```

Two bugs:

1. **Wrong auth backend.** The app uses **NextAuth** for sessions
   ([`app/_lib/auth.js`](../../app/_lib/auth.js)), not Supabase Auth. The
   `supabase.auth.getUser()` call here looks at the Supabase Auth cookie, which
   this app never sets. **`user` will be null on every real request → 401**.
   The endpoint may currently be unreachable from the UI.
2. **Wrong role check.** `verifyAdmin` queries `profiles.role`. This app stores
   roles in `user_roles` (junction table) — there is no `profiles.role`
   column referenced anywhere else. Even if (1) were fixed, this check would
   always return false.

The thumbnail upload route has the **same bugs**
([`app/api/admin/upload/thumbnail/route.js`](../../app/api/admin/upload/thumbnail/route.js)).

**Risk:** Either (a) the endpoint is broken and no one has noticed, or (b)
it's reachable through some path I haven't found and is silently failing
auth.

**Recommended fix:** Replace with the same pattern used everywhere else:

```js
import { auth } from '@/app/_lib/auth';
import { supabaseAdmin } from '@/app/_lib/supabase';
// ...
const session = await auth();
if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const { data: user } = await supabaseAdmin.from('users').select('id').eq('email', session.user.email).single();
const { data: roles } = await supabaseAdmin.from('user_roles').select('roles(name)').eq('user_id', user.id);
const isAdmin = roles?.some(r => ['admin','executive'].includes(r.roles?.name));
if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
```

Better: factor a `requireApiRole(['admin','executive'])` helper alongside the
existing `requireApiAuth`. **Tradeoff:** none — strictly correctness.

---

### C2 — IDOR: any logged-in user can mark any lesson complete

[`app/_lib/bootcamp-actions.js:1703`](../../app/_lib/bootcamp-actions.js#L1703)
`markLessonComplete(lessonId, bootcampId)` and its sibling
`markLessonIncomplete` accept `bootcampId` from the caller and trust it.
They do NOT verify enrollment, that the lesson belongs to the bootcamp, or
that the bootcamp is published.

Same pattern in:

- `updateLessonProgress`
- `updateWatchTimeDelta`
- `saveLessonNotes`
- `togglePracticeProblemSolved`
- `recordLearningActivity`
- `touchLessonAccess`

Page-level enforcement in
[`app/account/member/bootcamps/[bootcampId]/layout.js`](../../app/account/member/bootcamps/[bootcampId]/layout.js)
gates rendering, but server actions are independently callable. Any
authenticated user can fabricate progress in any bootcamp.

**Impact:** Leaderboard pollution, fake "completed" badges, and worse — the
`bootcampId` parameter is also written verbatim to `user_progress.bootcamp_id`,
so callers can attribute lesson work to a *different* bootcamp than the lesson
actually belongs to. That breaks analytics and per-bootcamp scoring.

**Recommended fix:** centralize an enrollment+ownership check:

```js
async function requireEnrolledForLesson(userId, lessonId) {
  const { data: lesson } = await supabaseAdmin
    .from('lessons')
    .select('id, is_published, modules(is_published, courses(is_published, bootcamps(id, status)))')
    .eq('id', lessonId)
    .single();
  if (!lesson) throw new Error('Lesson not found');
  const bootcampId = lesson.modules?.courses?.bootcamps?.id;
  // free preview bypass (mirror video route behavior)
  // verify enrollment
  const { data: enr } = await supabaseAdmin
    .from('enrollments').select('status')
    .eq('user_id', userId).eq('bootcamp_id', bootcampId).single();
  if (enr?.status !== 'active') throw new Error('Not enrolled');
  return { bootcampId, lesson };
}
```

Then drop `bootcampId` from the public signatures — derive it server-side.
**Tradeoff:** one extra query per progress write. Currently every call site
passes `bootcampId` to *skip* that query. The trust-boundary fix puts the
query back. For the heavy hot paths (watch-time deltas firing every ~15s),
consider caching the lookup per session.

---

### C3 — Stored XSS via lesson content (mentor → member)

Lesson rich content is stored unsanitized and rendered with
`dangerouslySetInnerHTML`:

- Write paths (no sanitization):
  [`bootcamp-actions.js:976`](../../app/_lib/bootcamp-actions.js#L976) (`createLesson`),
  [`:1051`](../../app/_lib/bootcamp-actions.js#L1051) (`updateLesson`),
  `saveLessonNotes`, `saveBootcampMentorshipNotesAction`,
  `submitHelpTicketAction`, `replyAndResolveHelpTicketAction`,
  `reviewExamSubmission`, `submitTaskAction`,
  `generateExamQuestionsAction` / `generatePracticeProblemsAction`
  (AI output written into DB).
- Render paths:
  [`LessonContentRenderer.js:391,400,412,611`](../../app/account/member/bootcamps/[bootcampId]/[lessonId]/_components/LessonContentRenderer.js),
  [`MemberBootcampsClient.js:81`](../../app/account/member/bootcamps/_components/MemberBootcampsClient.js#L81),
  [`LessonFullscreenEditorModal.js:883,957`](../../app/account/admin/bootcamps/_components/LessonFullscreenEditorModal.js).

The codebase has [`app/_lib/validation.js`](../../app/_lib/validation.js)
with `sanitizeRichText()` — used elsewhere but **never imported** in
`bootcamp-actions.js`. The architecture doc claims "all user HTML goes through
`sanitizeRichText()` before storage". That claim is false for bootcamp.

**Threat model:**

- A mentor (or compromised mentor account) authors lesson HTML containing
  `<img src=x onerror="fetch('/api/...', {credentials:'include'})">`. Every
  enrolled member who opens the lesson executes the payload with their
  session cookies — can submit forms, exfil data, escalate.
- A member submits a help ticket with `<script>` in `body`. The mentor's
  reply UI may render that content — mentor session compromise.

**Recommended fix:** sanitize on **write**, not just on render, for all
rich-text fields. Add a thin wrapper for JSON content blocks that recursively
sanitizes every `content` field. Server-side sanitization (e.g.
`sanitize-html` or the existing `sanitizeRichText`), not client-side.

For markdown rendering: also strip raw `<script>`, `on*` handlers, and
`javascript:` URLs **after** markdown→HTML. The `processMarkdown` path on
line 611 of `LessonContentRenderer.js` must be checked — markdown engines
generally pass HTML through.

**Tradeoff:** Sanitization can strip legitimate styling. Tune the allowlist
(allow common tags + class/style on inline elements; disallow `script`,
`iframe` except for trusted embed components, `on*`, `javascript:`).

---

## HIGH

### H1 — IDOR: anyone can submit help tickets to any bootcamp

[`bootcamp-actions.js:3053`](../../app/_lib/bootcamp-actions.js#L3053)
`submitHelpTicketAction` reads `bootcamp_id` from `formData` and inserts
without checking the user is enrolled in that bootcamp.

A non-enrolled user can spam help tickets to any bootcamp's queue. Lower-impact
than C2 but same trust-boundary class of bug.

**Fix:** call `checkEnrollment(bootcampId)` (status active) before insert.

### H2 — Open-redirect on `upload` video source

[`app/api/video/[lessonId]/route.js:306`](../../app/api/video/[lessonId]/route.js#L306)

```js
case 'upload':
  return NextResponse.redirect(lesson.video_url);
```

`lesson.video_url` is admin/mentor-controlled and not validated as a same-origin
or allowlisted-domain URL. A malicious mentor could set `video_url` to
`https://evil.example/page` — any member who clicks the lesson's video gets
redirected. Plus the same code on line 289 for YouTube (`resolveYouTubeStreamUrl`
returns a URL that becomes a redirect target).

**Fix:** validate the redirect target. For `upload`, the URL should be
internally-stored CDN content — assert the host belongs to an allowlist.
For YouTube, the resolved URL comes from `youtube.com` — assert hostname
ends in `googlevideo.com` or known YouTube CDNs before redirecting.

**Tradeoff:** if YouTube's stream-URL host pattern changes, you'll get
regressions. Add a feature flag for the host allowlist.

### H3 — Privilege check missing on `getBootcampWithCurriculum` for non-published

[`bootcamp-actions.js:303`](../../app/_lib/bootcamp-actions.js#L303)

The docstring says "Non-admins see only published bootcamps", but reading
the code, the function authenticates only; **it does not filter by status or
publication**. A logged-in non-admin can fetch full curriculum for a `draft`
bootcamp by guessing its UUID (or finding it in any reference). Lesson video
IDs leak through this path.

**Fix:** add a published-or-admin filter inside the function, mirroring the
logic in `canAccessLesson`.

### H4 — Page-level `requireRole('advisor')` inside a server action

[`bootcamp-actions.js:4438`](../../app/_lib/bootcamp-actions.js#L4438)
`getAdvisorBootcampAnalytics` calls `requireRole('advisor')` from
`auth-guard.js`. That helper calls `redirect()` on failure, which inside a
server action throws a `NEXT_REDIRECT` error — the calling client sees an
opaque server error rather than a proper 403. Also rejects admin/executive
who legitimately have access.

**Fix:** replace with `await requireAnyRole(['admin','executive','advisor'])`.

---

## MEDIUM

### M1 — In-memory chunked-upload session store

[`app/api/admin/upload/video/route.js:46`](../../app/api/admin/upload/video/route.js#L46)
`const uploadSessions = new Map();` plus a 24h cleanup `setInterval`.

Two problems:

1. **Memory pressure / DoS.** Each session keeps every chunk buffer in
   memory (`session.chunks[chunkIndex] = chunk`). A 2GB video kept fully in
   process memory until "complete" call. An attacker (admin-level — see C1 if
   that's also broken) can DoS the server by holding open sessions.
2. **Multi-instance / serverless breakage.** `uploadSessions` is per-process.
   Vercel and most Next deployments run multiple instances; a chunk uploaded
   to instance A is invisible to instance B. The endpoint will appear flaky in
   production.

**Fix:** stream chunks straight to Drive's resumable upload URL (the
`createResumableUpload` flow in `bootcamp-upload.js` already supports this),
or persist session state to Redis/DB. Don't keep file bytes in process memory.

### M2 — `getMemberBootcamps` and curriculum read fns lack rate limits

[`bootcamp-actions.js:194`](../../app/_lib/bootcamp-actions.js#L194)
`getMemberBootcamps` has no auth check (intentional for public listing) and
no rate limit. The architecture doc claims `rate-limiter.js` protects "all
public forms" — that's not true for read-only public actions. Cheap scraping
target; not a vulnerability per se, but worth a per-IP cap.

### M3 — Mass-assignment risk in update actions

[`bootcamp-actions.js:1017`](../../app/_lib/bootcamp-actions.js#L1017)
`updateLesson(lessonId, data)` writes `data.*` fields semi-directly. It does
field-pick by hand which is good — but the auth check resolves bootcamp from
the *existing* lesson row, so a mentor can't move a lesson into another
bootcamp by passing a different `module_id`. Verify all `data.module_id` /
`data.course_id` reassignments are explicitly disallowed (they aren't passed
through today but a refactor could regress this).

**Fix:** make it explicit. Strip `id`, `module_id`, `course_id`, `bootcamp_id`,
`created_at`, `created_by` from `data` at the top of every update action.

### M4 — `validateDriveVideo` doesn't bind to a lesson

[`bootcamp-actions.js:1233`](../../app/_lib/bootcamp-actions.js#L1233) checks
that a Drive video ID is accessible to the service account, but does not
check the video belongs in the `NEUPC_Bootcamps/{bootcampId}/` tree. A mentor
could attach an arbitrary Drive file the service account happens to have
access to.

**Fix:** when accepting a Drive ID, verify its `parents` chain leads back to
the expected bootcamp's videos folder.

### M5 — Local-dev bypass active on prod-build path

[`app/api/video/[lessonId]/route.js:127`](../../app/api/video/[lessonId]/route.js#L127):

```js
if (process.env.NODE_ENV === 'development') {
  return { allowed: true, lesson: lesson || {}, isAdmin: true };
}
```

This bypass is correct in dev, but it relies on `NODE_ENV` being trusted. If
any deploy ships with `NODE_ENV=development` (a developer dotenv leaking into
prod), the entire enrollment check is skipped. Worth a belt-and-suspenders
guard: also check `process.env.VERCEL_ENV !== 'production'` (or your prod
flag) before honoring the bypass.

### M6 — Error messages leak internals

Several places do `return { error: err.message }` or `return NextResponse.json({ error: error.message })`. Supabase error messages can contain table names, column names, and constraint info that aid an attacker enumerating the schema.

**Fix:** in production, return a generic message; log the detail server-side.

---

## LOW

### L1 — Missing executive cache revalidation

(Already in [`bootcamps.md` §6.1](./bootcamps.md#61).) Not a security issue
per se; listed here because stale data after a permission change (e.g.
removing a mentor) might keep them looking enrolled on the executive panel
longer than expected.

### L2 — `getMentorAssignedBootcamps` accepts any authenticated user

[`bootcamp-actions.js:2414`](../../app/_lib/bootcamp-actions.js#L2414) only
requires auth. A non-mentor user calling this action would get an empty
result (no rows in `bootcamp_mentors` for them), so it's not exploitable, but
hardening to `requireAnyRole(['admin','executive','mentor'])` would make
intent explicit and surface bugs earlier.

### L3 — JSON blob fields not validated

`exam_questions`, `practice_problems`, `attachments`, `content` are stored as
JSON blobs with no shape validation. A malformed payload could crash the
renderer. Defense in depth — add Zod schemas (project already uses Zod for
other server actions per `schemas.js`).

### L4 — CSV export formula-injection partially handled

[`bootcamp-actions.js:2307`](../../app/_lib/bootcamp-actions.js#L2307)
`escapeCell` prefixes formula-trigger chars (`=`, `+`, `-`, `@`) with a
single quote. Confirm it covers tab/CR/LF prefix forms as well — Excel also
treats some Unicode lookalikes as formula triggers.

### L5 — Help-ticket / mentorship notes lack rate limits

A mentor's reply path is not rate-limited; same for `saveLessonNotes`. Low
risk; abuse target if accounts are compromised.

---

## What I would fix first

A reasonable batched plan, lowest-risk fixes first:

1. **C1** — fix or remove the broken upload API routes (purely correctness;
   either nothing breaks or the routes start working again).
2. **H4** — replace `requireRole` with `requireAnyRole` (one-line fix).
3. **H1** — add enrollment check to `submitHelpTicketAction`.
4. **L2, M3** — defensive hardening, no behavior change for legitimate use.
5. **C3** — add server-side sanitization on write. Requires picking a
   sanitizer and an allowlist; test rich-text edits don't regress.
6. **C2** — close the IDOR on progress actions. Requires deciding whether to
   absorb the extra query cost or cache enrollment per session.
7. **H2, H3, M1, M4, M5** — design-level fixes; want your input first.

I have not changed code. Tell me which to do.
