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
import {
  getConnection,
  deleteConnection,
  setSyncEnabled,
  pushTodo,
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
 * Push the member's existing dated tasks to their calendar (insert new, update
 * already-mirrored). Used once after connecting so the calendar starts in sync.
 */
export async function syncTodosToCalendarAction() {
  const a = await memberId();
  if (a.error) return { error: a.error };

  const conn = await getConnection(a.userId);
  if (!conn) return { error: 'Google Calendar is not connected.' };
  if (conn.sync_enabled === false) return { error: 'Task sync is turned off.' };

  const { data: rows, error } = await supabaseAdmin
    .from('todos')
    .select('id, title, notes, start_date, due_time, recurrence, gcal_event_id')
    .eq('user_id', a.userId)
    .not('start_date', 'is', null)
    .order('start_date', { ascending: false })
    .limit(MAX_BACKFILL);
  if (error) {
    console.error('syncTodosToCalendarAction (load):', error.message);
    return { error: 'Failed to load tasks.' };
  }

  let synced = 0;
  for (const r of rows || []) {
    const eventId = await pushTodo(a.userId, {
      id: r.id,
      title: r.title,
      notes: r.notes,
      startKey: r.start_date,
      time: r.due_time || '',
      recurrence: r.recurrence || null,
      gcalEventId: r.gcal_event_id || null,
    });
    if (eventId && eventId !== r.gcal_event_id) {
      await supabaseAdmin
        .from('todos')
        .update({ gcal_event_id: eventId })
        .eq('id', r.id)
        .eq('user_id', a.userId);
    }
    if (eventId) synced++;
  }

  revalidatePath(PATH);
  return { success: true, synced };
}
