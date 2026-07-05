# Bootcamps — Architecture Reference

Reference for the bootcamp feature: data model, server actions, role-based UI,
shared utilities, and known synchronization gaps. Pair this with reading the
actual code — the goal here is orientation, not duplication.

- **Server actions:** [`app/_lib/bootcamp-actions.js`](../../app/_lib/bootcamp-actions.js) (~4700 lines, ~80 exports)
- **Google Drive upload:** [`app/_lib/bootcamp-upload.js`](../../app/_lib/bootcamp-upload.js)
- **Video streaming/metadata:** [`app/_lib/bootcamp-video.js`](../../app/_lib/bootcamp-video.js)
- **Shared UI:** [`app/account/_components/bootcamps/`](../../app/account/_components/bootcamps/)
- **Role-specific UI:** `app/account/{admin|executive|advisor|mentor|member}/bootcamps/`

---

## 1. Data model

Inferred from the queries in `bootcamp-actions.js`. The canonical schema lives
in Supabase; this is a working summary.

### Core hierarchy

```
bootcamps
  └── courses          (order_index, is_locked)
        └── modules    (order_index, is_locked)
              └── lessons (order_index, is_locked, type, video_source)
```

### Bootcamp fields

| Field              | Notes                                              |
| ------------------ | -------------------------------------------------- |
| `id`, `slug`       | UUID; slug auto-generated from title.              |
| `title`, `description`, `thumbnail` | Marketing surface.                |
| `status`           | `draft` \| `published` \| `archived`.              |
| `price`, `enrollment_type` | `price=0` means free.                      |
| `batch_info`, `start_date`, `end_date` | Free-text + dates.             |
| `total_lessons`, `total_duration` | Cached aggregates. See `recomputeBootcampTotals`. |
| `is_featured`      | Pinned to top of listings.                         |
| `category`, `difficulty` | Filtering.                                   |
| `max_students`     | Cohort cap (advisory only — no enforcement found). |
| `created_by`, `created_at` |                                            |

### Lesson types

`lessons.type` is one of:

- **`video`** — plays a video (`video_source` ∈ `none|drive|youtube|upload`)
- **`exam`** — graded quiz, see `exam_questions`, `exam_type`, `random_question_count`
- **`practice`** — array of solvable problems in `practice_problems`

Content blocks live in `lessons.content` (rich blocks edited via `MultiBlockEditor`).

### Related tables

- `enrollments` — `(bootcamp_id, user_id, status, enrolled_at)`. `status` ∈ `active|pending|cancelled|completed|rejected`.
- `lesson_progress` — `(user_id, lesson_id, bootcamp_id, is_completed, last_position, watch_time_seconds, notes, completed_at)`.
- `bootcamp_mentors` — assignment table mapping mentors → bootcamps.
- `bootcamp_tasks` / `task_submissions` — per-batch task assignments.
- `bootcamp_sessions` — scheduled live sessions.
- `bootcamp_mentorships` — per-member mentor notes.
- `bootcamp_help_tickets` — Q&A threads scoped to a bootcamp.
- `exam_submissions` — student answers + score + mentor feedback.
- `learning_activity` — daily heartbeat rows for streaks/heatmaps.
- `practice_problem_progress` — per-problem solved flag.

---

## 2. Roles & access matrix

Bootcamps surface in five role panels. Access is enforced inside server actions
via the helpers in `bootcamp-actions.js`:

| Helper                            | Allowed roles                                            |
| --------------------------------- | -------------------------------------------------------- |
| `requireAdmin()`                  | `admin`, `executive`                                     |
| `requireAdminOrMentor()`          | `admin`, `executive`, `mentor` (any mentor)              |
| `requireAdminOrBootcampMentor(id)`| `admin`, `executive`, or a mentor **assigned to that bootcamp** |
| `requireAnyRole([roles])`         | Generic — throws if user isn't in list                   |
| `getCurrentUserId()`              | Auth-only; returns `null` if unauthenticated             |

Page-level guards in `app/_lib/auth-guard.js` (`requireRole`) **redirect**
instead of throwing — appropriate for page rendering, not server actions.

| Capability                          | admin | executive | advisor | mentor* | member |
| ----------------------------------- | :---: | :-------: | :-----: | :-----: | :----: |
| Create/edit/delete bootcamps        |  ✅   |    ✅     |   —     |   —     |   —    |
| Toggle `is_featured`                |  ✅   |    ✅     |   —     |   —     |   —    |
| Curriculum CRUD (course/module/lesson) | ✅ |    ✅     |   —     |   ✅    |   —    |
| Assign mentors to bootcamp          |  ✅   |    ✅     |   —     |   —     |   —    |
| View/manage enrollments             |  ✅   |    ✅     |   —     |   ✅    |   —    |
| Export enrollments CSV              |  ✅   |    ✅     |   —     |   —     |   —    |
| Batch lifecycle (finish/start new)  |  ✅   |    ✅     |   —     |   —     |   —    |
| Tasks / sessions / mentorship notes |  ✅   |    ✅     |   —     |   ✅    | read   |
| Reply to help tickets               |  ✅   |    ✅     |   —     |   ✅    | submit |
| Review exam submissions             |  ✅   |    ✅     |   —     |   ✅    | submit |
| Analytics (cohort overview)         |  ✅   |    ✅     |   ✅    |   —     |   —    |
| Enroll, watch, take exams, practice |  —    |    —      |   —     |   —     |   ✅   |
| Leaderboard                         |  —    |    —      |   —     |   —     |   ✅   |

\* "Mentor" here means a mentor **assigned to that specific bootcamp** unless
   the function uses `requireAdminOrMentor` (any mentor role).

---

## 3. Server-action catalog

Grouped by domain. All exports live in
[`app/_lib/bootcamp-actions.js`](../../app/_lib/bootcamp-actions.js).
Line numbers are at time of writing — use `grep -n` if drift.

### 3.1 Bootcamp CRUD (lines ~154–614)

| Function                          | Auth                  | Mutates | Notes                                   |
| --------------------------------- | --------------------- | ------- | --------------------------------------- |
| `getAdminBootcamps()`             | admin/executive       |    —    | Includes drafts.                        |
| `getMemberBootcamps()`            | none (public)         |    —    | Only published.                         |
| `getBootcampWithCurriculum(id)`   | auth-only             |    —    | Throws `Unauthorized` if not logged in. |
| `getBootcampCurriculumLight(id)`  | auth-only             |    —    | Stub (no lesson content payload).       |
| `createBootcamp(formData)`        | admin/executive       |   ✅    | Generates slug; revalidates list.       |
| `updateBootcamp(id, formData)`    | admin/executive       |   ✅    | Re-runs `recomputeBootcampTotals`.      |
| `deleteBootcamp(id)`              | admin/executive       |   ✅    |                                         |
| `toggleBootcampFeatured(id)`      | admin/executive       |   ✅    |                                         |
| `uploadBootcampThumbnailAction`   | admin/executive       |   ✅    | Drive upload via `bootcamp-upload.js`.  |
| `uploadLessonImageAction`         | admin/executive/mentor|   ✅    | Inline lesson image upload.             |

### 3.2 Course / Module / Lesson CRUD (lines ~620–1230)

For each of `course`, `module`, `lesson`:

- `create*`, `update*`, `delete*`, `reorder*`, `toggle*Lock`
- Auth: `requireAdminOrBootcampMentor(bootcampId)` — resolves bootcamp from the
  parent chain on update/delete operations.
- All revalidate `/account/admin/bootcamps/[id]` and `/account/member/bootcamps/[id]`.
- All call `recomputeBootcampTotals` for create/update/delete of lessons.

Read helpers:

| Function                          | Auth      | Notes                                  |
| --------------------------------- | --------- | -------------------------------------- |
| `getLesson(lessonId)`             | auth-only | Full lesson row.                       |
| `getLessonContent(lessonId)`      | auth-only | Lazy fields only (used by SPA hop).    |
| `validateDriveVideo(videoId)`     | admin/executive/mentor | Pre-flight validity check. |

### 3.3 Enrollments — member-facing (lines ~1270–1440)

| Function                  | Auth       | Mutates | Notes                              |
| ------------------------- | ---------- | ------- | ---------------------------------- |
| `getMyEnrollments()`      | auth-only  |    —    | Active + completed, includes archived bootcamps. |
| `enrollUser(bootcampId)`  | auth-only  |   ✅    | Self-enroll. Honors `enrollment_type` (free vs request). |
| `cancelEnrollment(id)`    | auth-only  |   ✅    | Soft cancel.                       |
| `checkEnrollment(id)`     | auth-only  |    —    | `{ enrolled, status }`.            |
| `updateEnrollmentAccess(id)` | auth-only |  ✅    | Touches `last_accessed_at`.        |

### 3.4 Progress & activity (lines ~1444–1920)

All `userId`-scoped. Auth: `getCurrentUserId()` (throws `Unauthorized` if null).

- `getBootcampProgress(bootcampId)` — returns `{ lessonProgress, ... }`.
- `updateLessonProgress(lessonId, { last_position, ... })`.
- `touchLessonAccess(lessonId, bootcampId)` — pings access timestamp.
- `updateWatchTimeDelta(lessonId, deltaSeconds, lastPosition, bootcampId)`.
- `recordLearningActivity({ ... })` — daily heartbeat.
- `getLearningActivity(bootcampId?, days=30)` — heatmap.
- `markLessonComplete(lessonId, bootcampId)` / `markLessonIncomplete(...)`.
- `saveLessonNotes(lessonId, notes)`.
- `togglePracticeProblemSolved(lessonId, problemIndex, solved, bootcampId)`.

### 3.5 Admin enrollment management (lines ~1925–2360)

| Function                          | Auth                          | Notes                            |
| --------------------------------- | ----------------------------- | -------------------------------- |
| `searchUsersForEnrollment`        | bootcamp-mentor               | Typeahead.                       |
| `adminAddEnrollment(bcId, ids)`   | bootcamp-mentor               | Bulk add.                        |
| `adminUpdateEnrollmentStatus`     | bootcamp-mentor               | Set status arbitrary.            |
| `adminApproveEnrollment` / `Reject` | bootcamp-mentor             | Approve/reject pending.          |
| `adminRemoveEnrollment(id)`       | bootcamp-mentor               | Hard delete.                     |
| `getBootcampEnrollments`          | bootcamp-mentor               | Raw enrollment rows.             |
| `getEnrollmentsWithProgress`      | bootcamp-mentor               | Joined progress aggregates.      |
| `adminGetStudentProgress`         | bootcamp-mentor               | Per-student deep dive.           |
| `exportEnrollmentsCSV`            | **admin/executive only**      | CSV bytes — not mentor.          |
| `getEnrollmentStats`              | **admin/executive only**      | Counters.                        |

### 3.6 Mentor management & assignment (lines ~2363–2436)

| Function                          | Auth                  | Notes                            |
| --------------------------------- | --------------------- | -------------------------------- |
| `getBootcampMentors(bootcampId)`  | admin/executive       | List assigned mentors.           |
| `addBootcampMentor` / `remove`    | admin/executive       | Assignment CRUD.                 |
| `searchMentorUsers(query)`        | admin/executive       | Typeahead for assignment.        |
| `getMentorAssignedBootcamps()`    | auth-only             | Lists bootcamps for current mentor. |

### 3.7 Batch lifecycle (lines ~2442–2641)

- `getBatchSummary(bootcampId)` — current batch stats.
- `finishBatchAndStartNew(bootcampId, newBatchData)` — admin-only. Archives the
  current batch's data (snapshots progress, archives enrollments) and starts
  fresh. **High-stakes mutation; only admin.**

### 3.8 Mentor↔Member workflows (lines ~2648–3349)

Per-bootcamp tasks, sessions, mentorship notes, and help tickets. All write
actions: `requireAdminOrBootcampMentor`. Member-facing reads:
- `getBootcampTasks` / `getMemberBootcampTasks`
- `submitTaskAction` (member upload + submission)
- `uploadTaskAttachmentAction`
- `getBootcampSessions` / `getMemberBootcampSessions`
- `getBootcampHelpTickets` / `getMemberHelpTickets`
- `submitHelpTicketAction` (member)
- `replyAndResolveHelpTicketAction` (mentor/admin)

### 3.9 Exams, practice & leaderboard (lines ~3351–4263)

| Function                                | Auth                      | Notes                            |
| --------------------------------------- | ------------------------- | -------------------------------- |
| `submitExamSubmission`                  | auth-only (member)        | Student submits answers.         |
| `getExamSubmission(lessonId, userId?)`  | auth-only                 | Self or admin lookup.            |
| `getExamSubmissionsForMentor(bcId)`     | bootcamp-mentor           | Review queue.                    |
| `reviewExamSubmission(id, score, fb, status)` | bootcamp-mentor     | Grade + feedback.                |
| `generateExamQuestionsAction(text, ...)`| admin/executive           | AI generation.                   |
| `generatePracticeProblemsAction(...)`   | admin/executive           | AI generation.                   |
| `getBootcampLeaderboard(bcId)`          | auth-only                 | Per-bootcamp.                    |
| `getBootcampsLeaderboardAction({...})`  | member                    | Cross-bootcamp aggregate.        |

### 3.10 Analytics (lines ~4267–end)

| Function                              | Auth                                  | Notes                  |
| ------------------------------------- | ------------------------------------- | ---------------------- |
| `getMentorStudentDetailedStats`       | bootcamp-mentor                       | Per-student detail.    |
| `getAdvisorBootcampAnalytics()`       | **advisor** (only — see Gap §6.4)     | Cohort overview.       |
| `getAdvisorBootcampStudents(bcId)`    | admin/executive/advisor               | Per-bootcamp students. |

---

## 4. Role panels — page & component map

All under `app/account/`. The `[bootcampId]` segment refers to the detail page.

### Admin (`admin/bootcamps/`)
- `page.js` — list + management (uses `BootcampManagementClient`).
- `[bootcampId]/page.js` — edit + curriculum builder (`BootcampDetailClient`).
- Heavy components: `CurriculumBuilder` (2169 lines), `MultiBlockEditor`
  (1595 lines), `EnrollmentsTab` (1304 lines), `LessonFullscreenEditorModal`
  (961 lines), `BootcampDetailClient` (855 lines).

### Executive (`executive/bootcamps/`)
- `page.js` — **re-uses admin's `BootcampManagementClient`**.
- `[bootcampId]/page.js` — **re-uses admin's `BootcampDetailClient`**.
- No executive-specific components.

### Advisor (`advisor/bootcamps/`)
- `page.js` — read-only analytics (`AdvisorBootcampClient`, 526 lines).
- No detail page — analytics is roll-up only.

### Mentor (`mentor/bootcamps/`)
- `page.js` — assigned bootcamps list (`MentorBootcampsListClient`).
- `[bootcampId]/page.js` — per-bootcamp mentor workspace
  (`MentorBootcampDetailClient`).

### Member (`member/bootcamps/`)
- `page.js` — browse + enrolled list + learning activity heatmap
  (`MemberBootcampsClient`, 3059 lines).
- `[bootcampId]/page.js` — bootcamp landing + curriculum
  (`BootcampLearningClient`).
- `[bootcampId]/[lessonId]/page.js` — lesson player
  (`LessonContentRenderer`, `VideoPlayer`).
- `MemberProblemSetClient` — practice problems UI.
- All bootcamps pages have `loading.js`, `error.js`, `not-found.js`.

---

## 5. Shared UI & utilities

Located in [`app/account/_components/bootcamps/`](../../app/account/_components/bootcamps/).
All five role panels import from here.

### `bootcampConfig.js`
The single source of truth for bootcamp constants and formatters:

- **Status** — `BOOTCAMP_STATUSES`, `STATUS_CONFIG`, `getStatusConfig(status)`.
- **Video source** — `VIDEO_SOURCES`, `VIDEO_SOURCE_CONFIG`, `getVideoSourceConfig`.
- **Sort** — `SORT_OPTIONS`, `sortBootcamps(bootcamps, sortKey)`.
- **Date** — `formatDate`, `formatRelativeDate`.
- **Duration** — `formatDuration(minutes)`, `formatDurationSeconds(seconds)`.
- **Price** — `formatPrice(price, currency='BDT')`.
- **Validation** — `validateBootcamp(data)`, `validateLesson(data)`.

### `BootcampErrorState.js`
Standard "Failed to load" panel used by every role bootcamp page when a
server-action fetch fails. Props: `{ title, message }`.

### `bootcampPageHelpers.js`
`safeFetch(asyncFn) → { data, error }` — replaces the per-page try/catch
boilerplate.

---

## 6. Synchronization gaps (audit findings)

Items found during the audit that are real inconsistencies, ranked by risk.
**None of these have been changed** unless explicitly noted — they're flagged
here so you can decide what to do next.

### 6.1 Missing `revalidatePath` for executive routes — **high priority bug**

`createBootcamp`, `updateBootcamp`, `deleteBootcamp`, and `toggleBootcampFeatured`
revalidate both admin and executive paths. But **~75 other mutating actions**
(courses, modules, lessons, enrollments, mentor management, etc.) revalidate
only `/account/admin/bootcamps/...` and `/account/member/bootcamps/...` —
**never the matching `/account/executive/bootcamps/...` path**.

Because the executive panel literally renders the same `BootcampManagementClient`
and `BootcampDetailClient`, executive users will see **stale data** after a
mentor/admin mutation until the page is hard-reloaded.

**Suggested fix:** in `bootcamp-actions.js`, for every line of the form
`revalidatePath(\`/account/admin/bootcamps/${id}\`)`, add a sibling
`revalidatePath(\`/account/executive/bootcamps/${id}\`)`. Mechanical change.

### 6.2 `getAdvisorBootcampAnalytics` rejects admin/executive — **likely bug**

Line 4438 uses `requireRole('advisor')` which is (a) from `auth-guard` and uses
`redirect()` (wrong for a server action — should throw), and (b) doesn't allow
`admin`/`executive` who otherwise have full access. Compare to
`getAdvisorBootcampStudents` which correctly allows `['admin', 'executive', 'advisor']`.

**Suggested fix:** change to `await requireAnyRole(['admin', 'executive', 'advisor'])`.

### 6.3 `getMemberBootcamps` has no auth check at all — **review needed**

Line 194 fetches all published bootcamps with no auth check. This is likely
intentional (public marketing data) but undocumented. Either confirm intent
and add a JSDoc note, or wrap with `getCurrentUserId()` if it should be
authenticated.

### 6.4 Cross-panel feature parity gaps (informational, not bugs)

Each role panel implements its own bootcamp views. Feature presence varies by
intent — these are listed for visibility, not as defects:

| Feature                       | admin | exec | advisor | mentor | member |
| ----------------------------- | :---: | :--: | :-----: | :----: | :----: |
| Featured toggle               |  ✅   |  ✅  |   —     |   —    |   —    |
| Edit curriculum               |  ✅   |  ✅  |   —     |   ✅   |   —    |
| Add/remove mentors            |  ✅   |  ✅  |   —     |   —    |   —    |
| Approve pending enrollments   |  ✅   |  ✅  |   —     |   ✅   |   —    |
| CSV export                    |  ✅   |  ✅  |   —     |   —    |   —    |
| Cohort analytics              |  —    |  —   |   ✅    |   —    |   —    |
| Per-student deep dive         |  ✅   |  ✅  |   ✅    |   ✅   |   —    |
| Learning activity heatmap     |  —    |  —   |   —     |   —    |   ✅   |

### 6.5 Stylistic UI duplication (low priority)

The mentor list (`MentorBootcampsListClient`) inlines its own `STATUS_TONE`
constant with custom tailwind classes (`glow`, `pulse`) that differ visually
from admin's `getStatusConfig`. Member, advisor, and admin use `getStatusConfig`
from the shared `bootcampConfig`. **Not a bug** — the mentor design is
intentionally different — but if a future visual unification pass happens,
the mentor variant is the outlier.

### 6.6 `auth-guard.requireRole` vs action-level `requireAnyRole`

These look interchangeable but aren't:

- `requireRole` (`auth-guard.js`) — for **pages**. On failure: `redirect()`.
- `requireAnyRole` (`bootcamp-actions.js` helper) — for **server actions**. On failure: `throw`.

Using `requireRole` inside a server action (as `getBootcampsLeaderboardAction`
and `getAdvisorBootcampAnalytics` do) will produce a redirect Next.js
intercepts as an error from a server action. Functional, but inconsistent
with the rest of the file. Consider standardizing on `requireAnyRole` inside
this module.

---

## 7. External services

### Google Drive (videos & thumbnails)
- `bootcamp-upload.js` — direct + resumable uploads. Auth via service account
  (env: `GDRIVE_CLIENT_ID`, `GDRIVE_CLIENT_SECRET`, `GDRIVE_REFRESH_TOKEN`,
  optional `GDRIVE_FOLDER_ID`).
- Folder layout: `NEUPC_Bootcamps/{bootcamp_id}/thumbnails/...` and
  `NEUPC_Bootcamps/{bootcamp_id}/videos/{lesson_id}/...`.
- `bootcamp-video.js` — streaming proxy + `getFileMetadata`, `canAccessFile`.
- Refresh-token rotation runbook: [`docs/google-drive-token-refresh.md`](../operations/google-drive-token-refresh.md).

### Streaming endpoint
- `app/api/video/[lessonId]/route.js` — gates Drive playback by lesson access.

### AI generation
- `generateExamQuestionsAction` / `generatePracticeProblemsAction` use the same
  Anthropic-backed pipeline as the broader Practice Problem feature.

---

## 8. Conventions for new bootcamp code

1. **Server actions go in `bootcamp-actions.js`.** Don't fork into a new file
   unless you cross 5000 lines or have a clean domain boundary (e.g. a
   completely separate feature).
2. **Use the auth helpers.** Don't inline `auth() → users → user_roles`.
3. **Mutating actions must `revalidatePath`** for all role paths that render
   the affected data — admin **and** executive **and** member where relevant.
4. **Shared formatters/constants live in `bootcampConfig.js`.** New role panels
   should import from there, never duplicate.
5. **Role pages use `safeFetch` + `BootcampErrorState`.** See `admin/bootcamps/page.js`
   for the canonical pattern.
6. **JSDoc public actions.** Include `@param`, `@returns`, and an inline note
   about access (which role / which auth helper).
