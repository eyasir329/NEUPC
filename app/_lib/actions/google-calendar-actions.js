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
  pushTodo,
  pushTodoTask,
  pushFeedItem,
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
  return {
    connected: !!conn,
    email: conn?.google_email || null,
    syncEnabled: conn ? conn.sync_enabled !== false : false,
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
export async function syncTodosToCalendarAction({ taskIds, feedIds } = {}) {
  const a = await memberId();
  if (a.error) return { error: a.error };

  const conn = await getConnection(a.userId);
  if (!conn) return { error: 'Google Calendar is not connected.' };

  let synced = 0;

  // ── To-do tasks: push BOTH a calendar event and a Google Task ──
  const ids = Array.isArray(taskIds)
    ? [...new Set(taskIds.filter(isValidUUID))]
    : [];
  if (ids.length > 0) {
    const { data: rows, error } = await supabaseAdmin
      .from('todos')
      .select(
        'id, title, notes, start_date, due_time, recurrence, gcal_event_id, gtask_id'
      )
      .eq('user_id', a.userId)
      .in('id', ids.slice(0, MAX_BACKFILL))
      .not('start_date', 'is', null);
    if (error) {
      console.error('syncTodosToCalendarAction (load tasks):', error.message);
      return { error: 'Failed to load tasks.' };
    }

    // Completed (non-recurring) todos, so the Google Task gets the right state.
    const { data: comps } = await supabaseAdmin
      .from('todo_completions')
      .select('todo_id')
      .eq('user_id', a.userId)
      .in(
        'todo_id',
        (rows || []).map((r) => r.id)
      );
    const completedSet = new Set((comps || []).map((c) => c.todo_id));

    for (const r of rows || []) {
      const eventId = await pushTodo(
        a.userId,
        {
          id: r.id,
          title: r.title,
          notes: r.notes,
          startKey: r.start_date,
          time: r.due_time || '',
          recurrence: r.recurrence || null,
          gcalEventId: r.gcal_event_id || null,
        },
        { force: true }
      );

      const taskId = await pushTodoTask(
        a.userId,
        {
          id: r.id,
          title: r.title,
          notes: r.notes,
          startKey: r.start_date,
          gtaskId: r.gtask_id || null,
          completed: !r.recurrence?.freq && completedSet.has(r.id),
        },
        { force: true }
      );

      const patch = {};
      if (eventId && eventId !== r.gcal_event_id) patch.gcal_event_id = eventId;
      if (taskId && taskId !== r.gtask_id) patch.gtask_id = taskId;
      if (Object.keys(patch).length) {
        await supabaseAdmin
          .from('todos')
          .update(patch)
          .eq('id', r.id)
          .eq('user_id', a.userId);
      }
      if (eventId || taskId) synced++;
    }
  }

  // ── Feed items: events / sessions / contests / deadlines (upsert by marker) ──
  const wantFeed = new Set(
    Array.isArray(feedIds) ? feedIds.filter((x) => typeof x === 'string') : []
  );
  if (wantFeed.size > 0) {
    // Re-derive the authoritative feed; only push the visible, selected ids.
    const feed = await getDailyActivityFeed(a.userId).catch(() => []);
    const toPush = feed
      .filter((it) => wantFeed.has(it.id))
      .slice(0, MAX_BACKFILL);
    for (const item of toPush) {
      const ok = await pushFeedItem(a.userId, item);
      if (ok) synced++;
    }
  }

  revalidatePath(PATH);
  return { success: true, synced };
}
