/**
 * @file Google Calendar connection actions for the member Daily Activity page —
 *   read status, disconnect, toggle push sync, and back-fill existing tasks.
 *   All access is scoped to the authenticated member's user_id.
 * @module google-calendar-actions
 */

'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { requireActionAuth } from '@/app/_lib/auth/action-guard';
import { isValidUUID } from '@/app/_lib/utils/validation';
import { getDailyActivityFeed } from '@/app/_lib/services/data/member-todos';
import {
  getConnection,
  deleteConnection,
  setSyncEnabled,
  pushTodoTask,
  pushTodoCalendarEvent,
  syncChildSubtasks,
  pushFeedItem,
  deleteTodoEvent,
  readTaskCompletions,
  listGoogleTasks,
  pushPersonalEvent,
  pullPersonalEventsFromGoogle,
} from '@/app/_lib/integrations/google-calendar';

const PATH = '/account/member/daily-activity';
const MAX_BACKFILL = 200;

async function memberId() {
  const auth = await requireActionAuth('member');
  if (auth.error) return { error: auth.error };
  return { userId: auth.user.id };
}

/** Current connection state for the UI. */
export async function getGoogleCalendarStatusAction() {
  const a = await memberId();
  if (a.error) return { connected: false };
  const conn = await getConnection(a.userId);
  // Old tokens only have calendar.events; full import needs calendar scope.
  const needsReconnect = !!conn && !(conn.scope || '').includes('auth/calendar ') &&
    !(conn.scope || '').includes('auth/calendar\n') &&
    !(conn.scope || '').endsWith('auth/calendar');
  return {
    connected: !!conn,
    email: conn?.google_email || null,
    syncEnabled: conn ? conn.sync_enabled !== false : false,
    needsReconnect,
  };
}

/** Disconnect: drop the stored token and detach mirrored event ids. */
export async function disconnectGoogleCalendarAction() {
  const a = await memberId();
  if (a.error) return { error: a.error };
  try {
    await deleteConnection(a.userId);
  } catch (err) {
    console.error('disconnectGoogleCalendarAction:', err?.message);
    return { error: 'Failed to disconnect.' };
  }
  revalidatePath(PATH);
  return { success: true };
}

/** Turn task → calendar mirroring on or off without disconnecting. */
export async function setGoogleCalendarSyncEnabledAction(enabled) {
  const a = await memberId();
  if (a.error) return { error: a.error };
  try {
    await setSyncEnabled(a.userId, !!enabled);
  } catch (err) {
    console.error('setGoogleCalendarSyncEnabledAction:', err?.message);
    return { error: 'Failed to update sync setting.' };
  }
  revalidatePath(PATH);
  return { success: true };
}

/**
 * One-time push of the member's *currently-visible* calendar items for the
 * viewed month to Google Calendar — both their to-do tasks and the read-only
 * feed (events, sessions, contests, deadlines). The client passes the ids it
 * has selected/shown; the server re-derives the authoritative data (never
 * trusts client content) and pushes only those. Works regardless of the
 * auto-mirror toggle (force), so it's a pure on-demand sync.
 *
 * @param {object} [opts]
 * @param {string[]} [opts.taskIds]  - Visible to-do task ids (uuid) in the month.
 * @param {string[]} [opts.feedIds]  - Visible feed item ids (e.g. `event-123`).
 */
/**
 * Push the visible month's todos + NEUPC feed items to Google Tasks / Calendar.
 * Upsert semantics — existing mirrors are updated, never duplicated.
 *
 * @param {object} opts
 * @param {string[]} opts.taskIds        - UUID todo ids visible in the month.
 * @param {string[]} opts.feedIds        - Feed item ids visible in the month (no gcal-/gtask- prefixes).
 * @param {string}   opts.timeMin        - ISO — start of visible month (for personal events).
 * @param {string}   opts.timeMax        - ISO — end of visible month (for personal events).
 */
export async function syncTodosToCalendarAction({ taskIds = [], feedIds = [], timeMin, timeMax, colors = {} } = {}) {
  const a = await memberId();
  if (a.error) return { error: a.error };

  const conn = await getConnection(a.userId);
  if (!conn) return { error: 'Google Calendar is not connected.' };

  let synced = 0;

  // ── Month todos → Google Tasks (upsert) ──
  const ids = [...new Set(taskIds.filter(isValidUUID))];
  if (ids.length > 0) {
    const { data: rows, error } = await supabaseAdmin
      .from('todos')
      .select('id, title, notes, description, start_date, due_time, priority, labels, recurrence, gcal_event_id, gtask_id, subtasks, gtask_subtask_ids, completed, list_id, color_id')
      .eq('user_id', a.userId)
      .in('id', ids.slice(0, MAX_BACKFILL))
      .not('start_date', 'is', null);
    if (error) {
      console.error('syncTodosToCalendarAction (load tasks):', error.message);
      return { error: 'Failed to load tasks.' };
    }

    // Project colours so the calendar event matches the expand-mode todo colour
    // (per-item color_id wins, else the project's colour, else the todo default).
    const projectIds = [...new Set((rows || []).map((r) => r.list_id).filter(Boolean))];
    const projColorById = new Map();
    if (projectIds.length) {
      const { data: projs } = await supabaseAdmin
        .from('todo_lists')
        .select('id, tone')
        .eq('user_id', a.userId)
        .in('id', projectIds);
      for (const p of projs || []) projColorById.set(p.id, p.tone);
    }

    const { data: comps } = await supabaseAdmin
      .from('todo_completions')
      .select('todo_id')
      .eq('user_id', a.userId)
      .in('todo_id', (rows || []).map((r) => r.id));
    const completedSet = new Set((comps || []).map((c) => c.todo_id));

    for (const r of rows || []) {
      const isCompleted = !r.recurrence?.freq && (!!r.completed || completedSet.has(r.id));
      const todoPayload = {
        id: r.id,
        title: r.title,
        notes: r.notes || r.description,
        priority: r.priority,
        labels: r.labels || [],
        time: r.due_time || null,
        recurrence: r.recurrence || null,
        subtasks: r.subtasks || [],
        startKey: r.start_date,
        gcalEventId: r.gcal_event_id || null,
        gtaskId: r.gtask_id || null,
        completed: isCompleted,
        colorId: r.color_id || null,
        projectColor: projColorById.get(r.list_id) || null,
        // Colour resolved client-side from the expand-modal settings (wins).
        overrideColor: colors[r.id] || null,
      };

      // Push to Google Calendar (all-day event with priority colour) — this makes
      // the todo appear on the Calendar grid with the correct colour.
      const calEventId = await pushTodoCalendarEvent(a.userId, todoPayload, { force: true });

      // Push to Google Tasks (checkbox list) — for the Tasks app / side panel.
      const taskId = await pushTodoTask(a.userId, todoPayload, { force: true });

      let subtaskMap = r.gtask_subtask_ids || {};
      if (taskId) {
        subtaskMap = await syncChildSubtasks(a.userId, taskId, r.subtasks || [], r.gtask_subtask_ids || {});
      }

      const patch = {};
      if (calEventId && calEventId !== r.gcal_event_id) patch.gcal_event_id = calEventId;
      if (taskId && taskId !== r.gtask_id) patch.gtask_id = taskId;
      patch.gtask_subtask_ids = subtaskMap;
      if (Object.keys(patch).length) {
        await supabaseAdmin.from('todos').update(patch).eq('id', r.id).eq('user_id', a.userId);
      }
      if (calEventId || taskId) synced++;
    }
  }

  // ── Month feed items → Google Calendar (upsert by FEED_MARKER) ──
  const wantFeed = new Set(feedIds.filter((x) => typeof x === 'string'));
  if (wantFeed.size > 0) {
    const feed = await getDailyActivityFeed(a.userId).catch(() => []);
    const toPush = feed
      .filter((it) => wantFeed.has(it.id) && it.category !== 'gcal' && it.category !== 'gtask' && it.category !== 'personal')
      .slice(0, MAX_BACKFILL);

    // Every feed item — including bootcamp tasks — pushes as a single event that
    // mirrors how expand mode draws it (timing, colour, title).
    for (const item of toPush) {
      const ok = await pushFeedItem(a.userId, { ...item, overrideColor: colors[item.id] || null });
      if (ok) synced++;
    }
  }

  // ── Personal events for visible month → Google Calendar (upsert by gcal_event_id) ──
  if (timeMin && timeMax) {
    const minDate = timeMin.split('T')[0];
    const maxDate = timeMax.split('T')[0];
    const { data: personalRows } = await supabaseAdmin
      .from('personal_events')
      .select('*')
      .eq('user_id', a.userId)
      .gte('event_date', minDate)
      .lte('event_date', maxDate);

    for (const row of personalRows || []) {
      const result = await pushPersonalEvent(a.userId, row, { overrideColor: colors[`personal-${row.id}`] || null });
      if (result) {
        const patch = { gcal_synced_at: new Date().toISOString() };
        if (result.eventId && result.eventId !== row.gcal_event_id) patch.gcal_event_id = result.eventId;
        if (result.conferenceLink && result.conferenceLink !== row.conference_link) patch.conference_link = result.conferenceLink;
        if (Object.keys(patch).length > 1) {
          await supabaseAdmin
            .from('personal_events')
            .update(patch)
            .eq('id', row.id).eq('user_id', a.userId);
        }
        synced++;
      }
    }
  }

  revalidatePath(PATH);
  return { success: true, synced };
}

const PULL_LIMIT = 200;
// Skip applying a Google done-state to a todo that was changed locally within
// this window of the last sync — protects a fresh local toggle from being
// reverted by a slightly-stale Google read (last-write-wins, local-favoured).
const LWW_GRACE_MS = 60 * 1000;

/**
 * Two-way completion pull: read the done-state of the member's mirrored Google
 * Tasks and apply any change back to NEUPC. Non-recurring todos only (a single
 * unambiguous done-state). Uses `gcal_synced_at` vs `updated_at` as a
 * last-write-wins guard so a newer local edit isn't clobbered. Best-effort and
 * idempotent — safe to call on page open and after "Sync now".
 *
 * @returns {Promise<{updated:number}|{error:string}>}
 */
export async function pullGoogleCompletionsAction() {
  const a = await memberId();
  if (a.error) return { error: a.error };

  const conn = await getConnection(a.userId);
  if (!conn) return { updated: 0 };

  // Linked, non-recurring todos are the only ones with a 1:1 Google Task done-state.
  const { data: rows, error } = await supabaseAdmin
    .from('todos')
    .select('id, completed, recurrence, updated_at, gcal_synced_at, gtask_id')
    .eq('user_id', a.userId)
    .not('gtask_id', 'is', null)
    .limit(PULL_LIMIT);
  if (error) {
    console.error('pullGoogleCompletionsAction (load):', error.message);
    return { error: 'Failed to load tasks.' };
  }

  const linked = (rows || []).filter((r) => !r.recurrence?.freq && r.gtask_id);
  if (linked.length === 0) return { updated: 0 };

  const states = await readTaskCompletions(
    a.userId,
    linked.map((r) => ({ id: r.id, gtaskId: r.gtask_id }))
  );
  const byId = new Map(linked.map((r) => [r.id, r]));

  let updated = 0;
  for (const { todoId, completed } of states) {
    const row = byId.get(todoId);
    if (!row || !!row.completed === !!completed) continue; // already in sync

    // Last-write-wins: if the local row was edited more recently than our last
    // sync (plus grace), prefer the local state and skip Google's value.
    const localTime = row.updated_at ? new Date(row.updated_at).getTime() : 0;
    const syncTime = row.gcal_synced_at ? new Date(row.gcal_synced_at).getTime() : 0;
    if (localTime > syncTime + LWW_GRACE_MS) continue;

    const { error: updErr } = await supabaseAdmin
      .from('todos')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        gcal_synced_at: new Date().toISOString(),
      })
      .eq('id', todoId)
      .eq('user_id', a.userId);
    if (updErr) {
      console.error('pullGoogleCompletionsAction (update):', updErr.message);
      continue;
    }
    updated++;
  }

  if (updated > 0) revalidatePath(PATH);
  return { updated };
}

/**
 * Pull for the visible month:
 *   • Google Calendar events → returned as read-only gcal feed items (no DB write).
 *   • Google Tasks → upserted into the todos table as real editable todos
 *     (keyed by gtask_id so re-pulling never creates duplicates).
 *
 * @param {object} opts
 * @param {string} opts.timeMin  ISO string — start of visible month grid.
 * @param {string} opts.timeMax  ISO string — end of visible month grid.
 * @returns {{ imported: number, gcalItems: object[] }}
 */
export async function pullFromGoogleAction({ timeMin, timeMax }) {
  const a = await memberId();
  if (a.error) return { error: a.error };

  const conn = await getConnection(a.userId);
  if (!conn) return { error: 'Google Calendar is not connected.' };

  try {
    const gtaskItems = await listGoogleTasks(a.userId).catch(() => []);

    // ── Google Tasks → real todos (upsert by gtask_id) ──────────────────────
    const minDate = timeMin.split('T')[0];
    const maxDate = timeMax.split('T')[0];
    const monthGtasks = gtaskItems.filter((t) => {
      const d = t.start.split('T')[0];
      return d >= minDate && d <= maxDate;
    });

    // Load existing todos that already have a gtask_id so we skip them.
    const { data: existing } = await supabaseAdmin
      .from('todos')
      .select('gtask_id')
      .eq('user_id', a.userId)
      .not('gtask_id', 'is', null);
    const existingGtaskIds = new Set((existing || []).map((r) => r.gtask_id));

    let imported = 0;
    for (const t of monthGtasks) {
      const rawId = t.id.replace(/^gtask-/, '');
      if (existingGtaskIds.has(rawId)) continue; // already imported

      const dueDate = t.start.split('T')[0];
      await supabaseAdmin.from('todos').insert({
        user_id: a.userId,
        title: t.title,
        description: t.description || null,
        notes: t.description || null,
        priority: 'low',
        start_date: dueDate,
        due_time: null,
        labels: ['Google Tasks'],
        subtasks: [],
        comments: [],
        completed: false,
        gtask_id: rawId,
        gtask_subtask_ids: {},
        gcal_synced_at: new Date().toISOString(),
      });
      imported++;
    }

    // ── Google Calendar events (user's own, no NEUPC marker) → personal_events ──
    const rawGoogleEvents = await pullPersonalEventsFromGoogle(a.userId, timeMin, timeMax).catch(() => []);

    // Load existing personal_events — both those with a gcal_event_id (fast path)
    // and those without (to deduplicate by date+title when write-back previously failed).
    const { data: existingPersonal } = await supabaseAdmin
      .from('personal_events')
      .select('id, gcal_event_id, event_date, title')
      .eq('user_id', a.userId);
    const existingGcalIds = new Set(
      (existingPersonal || []).filter((r) => r.gcal_event_id).map((r) => r.gcal_event_id)
    );
    // Index rows without a gcal_event_id by "date|title" for content-based dedup.
    const existingByDateTitle = new Map(
      (existingPersonal || [])
        .filter((r) => !r.gcal_event_id)
        .map((r) => [`${r.event_date}|${(r.title || '').toLowerCase()}`, r.id])
    );

    let importedEvents = 0;
    for (const ev of rawGoogleEvents) {
      if (existingGcalIds.has(ev.id)) {
        // Update title/description/location in case it changed in Google.
        const eventDate = ev.start?.date || (ev.start?.dateTime || '').split('T')[0];
        if (!eventDate) continue;
        await supabaseAdmin
          .from('personal_events')
          .update({
            title: ev.summary || '(no title)',
            description: ev.description ? ev.description.replace(/<[^>]+>/g, '').trim() : null,
            location: ev.location || null,
            event_date: eventDate,
            gcal_synced_at: new Date().toISOString(),
          })
          .eq('gcal_event_id', ev.id)
          .eq('user_id', a.userId);
        continue;
      }

      const allDay = !ev.start?.dateTime;
      const eventDate = allDay ? ev.start.date : (ev.start.dateTime || '').split('T')[0];
      if (!eventDate) continue;

      let startTime = null, endTime = null;
      if (!allDay && ev.start?.dateTime) {
        startTime = ev.start.dateTime.split('T')[1]?.slice(0, 5) || null;
        endTime = ev.end?.dateTime ? ev.end.dateTime.split('T')[1]?.slice(0, 5) : null;
      }

      const title = ev.summary || '(no title)';
      const dateTitleKey = `${eventDate}|${title.toLowerCase()}`;

      // If a row exists with no gcal_event_id but same date+title, link it instead of inserting.
      const orphanRowId = existingByDateTitle.get(dateTitleKey);
      if (orphanRowId) {
        await supabaseAdmin
          .from('personal_events')
          .update({ gcal_event_id: ev.id, gcal_synced_at: new Date().toISOString() })
          .eq('id', orphanRowId)
          .eq('user_id', a.userId);
        existingGcalIds.add(ev.id);
        existingByDateTitle.delete(dateTitleKey);
        continue;
      }

      await supabaseAdmin.from('personal_events').insert({
        user_id: a.userId,
        title,
        description: ev.description ? ev.description.replace(/<[^>]+>/g, '').trim() : null,
        location: ev.location || null,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        gcal_event_id: ev.id,
        gcal_synced_at: new Date().toISOString(),
      });
      importedEvents++;
    }

    revalidatePath(PATH);
    return { imported, importedEvents };
  } catch (err) {
    console.error('pullFromGoogleAction:', err?.message);
    return { error: 'Failed to pull from Google.' };
  }
}
