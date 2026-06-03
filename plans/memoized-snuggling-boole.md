# Plan: Make Google Calendar push mirror the expand-mode calendar

## Context

On the member **Daily Activity** page, the expand-mode calendar
(`ExpandedCalendarModal`) renders todos, personal events, and read-only feed
items (contests, NEUPC events, bootcamp sessions, bootcamp task deadlines) with
a specific **timing**, **color**, and **title** for each item. The "Push" button
(`GoogleCalendarPanel` → `syncTodosToCalendarAction`) is supposed to mirror those
same items into the member's Google Calendar, but it currently diverges on every
dimension:

| Dimension | Expand mode | Current push |
|-----------|-------------|--------------|
| Titles | raw `title` | emoji-prefixed (`🏆 Contest:`, `📅 Deadline:`, …) |
| Colors | category/layer default color, item `colorId`, project color | priority color (todos) + fixed `FEED_COLOR_ID` (feed) |
| Bootcamp tasks | shown across the available→deadline window | auto-scheduled as 1h blocks in free time (`placeTasksInFreeTime`) |
| Other timing | start→end (or +duration/60) | mostly OK, some fallback mismatches |

Goal: the pushed Google events should match what the user sees in expand mode for
**timing/placement, color, title, and item set**. (Google supports only its 11
fixed `colorId`s and per-browser localStorage layer/sub-color customizations are
not available server-side, so colors map to the **nearest Google colorId** of the
expand-mode *default* category/project color — this is the closest achievable match.)

User decisions:
- **Bootcamp tasks** → match expand mode (push at available→deadline window; **remove** free-time scheduling).
- **Untimed todos** (date, no time) → push as a Google **all-day** event (keep current).

## Changes

All edits are in **`app/_lib/integrations/google-calendar.js`** plus a small change
to **`app/_lib/actions/google-calendar-actions.js`**.

### 1. New helper: `hexToColorId(hex)` — nearest Google colorId
- Reuse the existing single-source-of-truth `GCAL_COLOR_MAP`
  (`app/account/member/daily-activity/_components/utils.js:11`) — import it into the
  integration module (utils.js is a pure, non-`'use client'` module so this is safe).
- Nearest-match by Euclidean RGB distance; returns the colorId string. Used for
  category defaults, todo project colors, and personal `color_id` passthrough.
- Add `CATEGORY_COLOR` map mirroring `LAYER_DEFAULTS`
  (`utils.js:18`): `contest`/`event`/`session`/`task` hex defaults; todo default `#7c3aed`.

### 2. `feedItemToEvent(item)` — titles, colors, task placement
- **Titles**: drop the `FEED_PREFIX` emoji prefixes; `summary = item.title`.
- **Colors**: replace `FEED_COLOR_ID[item.category]` with
  `item.colorId ? hexToColorId(GCAL_COLOR_MAP[item.colorId]) : hexToColorId(CATEGORY_COLOR[item.category])`
  (item `colorId` already a Google id → pass through; default → nearest).
- **Bootcamp task** branch: rebuild to match expand mode instead of the
  `_scheduledStart/_scheduledEnd` template:
  - If the task spans multiple days (available date `!=` deadline date) → **all-day
    multi-day** event (`start: { date }`, `end: { date: addDayExclusive(deadlineDate) }`).
  - Else → **timed** event from `item.start` (available time) to `item.endTime`
    (deadline), falling back to `+durationMin`/`+60`.
  - Keep `extendedProperties` `FEED_MARKER` and `transparency: 'transparent'`.
- **contest / event / session**: keep timed; align end fallback to
  `endTime → +durationMin → +60` for consistency with expand mode. For NEUPC
  **events** that span multiple days (`endDate` present and after start date) →
  all-day multi-day event.

### 3. Remove free-time stacking from the push path
- In `pushFeedItem` (`google-calendar.js:657`): delete the special
  `item.category === 'task'` branch that calls `placeTasksInFreeTime`; tasks now
  flow through the normal single-event upsert (keyed by `FEED_MARKER` /
  `feed_gcal_events`), same as other feed items.
- In `syncTodosToCalendarAction`
  (`google-calendar-actions.js:177-197`): remove the `taskItems` vs `otherItems`
  split and the `pushTasksStacked` call — push **all** feed items via `pushFeedItem`.
- `placeTasksInFreeTime` / `pushTasksStacked` / `fetchBusy` / `computeFreeGaps` /
  `taskBlockMs` become unused. Leave them in place but mention as now-dead code
  (per repo guideline: don't delete pre-existing code beyond what our change
  orphans — these are orphaned by our change, so remove `pushTasksStacked` import
  in the action and the export if cleanly unused; note the rest for the user).

### 4. `pushTodoCalendarEvent` — color from expand-mode todo color
- Replace the priority-based `colorId` with the expand-mode todo color:
  `todo.colorId` (Google id) → else project color (hex) → else `#7c3aed` default,
  via `hexToColorId`.
- Requires the action to pass the todo's project color. In
  `syncTodosToCalendarAction`: add `project_id` to the `todos` select, load the
  member's projects (`projects` table `id,color`), and pass
  `projectColor` on the `todoPayload`. Keep priority **label** in the description
  (only the color source changes).
- Timed vs all-day logic in `pushTodoCalendarEvent` already matches expand mode
  (timed if `todo.time`, else all-day) — leave intact per user's untimed-todo choice.

### 5. `pushPersonalEvent` — color
- Already uses `row.color_id`; ensure the default (no color_id) maps to the
  expand-mode personal default via `hexToColorId(CATEGORY_COLOR... personal)`.
  Multi-day/all-day/timed handling already matches expand mode — leave intact.

## Critical files
- `app/_lib/integrations/google-calendar.js` — helper, `feedItemToEvent`,
  `pushFeedItem`, `pushTodoCalendarEvent`, `pushPersonalEvent`.
- `app/_lib/actions/google-calendar-actions.js` — `syncTodosToCalendarAction`
  (project colors, drop stacked-task split).
- `app/account/member/daily-activity/_components/utils.js` — source of
  `GCAL_COLOR_MAP` / `LAYER_DEFAULTS` (read/import only).

## Verification
1. Build with Node 20 (`nvm use v20.20.0`): `next build` must compile (the
   integration is server-only; check no `'use client'` import cycle from utils.js).
2. Manual end-to-end (the real check):
   - Open Daily Activity with a Google-connected account, go to a month that has a
     todo (timed + untimed), a personal event, a contest, a session, and a bootcamp
     task deadline. Note each item's color/time/title in expand mode.
   - Click **Push**. In Google Calendar confirm each event: raw title (no emoji
     prefix), color = nearest Google color to the expand-mode color, timing matches
     (timed items at their slot; untimed todo all-day; bootcamp task across its
     available→deadline window; multi-day events span correctly).
   - Click **Push** again → confirm **no duplicates** (upsert by marker / stored id).
3. Confirm a previously free-time-scheduled task is relocated to its deadline
   window on the next push (old marker events are replaced, not duplicated).
