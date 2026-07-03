# Daily Activity

A per-member, Todoist-style planner backed by Supabase, with **two-way sync** to
Google Calendar/Tasks and Todoist. This document is the canonical reference for
how the feature is wired — read it before changing the sync layer.

## Tabs

| Tab        | Component        | Purpose                                                            |
| ---------- | ---------------- | ----------------------------------------------------------------- |
| Insights   | `InsightsView`   | Productivity standing (Karma/XP), focus tasks, completion heatmap. |
| Tasks      | `TasksView`      | List / kanban of editable todos + the **Todoist** panel.          |
| Calendar   | `CalendarView`   | Month grid + weekly agenda + the **Google Calendar** panel.       |

`MemberDailyActivityClient` is the root client. It loads everything, owns the
combined task list, and renders the three tabs plus the create/detail panes.

## Data model

Everything a member owns lives in a handful of tables (all scoped by `user_id`):

| Table              | Holds                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| `todos`            | Editable tasks. **Completion is the single boolean `completed` (+ `completed_at`).** |
| `todo_lists`       | Projects / space categories (the UI's `projectId`).                   |
| `todo_sections`    | Named sections inside a list.                                         |
| `todo_labels`      | Reusable label catalog (name + hex colour).                          |
| `personal_events`  | The member's own calendar events (editable, two-way with Google).    |

The `todos` row also carries per-integration mirror bookkeeping:

- Google: `gcal_event_id`, `gtask_id`, `gtask_subtask_ids`, `gcal_synced_at`
- Todoist: `todoist_task_id`, `todoist_subtask_ids`, `todoist_synced_at`

> **Deprecated:** the `todo_completions` table (per-occurrence completion) belongs
> to an older server-action implementation that has been removed. No code reads or
> writes it anymore — completion is single-source on `todos.completed`. The table
> is left in the DB but is dead; don't reintroduce reads of it.

### Recurring tasks

Recurrence lives on `todos.recurrence`; excluded dates on `todos.exclusions`;
per-occurrence subtask lists on `todos.occurrence_subtasks` (keyed by date).
Recurring todos have **no single done-state**, so they are never mirrored as
"completed" to Google/Todoist.

## The read-only feed

Alongside editable todos, the page shows a read-only activity feed assembled by
`getDailyActivityFeed()` in `app/_lib/services/data/member-todos.js`:

- Published events, internal + external contests
- Bootcamp sessions and weekly-task deadlines (scoped to enrolled bootcamps)
- The member's `personal_events`

Feed items are surfaced via `/api/member/daily-activity/feed` and are **never
editable** (except personal events, which round-trip through Google).

## Sync architecture

There are three layers; keep them consistent.

### 1. Local CRUD — REST routes (`app/api/member/daily-activity/*`)

The live client talks **only** to these routes (`fetch`), never to the server
actions. On every create/update/delete the `todos` route best-effort mirrors the
change outward to any connected integration (`mirrorTodoToGoogle`,
`mirrorTodoToTodoist`). Mirror failures never fail the CRUD response.

### 2. Push (local → remote)

- **Automatic:** when a todo is saved and the member has auto-mirror enabled, the
  `todos` route pushes it to Google and/or Todoist.
- **Manual:** each panel's **Push** button (`syncTodosToCalendarAction`,
  `pushTodosToTodoistAction`) force-pushes the visible month's items, upserting by
  the stored mirror id so re-pushing never duplicates.

### 3. Pull (remote → local)

- **Automatic, on page load:** `MemberDailyActivityClient` runs
  `pullAllCompletionsAction()` **once** after the initial load. It reconciles
  completion/changes from **both** Google and Todoist (pull-only, no new imports),
  then refreshes the list. This is the only auto-pull — the panels do **not**
  pull on mount.
- **On demand:** the header **Sync** button runs the same
  `pullAllCompletionsAction()` with a toast.
- **Full import:** each panel's **Pull** button imports *new* remote items too
  (`pullFromGoogleAction`, `pullFromTodoistAction`) — opt-in, because it can add
  many rows.

#### Last-write-wins guard

Both `pullGoogleCompletionsAction` and Todoist's `pullFromTodoist` skip applying a
remote change to a row whose `updated_at` is newer than its `*_synced_at` (plus a
60s grace). This keeps a fresh local edit from being clobbered by a slightly stale
remote read. **Google and Todoist now behave identically here.**

#### Todoist subtask completion

Todoist's active-tasks endpoint returns only non-completed tasks, so a mirrored
child's presence/absence is the completion source of truth. `mergeRemoteSubtasks`
in `todoist.js` applies this: present → open, missing → done, new remote child →
added. It preserves local-only (never-mirrored) subtasks.

## Connecting an integration (OAuth)

| Service | Connect route                              | Env vars                                              |
| ------- | ------------------------------------------ | ---------------------------------------------------- |
| Google  | `/api/integrations/google-calendar/connect`| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXTAUTH_URL` |
| Todoist | `/api/integrations/todoist/connect`        | `TODOIST_CLIENT_ID`, `TODOIST_CLIENT_SECRET`, `NEXTAUTH_URL` |

Each flow sets a short-lived CSRF state cookie, redirects to the provider, and
returns to the Daily Activity page with `?gcal=…` / `?todoist=…`, which the panel
surfaces as a toast and then strips from the URL. Tokens are stored per member in
`google_calendar_connections` / `todoist_connections`.

## File map

All paths are from the repo root.

```
app/account/member/daily-activity/
  page.js                       server entry (requireRole('member'))
  _components/
    MemberDailyActivityClient.js  root client; owns task list, auto-sync, Sync-all
    InsightsView / TasksView / CalendarView   the three tabs
    TaskDetailPane / GoogleItemPane           create/edit panes
    GoogleCalendarPanel / TodoistPanel        per-service connect + Push/Pull
    utils.js                                  shared helpers (dates, colours, karma)
app/api/member/daily-activity/*            REST CRUD + feed (what the client uses)
app/api/integrations/{google-calendar,todoist}/{connect,callback}   OAuth
app/_lib/actions/
  google-calendar-actions.js   Google status / push / pull
  todoist-actions.js           Todoist status / push / pull
  daily-activity-sync-actions.js  pullAllCompletionsAction — the unified façade
app/_lib/integrations/{google-calendar.js,todoist.js}   provider API clients
app/_lib/services/data/member-todos.js   read-only feed + Google status
```
