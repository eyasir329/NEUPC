/**
 * @file member daily-activity (to-do) actions — CRUD for personal lists,
 *   tasks, and per-occurrence completions. All access is scoped to the
 *   authenticated member's user_id (never trusts client-supplied ids).
 * @module member-todo-actions
 */

'use server';

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { revalidatePath } from 'next/cache';
import { requireActionAuth } from '@/app/_lib/auth/action-guard';
import { sanitizeText, isValidUUID } from '@/app/_lib/utils/validation';

const PATH = '/account/member/daily-activity';
const TONES = [
  'blue',
  'emerald',
  'amber',
  'violet',
  'rose',
  'cyan',
  'pink',
  'gray',
];
const PRIORITIES = ['low', 'medium', 'high'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

/** Resolve the active member's user id, or an error object. */
async function memberId() {
  const auth = await requireActionAuth('member');
  if (auth.error) return { error: auth.error };
  return { userId: auth.user.id };
}

/** Confirm a list belongs to the user (so todos can't reference others' lists). */
async function ownsList(userId, listId) {
  const { data } = await supabaseAdmin
    .from('todo_lists')
    .select('id')
    .eq('id', listId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

/**
 * Mirror a saved task to the member's Google Calendar (best-effort). Inserts or
 * updates the linked event and persists its id; if the task lost its date, the
 * previously-mirrored event is removed. Never throws — calendar problems must
 * not fail the task save. No-op when the member hasn't connected a calendar.
 */
async function mirrorSavedTodo(userId, todoId, fields, existingEventId) {
  try {
    const { pushTodo, deleteTodoEvent } = await import(
      '@/app/_lib/integrations/google-calendar'
    );

    if (!fields.start_date) {
      if (existingEventId) {
        await deleteTodoEvent(userId, existingEventId);
        await supabaseAdmin
          .from('todos')
          .update({ gcal_event_id: null })
          .eq('id', todoId)
          .eq('user_id', userId);
      }
      return;
    }

    const eventId = await pushTodo(userId, {
      id: todoId,
      title: fields.title,
      notes: fields.notes,
      startKey: fields.start_date,
      time: fields.due_time || '',
      recurrence: fields.recurrence || null,
      gcalEventId: existingEventId || null,
    });
    if (eventId && eventId !== existingEventId) {
      await supabaseAdmin
        .from('todos')
        .update({ gcal_event_id: eventId })
        .eq('id', todoId)
        .eq('user_id', userId);
    }
  } catch (err) {
    console.error('mirrorSavedTodo:', err?.message);
  }
}

/** Validate + normalize a recurrence rule from the client. */
function normalizeRecurrence(rec) {
  if (!rec || typeof rec !== 'object') return null;
  if (!['daily', 'weekly', 'monthly'].includes(rec.freq)) return null;
  const out = {
    freq: rec.freq,
    interval: Math.min(99, Math.max(1, parseInt(rec.interval, 10) || 1)),
  };
  if (Array.isArray(rec.byWeekday)) {
    const wd = rec.byWeekday.filter(
      (n) => Number.isInteger(n) && n >= 0 && n <= 6
    );
    if (wd.length) out.byWeekday = wd;
  }
  if (rec.end && rec.end.type === 'count') {
    out.end = {
      type: 'count',
      count: Math.max(1, parseInt(rec.end.count, 10) || 1),
    };
  } else if (
    rec.end &&
    rec.end.type === 'until' &&
    DATE_RE.test(rec.end.untilKey || '')
  ) {
    out.end = { type: 'until', untilKey: rec.end.untilKey };
  } else {
    out.end = null;
  }
  return out;
}

// ── Lists ────────────────────────────────────────────────────────────────────
export async function createTodoListAction({ id, name, tone } = {}) {
  const a = await memberId();
  if (a.error) return { error: a.error };

  const cleanName = sanitizeText(name, 60);
  if (!cleanName) return { error: 'List name is required.' };
  if (id && !isValidUUID(id)) return { error: 'Invalid list id.' };
  const safeTone = TONES.includes(tone) ? tone : 'blue';

  const { data: last } = await supabaseAdmin
    .from('todo_lists')
    .select('position')
    .eq('user_id', a.userId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? -1) + 1;

  const row = { user_id: a.userId, name: cleanName, tone: safeTone, position };
  if (id) row.id = id;

  const { data, error } = await supabaseAdmin
    .from('todo_lists')
    .insert(row)
    .select('id, name, tone')
    .single();
  if (error) {
    console.error('createTodoListAction:', error);
    return { error: 'Failed to create list.' };
  }
  revalidatePath(PATH);
  return { success: true, list: data };
}

export async function renameTodoListAction({ id, name } = {}) {
  const a = await memberId();
  if (a.error) return { error: a.error };
  if (!isValidUUID(id)) return { error: 'Invalid list id.' };
  const cleanName = sanitizeText(name, 60);
  if (!cleanName) return { error: 'List name is required.' };

  const { error } = await supabaseAdmin
    .from('todo_lists')
    .update({ name: cleanName, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', a.userId);
  if (error) {
    console.error('renameTodoListAction:', error);
    return { error: 'Failed to rename list.' };
  }
  revalidatePath(PATH);
  return { success: true };
}

export async function deleteTodoListAction({ id } = {}) {
  const a = await memberId();
  if (a.error) return { error: a.error };
  if (!isValidUUID(id)) return { error: 'Invalid list id.' };

  // Tasks in this list have list_id set to null via the FK (on delete set null).
  const { error } = await supabaseAdmin
    .from('todo_lists')
    .delete()
    .eq('id', id)
    .eq('user_id', a.userId);
  if (error) {
    console.error('deleteTodoListAction:', error);
    return { error: 'Failed to delete list.' };
  }
  revalidatePath(PATH);
  return { success: true };
}

// ── Tasks ────────────────────────────────────────────────────────────────────
/**
 * Create or update a task. The client supplies a `crypto.randomUUID()` id for
 * new tasks, so this upserts: update the row when it exists for this user,
 * otherwise insert it with the supplied id.
 */
export async function saveTodoAction(draft = {}) {
  const a = await memberId();
  if (a.error) return { error: a.error };

  const title = sanitizeText(draft.title, 200);
  if (!title) return { error: 'Task title is required.' };

  const notes = draft.notes ? sanitizeText(draft.notes, 2000) : null;
  const priority = PRIORITIES.includes(draft.priority)
    ? draft.priority
    : 'medium';
  const start_date = DATE_RE.test(draft.startKey || '') ? draft.startKey : null;
  const due_time = TIME_RE.test(draft.time || '') ? draft.time : null;
  const recurrence = normalizeRecurrence(draft.recurrence);

  let list_id = null;
  if (
    draft.groupId &&
    isValidUUID(draft.groupId) &&
    (await ownsList(a.userId, draft.groupId))
  ) {
    list_id = draft.groupId;
  }

  const fields = {
    title,
    notes,
    priority,
    start_date,
    due_time,
    recurrence,
    list_id,
  };

  if (draft.id) {
    if (!isValidUUID(draft.id)) return { error: 'Invalid task id.' };

    const { data: updated, error: updErr } = await supabaseAdmin
      .from('todos')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', draft.id)
      .eq('user_id', a.userId)
      .select('id, gcal_event_id')
      .maybeSingle();
    if (updErr) {
      console.error('saveTodoAction (update):', updErr);
      return { error: 'Failed to save task.' };
    }
    if (updated) {
      await mirrorSavedTodo(a.userId, draft.id, fields, updated.gcal_event_id);
      revalidatePath(PATH);
      return { success: true, id: draft.id };
    }
    // No existing row → treat the supplied id as a new task.
    const { error: insErr } = await supabaseAdmin
      .from('todos')
      .insert({ id: draft.id, user_id: a.userId, ...fields });
    if (insErr) {
      console.error('saveTodoAction (insert w/ id):', insErr);
      return { error: 'Failed to create task.' };
    }
    await mirrorSavedTodo(a.userId, draft.id, fields, null);
    revalidatePath(PATH);
    return { success: true, id: draft.id };
  }

  const { data, error } = await supabaseAdmin
    .from('todos')
    .insert({ user_id: a.userId, ...fields })
    .select('id')
    .single();
  if (error) {
    console.error('saveTodoAction (insert):', error);
    return { error: 'Failed to create task.' };
  }
  await mirrorSavedTodo(a.userId, data.id, fields, null);
  revalidatePath(PATH);
  return { success: true, id: data.id };
}

export async function deleteTodoAction({ id } = {}) {
  const a = await memberId();
  if (a.error) return { error: a.error };
  if (!isValidUUID(id)) return { error: 'Invalid task id.' };

  // Capture the linked calendar event before the row (and its id) are gone.
  const { data: existing } = await supabaseAdmin
    .from('todos')
    .select('gcal_event_id')
    .eq('id', id)
    .eq('user_id', a.userId)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from('todos')
    .delete()
    .eq('id', id)
    .eq('user_id', a.userId);
  if (error) {
    console.error('deleteTodoAction:', error);
    return { error: 'Failed to delete task.' };
  }

  if (existing?.gcal_event_id) {
    try {
      const { deleteTodoEvent } = await import(
        '@/app/_lib/integrations/google-calendar'
      );
      await deleteTodoEvent(a.userId, existing.gcal_event_id);
    } catch (err) {
      console.error('deleteTodoAction (calendar):', err?.message);
    }
  }

  revalidatePath(PATH);
  return { success: true };
}

/** Exclude a single occurrence of a recurring task ("delete this occurrence"). */
export async function excludeOccurrenceAction({ id, occurrenceDate } = {}) {
  const a = await memberId();
  if (a.error) return { error: a.error };
  if (!isValidUUID(id)) return { error: 'Invalid task id.' };
  if (!DATE_RE.test(occurrenceDate || '')) return { error: 'Invalid date.' };

  const { data: row, error: selErr } = await supabaseAdmin
    .from('todos')
    .select('exclusions')
    .eq('id', id)
    .eq('user_id', a.userId)
    .maybeSingle();
  if (selErr || !row) return { error: 'Task not found.' };

  const exclusions = [...new Set([...(row.exclusions || []), occurrenceDate])];
  const { error } = await supabaseAdmin
    .from('todos')
    .update({ exclusions, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', a.userId);
  if (error) {
    console.error('excludeOccurrenceAction:', error);
    return { error: 'Failed to update task.' };
  }
  revalidatePath(PATH);
  return { success: true };
}

// ── Completions ──────────────────────────────────────────────────────────────
/** Toggle a task occurrence's completion for the given date. */
export async function toggleCompletionAction({ todoId, occurrenceDate } = {}) {
  const a = await memberId();
  if (a.error) return { error: a.error };
  if (!isValidUUID(todoId)) return { error: 'Invalid task id.' };
  if (!DATE_RE.test(occurrenceDate || '')) return { error: 'Invalid date.' };

  const { data: todo } = await supabaseAdmin
    .from('todos')
    .select('id')
    .eq('id', todoId)
    .eq('user_id', a.userId)
    .maybeSingle();
  if (!todo) return { error: 'Task not found.' };

  const { data: existing } = await supabaseAdmin
    .from('todo_completions')
    .select('todo_id')
    .eq('todo_id', todoId)
    .eq('occurrence_date', occurrenceDate)
    .maybeSingle();

  if (existing) {
    const { error } = await supabaseAdmin
      .from('todo_completions')
      .delete()
      .eq('todo_id', todoId)
      .eq('occurrence_date', occurrenceDate);
    if (error) {
      console.error('toggleCompletionAction (delete):', error);
      return { error: 'Failed to update.' };
    }
    revalidatePath(PATH);
    return { success: true, done: false };
  }

  const { error } = await supabaseAdmin.from('todo_completions').insert({
    todo_id: todoId,
    user_id: a.userId,
    occurrence_date: occurrenceDate,
  });
  if (error) {
    console.error('toggleCompletionAction (insert):', error);
    return { error: 'Failed to update.' };
  }
  revalidatePath(PATH);
  return { success: true, done: true };
}
