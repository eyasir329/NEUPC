> Companion to [`bootcamps.md`](./bootcamps.md) (data model, server-action
> catalog, access matrix) and [`bootcamps-security.md`](./bootcamps-security.md)
> (auth helpers, audit findings). Read those for the *what* and *why*; this
> document covers the *who sees what, and from where*.

This reference walks through bootcamp functionality from the perspective of
each end-user panel. For every role it documents the entry points, on-page
features, server actions consumed, and the boundary of what that role can and
cannot do.

---

## 0. Cross-cutting context

### Routing convention
All panels live under `app/account/<role>/bootcamps/`. The route segments are
identical across roles, even when components differ:

| Route                                          | Purpose                       |
| ---------------------------------------------- | ----------------------------- |
| `/account/<role>/bootcamps`                    | Listing / dashboard           |
| `/account/<role>/bootcamps/[bootcampId]`       | Per-bootcamp detail workspace |
| `/account/member/bootcamps/[bootcampId]/[lessonId]` | Lesson player (member only) |

### Page scaffolding pattern
Every server `page.js` follows the same shape:

1. Guard the route with `requireRole('<role>')` from
   [`app/_lib/auth-guard.js`](../../app/_lib/auth-guard.js) — unauthorized users
   are redirected.
2. Use [`safeFetch`](../../app/account/_components/bootcamps/bootcampPageHelpers.js)
   to call the relevant server action and unwrap `{ data, error }`.
3. On `error`, render [`BootcampErrorState`](../../app/account/_components/bootcamps/BootcampErrorState.js).
4. On `data`, hand off to a client component for interactivity.

### Shared building blocks
- Constants & formatters: [`bootcampConfig.js`](../../app/account/_components/bootcamps/bootcampConfig.js)
- Curriculum editor (shared by admin/executive/mentor):
  [`CurriculumBuilder.js`](../../app/account/admin/bootcamps/_components/CurriculumBuilder.js)
- Rich-text lesson body editor: [`MultiBlockEditor.js`](../../app/account/admin/bootcamps/_components/MultiBlockEditor.js)
- Server actions: [`app/_lib/bootcamp-actions.js`](../../app/_lib/bootcamp-actions.js)

---

## 1. Admin panel

**Path:** [`app/account/admin/bootcamps/`](../../app/account/admin/bootcamps/)
**Role guard:** `requireRole('admin')`
**Persona:** Platform owner. Full read/write across every bootcamp.

### 1.1 List view (`page.js`)
Rendered by [`BootcampManagementClient`](../../app/account/admin/bootcamps/_components/BootcampManagementClient.js).
Loads via `getAdminBootcamps()` (includes drafts and archives).

Capabilities:
- Search, filter by status/difficulty/category, sort via
  `SORT_OPTIONS` from `bootcampConfig`.
- Toggle list vs. card view ([`BootcampCard`](../../app/account/admin/bootcamps/_components/BootcampCard.js),
  [`BootcampTableRow`](../../app/account/admin/bootcamps/_components/BootcampTableRow.js)).
- Create new bootcamp via [`BootcampFormModal`](../../app/account/admin/bootcamps/_components/BootcampFormModal.js)
  → `createBootcamp(formData)`.
- Inline update / delete / `toggleBootcampFeatured`.

### 1.2 Detail workspace (`[bootcampId]/page.js`)
Rendered by [`BootcampDetailClient`](../../app/account/admin/bootcamps/[bootcampId]/_components/BootcampDetailClient.js).
Four tabs:

| Tab           | Backing actions / components                                                                 |
| ------------- | -------------------------------------------------------------------------------------------- |
| **General Details** | `updateBootcamp`, `uploadBootcampThumbnailAction` (via `ThumbnailUploader`).           |
| **Curriculum**      | `CurriculumBuilder` → all `create/update/delete/reorder/toggleLock` actions for courses, modules, and lessons; `MultiBlockEditor` for lesson bodies; AI actions `generateExamQuestionsAction`, `generatePracticeProblemsAction`. |
| **Settings**        | Status (`draft` / `published` / `archived`), enrollment type, pricing, batch lifecycle (`finishBatchAndStartNew`). |
| **Enrollments**     | [`EnrollmentsTab`](../../app/account/admin/bootcamps/[bootcampId]/_components/EnrollmentsTab.js) — search/add users, approve/reject pending, change status, per-student progress drilldown, CSV export. |

### 1.3 What admin uniquely owns
- Bootcamp create / delete / featured toggle.
- Mentor assignment (`addBootcampMentor`, `removeBootcampMentor`,
  `searchMentorUsers`).
- CSV enrollment export (`exportEnrollmentsCSV`).
- Batch cohort cycling (`finishBatchAndStartNew` — irreversible; admin only).

---

## 2. Executive panel

**Path:** [`app/account/executive/bootcamps/`](../../app/account/executive/bootcamps/)
**Role guard:** `requireRole('executive')`
**Persona:** Senior staff with admin-equivalent operational rights.

### 2.1 Implementation
The executive panel **re-exports the admin client components**:

```js
// app/account/executive/bootcamps/page.js
import BootcampManagementClient from '@/app/account/admin/bootcamps/_components/BootcampManagementClient';

// app/account/executive/bootcamps/[bootcampId]/page.js
import BootcampDetailClient from '@/app/account/admin/bootcamps/[bootcampId]/_components/BootcampDetailClient';
```

Authorization on the server-action side allows `executive` wherever `admin`
is allowed (`requireAdmin` accepts both), so the feature surface is identical.

### 2.2 Known caveat
~75 mutating actions only call `revalidatePath` for `/account/admin/...` and
`/account/member/...` paths — the executive route is not invalidated. After
edits, executive users may see stale data until a hard reload. See
[`bootcamps.md` §6.1](./bootcamps.md#61-missing-revalidatepath-for-executive-routes--high-priority-bug).

---

## 3. Advisor panel

**Path:** [`app/account/advisor/bootcamps/`](../../app/account/advisor/bootcamps/)
**Role guard:** `requireRole('advisor')`
**Persona:** Read-only analytics consumer (academic advisor, program lead).

### 3.1 List view (`page.js`)
Rendered by [`AdvisorBootcampClient`](../../app/account/advisor/bootcamps/_components/AdvisorBootcampClient.js).
Loads via `getAdvisorBootcampAnalytics()` — cohort-wide roll-up metrics
(enrollments, completion rates, active learners per bootcamp).

Capabilities:
- View per-bootcamp KPI cards.
- Drill into student lists via `getAdvisorBootcampStudents(bootcampId)`.
- No detail page; no editing surface; no enrollment controls.

### 3.2 Boundary
The advisor role exists strictly for analytics. There is no
`[bootcampId]/page.js` route; clicking a bootcamp opens the in-page student
roster, not an editor.

> ⚠️ `getAdvisorBootcampAnalytics` currently rejects admin/executive callers.
> See [`bootcamps.md` §6.2](./bootcamps.md#62-getadvisorbootcampanalytics-rejects-adminexecutive--likely-bug).

---

## 4. Mentor panel

**Path:** [`app/account/mentor/bootcamps/`](../../app/account/mentor/bootcamps/)
**Role guard:** `requireRole('mentor')`
**Persona:** Instructor responsible for one or more specific bootcamps.

Most mentor write capabilities are gated by
`requireAdminOrBootcampMentor(bootcampId)` — a mentor only has authority over
bootcamps they are explicitly assigned to via the `bootcamp_mentors` table.

### 4.1 List view (`page.js`)
Rendered by [`MentorBootcampsListClient`](../../app/account/mentor/bootcamps/_components/MentorBootcampsListClient.js).
Loads via `getMentorAssignedBootcamps()` — returns only the bootcamps the
current user is assigned to mentor.

Capabilities:
- Browse assigned bootcamps as cards.
- Status pills via `getStatusConfig` (note: visual variant differs from other
  panels — see [`bootcamps.md` §6.5](./bootcamps.md#65-stylistic-ui-duplication-low-priority)).

### 4.2 Detail workspace (`[bootcampId]/page.js`)
Rendered by [`MentorBootcampDetailClient`](../../app/account/mentor/bootcamps/[bootcampId]/_components/MentorBootcampDetailClient.js)
(~100 lines).

Currently a **curriculum-only workspace**: it embeds the shared
`CurriculumBuilder` so mentors can edit courses, modules, lessons, exam
questions, and practice problems for their assigned bootcamp. The component
becomes read-only when `bootcamp.status === 'archived'`.

Server actions invoked through `CurriculumBuilder`:
`createCourse/Module/Lesson`, `updateLesson`, `reorderLessons`,
`toggleLessonLock`, `uploadLessonImageAction`, `generateExamQuestionsAction`,
`generatePracticeProblemsAction`, …

### 4.3 Other mentor-accessible server actions
Although not yet surfaced as dedicated tabs in the mentor detail page, the
following server actions accept bootcamp-assigned mentors and are available
for future UI work or programmatic use:

| Domain               | Actions                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| Enrollment ops       | `getBootcampEnrollments`, `getEnrollmentsWithProgress`, `adminAddEnrollment`, `adminUpdateEnrollmentStatus`, `adminApproveEnrollment`, `adminRejectEnrollment`, `adminRemoveEnrollment`, `searchUsersForEnrollment`, `adminGetStudentProgress` |
| Tasks                | `createBootcampTask`, `updateBootcampTask`, `deleteBootcampTask`, `getBootcampTasks`, `reviewTaskSubmission` |
| Sessions             | `createBootcampSession`, `updateBootcampSession`, `deleteBootcampSession`, `getBootcampSessions` |
| Mentorship notes     | `upsertBootcampMentorship`, `getBootcampMentorshipForUser`              |
| Help tickets         | `getBootcampHelpTickets`, `replyAndResolveHelpTicketAction`             |
| Exam review          | `getExamSubmissionsForMentor`, `reviewExamSubmission`                   |
| Analytics            | `getMentorStudentDetailedStats`                                         |

### 4.4 Boundary
- Cannot create, delete, archive, or change top-level metadata of a bootcamp.
- Cannot assign other mentors.
- Cannot export CSV.
- Cannot run the batch lifecycle action.
- Cannot view bootcamps they are not assigned to.

---

## 5. Member (student) panel

**Path:** [`app/account/member/bootcamps/`](../../app/account/member/bootcamps/)
**Role guard:** `requireRole('member')`
**Persona:** Learner — enrolls, consumes content, completes work.

### 5.1 List view (`page.js`)
Rendered by [`MemberBootcampsClient`](../../app/account/member/bootcamps/_components/MemberBootcampsClient.js)
(largest component in the feature — ~3000 lines). Six tabs:

| Tab            | Purpose                                                                                | Primary actions                                  |
| -------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Overview**     | Aggregated dashboard: enrolled tracks, upcoming sessions, recent activity, streak.   | `getMyEnrollments`, `getLearningActivity`        |
| **My Learning**  | Enrolled-only list with progress bars and continue-where-you-left-off links.         | `getMyEnrollments`, `getBootcampProgress`        |
| **Tasks**        | All assigned tasks across enrolled bootcamps with submission status.                  | `getMemberBootcampTasks`, `submitTaskAction`, `uploadTaskAttachmentAction` |
| **Sessions**     | Upcoming and past live sessions across enrolled bootcamps.                           | `getMemberBootcampSessions`                      |
| **Catalog**      | Browse all published bootcamps (`getMemberBootcamps`), enroll or request enrollment. | `enrollUser`, `cancelEnrollment`, `checkEnrollment` |
| **Leaderboard**  | Cross-bootcamp ranking.                                                              | `getBootcampsLeaderboardAction`                  |

### 5.2 Bootcamp landing (`[bootcampId]/page.js`)
Rendered by [`BootcampLearningClient`](../../app/account/member/bootcamps/[bootcampId]/_components/BootcampLearningClient.js)
(~4700 lines — the most feature-rich client in the codebase).

Contains the per-bootcamp learner workspace: curriculum tree, lesson access
state, per-bootcamp leaderboard, tasks, sessions, help tickets, mentorship
notes, and the practice problem set
([`MemberProblemSetClient`](../../app/account/member/bootcamps/_components/MemberProblemSetClient.js)).

Server actions consumed include:
- `getBootcampWithCurriculum`, `getBootcampProgress`
- `getBootcampLeaderboard`, `getBootcampMentors`
- `getMemberBootcampTasks`, `submitTaskAction`
- `getMemberBootcampSessions`
- `getMemberHelpTickets`, `submitHelpTicketAction`
- `getBootcampMentorshipForUser` (read-only)
- `togglePracticeProblemSolved`

### 5.3 Lesson player (`[bootcampId]/[lessonId]/page.js`)
The atomic learning unit. Plays one of three lesson types based on
`lessons.type`:

| Type         | UI surface                                  | Server actions                                 |
| ------------ | ------------------------------------------- | ---------------------------------------------- |
| **`video`**    | Video player (Drive proxy / YouTube / upload). | `touchLessonAccess`, `updateLessonProgress`, `updateWatchTimeDelta`, `recordLearningActivity`, `markLessonComplete`, `saveLessonNotes` |
| **`exam`**     | Timed/untimed quiz form.                       | `submitExamSubmission`, `getExamSubmission`    |
| **`practice`** | Solvable problem list.                         | `togglePracticeProblemSolved`                  |

Video playback for Drive-sourced lessons is gated by
[`app/api/video/[lessonId]/route.js`](../../app/api/video/[lessonId]/route.js),
which verifies enrollment before proxying bytes.

### 5.4 Boundary
- Can only see **published** bootcamps in the catalog.
- Can only access lesson content for bootcamps they are actively enrolled in.
- Cannot edit any curriculum, mentor assignment, or enrollment of other users.
- Exam scores and task reviews remain pending until a mentor grades them.

---

## 6. Guest (unauthenticated) surface

There is no `app/account/guest/bootcamps/` route — bootcamp browsing for
unauthenticated visitors happens on the public marketing pages, which call
`getMemberBootcamps()` directly. That action currently performs no auth check
(see [`bootcamps.md` §6.3](./bootcamps.md#63-getmemberbootcamps-has-no-auth-check-at-all--review-needed)),
which is consistent with the intent of exposing the public catalog.

Any attempt to enroll, view a lesson, or access an `/account/...` route
redirects to sign-in.

---

## 7. Quick capability matrix (per panel)

Pulled from §2 of [`bootcamps.md`](./bootcamps.md#2-roles--access-matrix) for
at-a-glance comparison.

| Capability                                | admin | executive | advisor | mentor* | member |
| ----------------------------------------- | :---: | :-------: | :-----: | :-----: | :----: |
| Create / delete bootcamp                  |  ✅   |    ✅     |   —     |   —     |   —    |
| Edit bootcamp metadata                    |  ✅   |    ✅     |   —     |   —     |   —    |
| Toggle `is_featured`                      |  ✅   |    ✅     |   —     |   —     |   —    |
| Edit curriculum (course/module/lesson)    |  ✅   |    ✅     |   —     |   ✅    |   —    |
| Generate exam / practice via AI           |  ✅   |    ✅     |   —     |   ✅    |   —    |
| Assign mentors                            |  ✅   |    ✅     |   —     |   —     |   —    |
| Manage enrollments (add / approve)        |  ✅   |    ✅     |   —     |   ✅    |   —    |
| Export enrollments CSV                    |  ✅   |    ✅     |   —     |   —     |   —    |
| Batch lifecycle (finish & start new)      |  ✅   |    ✅     |   —     |   —     |   —    |
| Tasks / sessions / mentorship notes       |  ✅   |    ✅     |   —     |   ✅    | read   |
| Help tickets                              | reply | reply     |   —     | reply   | submit |
| Review exam submissions                   |  ✅   |    ✅     |   —     |   ✅    | submit |
| Cohort analytics                          |   —   |     —     |   ✅    |   —     |   —    |
| Per-student deep dive                     |  ✅   |    ✅     |   ✅    |   ✅    |   —    |
| Self-enroll & cancel                      |   —   |     —     |   —     |   —     |   ✅   |
| Watch lesson / take exam / solve practice |   —   |     —     |   —     |   —     |   ✅   |
| Learning-activity heatmap                 |   —   |     —     |   —     |   —     |   ✅   |
| Leaderboard                               |   —   |     —     |   —     |   —     |   ✅   |

\* Mentor capabilities are scoped to bootcamps the mentor is explicitly
   assigned to (`bootcamp_mentors`).

---

## 8. Adding a new panel feature — checklist

1. **Choose the correct auth helper** in `bootcamp-actions.js`:
   `requireAdmin`, `requireAdminOrMentor`, `requireAdminOrBootcampMentor`, or
   `requireAnyRole([...])`. Don't inline `auth() → users → user_roles`.
2. **Revalidate all affected role paths** — admin **and** executive **and**
   member where relevant. Forgetting executive is the single most common bug
   in this module ([§6.1](./bootcamps.md#61-missing-revalidatepath-for-executive-routes--high-priority-bug)).
3. **Page guard with `requireRole`**, fetch with `safeFetch`, error UI via
   `BootcampErrorState`.
4. **Reuse shared constants** from `bootcampConfig.js` (status, sort, video
   source, formatters). Do not redefine.
5. **JSDoc the server action**: `@param`, `@returns`, inline note on which
   auth helper / which role can call it.
