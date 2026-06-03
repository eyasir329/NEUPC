# Plan: Per-occurrence (unique) subtasks for recurring todos

## Context

In the member **Daily Activity** app, a recurring todo is stored as a **single
`todos` row** and expanded into many calendar occurrences on the fly
(`isTaskOnDate`, [utils.js](app/account/member/daily-activity/_components/utils.js)).
Subtasks live in one shared `todos.subtasks` jsonb array on that row, so checking
or editing a subtask on one date changes it for **every** occurrence — the bug the
user reported.

Goal: every task's subtasks are **unique per occurrence date**. The user chose
**fully independent per date** (each date has its own subtask list — titles,
add/remove, and completion can all diverge), and opening a task from a dateless
view defaults to **today's** occurrence. Non-recurring tasks already have a single
occurrence, so they keep working as-is.

## Approach

Store a per-date subtask list overlay on the row and thread the **occurrence
date** from the point of selection into the editor.

### 1. DB migration
New file `supabase/migrations/20260603600000_todos_occurrence_subtasks.sql`:
```sql
alter table public.todos
  add column if not exists occurrence_subtasks jsonb not null default '{}'::jsonb;
```
Shape: `{ "YYYY-MM-DD": [ { id, title, completed }, ... ] }`. The existing
`todos.subtasks` becomes the **template** (seeds a new occurrence's list); each
occurrence date gets its own independent copy under `occurrence_subtasks`.
Apply per the repo's migration gotcha (docker psql + record in
`schema_migrations`; never `db reset`) — see [[supabase-migration-apply-gotcha]].

### 2. API — [todos/route.js](app/api/member/daily-activity/todos/route.js)
- `mapRowToTask`: add `occurrenceSubtasks: row.occurrence_subtasks || {}`.
- `PATCH`: accept `occurrence_subtasks` (write `updates.occurrence_subtasks`).
- `POST`: default `occurrence_subtasks: {}`.

### 3. Occurrence-date threading (client)
- [MemberDailyActivityClient.js](app/account/member/daily-activity/_components/MemberDailyActivityClient.js):
  add `selectedOccurrenceDate` state; change `handleSelectTask(taskId, occurrenceDate)`
  (default `getTodayDateString()`); pass `occurrenceDate` to `TaskDetailPane`.
- Pass the real occurrence date at the calendar call sites:
  [CalendarView.js](app/account/member/daily-activity/_components/CalendarView.js)
  day/week cell clicks → the cell's date; `ExpandedCalendarModal` `openTask` → the
  day being rendered (day/week column date).
  [TasksView.js](app/account/member/daily-activity/_components/TasksView.js) and other
  dateless call sites → omit (defaults to today).

### 4. Editor — [TaskDetailPane.js](app/account/member/daily-activity/_components/TaskDetailPane.js)
- Accept `occurrenceDate` prop. Define `isRecurring = !!task.recurrence?.freq`.
- **Recurring:** the subtask UI binds to the occurrence's list:
  `effective = occurrenceSubtasks[occurrenceDate] ?? deepCopy(template subtasks, completed:false)`.
  `addSubtask`/`toggleSubtask`/`deleteSubtask` mutate **only** that date's list in a
  local `occurrenceSubtasks` draft. On Save, PATCH sends `occurrence_subtasks`
  (full map). The base `subtasks` template is only edited when the user explicitly
  edits the "template" (optional; default: leave template untouched on occurrence edits).
- **Non-recurring:** unchanged — keep editing `subtasks` directly.

### 5. Per-occurrence display
Anywhere subtask progress is shown for a dated occurrence (calendar cards in
CalendarView/ExpandedCalendarModal, TaskDetailPane header counts at
[TaskDetailPane.js:516](app/account/member/daily-activity/_components/TaskDetailPane.js#L516)),
resolve the list for that date via a shared helper
`subtasksForDate(task, dateStr)` (new, in utils.js): returns
`occurrenceSubtasks[dateStr]` for recurring (else the reset template), or
`task.subtasks` for non-recurring.

### 6. Google sync (consistency)
When mirroring a recurring todo (pushed as a single Google Task due on the next
occurrence — [google-calendar-actions.js](app/_lib/actions/google-calendar-actions.js),
[todos/route.js](app/api/member/daily-activity/todos/route.js)),
pass that occurrence's list via `subtasksForDate(task, nextOccurrence)` to
`syncChildSubtasks` / the calendar event description, instead of the raw template.

## Critical files
- `supabase/migrations/20260603600000_todos_occurrence_subtasks.sql` (new)
- `app/api/member/daily-activity/todos/route.js`
- `app/account/member/daily-activity/_components/MemberDailyActivityClient.js`
- `app/account/member/daily-activity/_components/TaskDetailPane.js`
- `app/account/member/daily-activity/_components/CalendarView.js`, `ExpandedCalendarModal.js`, `TasksView.js`
- `app/account/member/daily-activity/_components/utils.js` (`subtasksForDate` helper)
- `app/_lib/actions/google-calendar-actions.js` (recurring subtask push)

## Verification
1. Apply migration; `next build` (Node 20 — see [[build-needs-node-20]]) compiles.
2. Create a **recurring** task with 2 subtasks. On the calendar:
   - Open it on **date A**, check subtask 1, add a new subtask, Save.
   - Open the same task on **date B** → its subtasks are the **template** (none
     checked, no extra) — date A's changes do **not** appear. Edit B independently.
   - Reopen date A → its own state persists. Confirm progress counts on each day's
     card reflect that day only.
3. **Non-recurring** task with subtasks → behaves exactly as before (single list).
4. Open a recurring task from the **Tasks list** (dateless) → edits today's occurrence.
5. With Google connected, Push → the recurring task's Google child-tasks match the
   pushed occurrence's list (no cross-date bleed).
