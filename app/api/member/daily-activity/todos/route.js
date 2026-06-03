/**
 * @file CRUD for member todos (Daily Activity tasks)
 * @module api/member/daily-activity/todos
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/_lib/auth/auth';
import { getUserByEmail } from '@/app/_lib/services/data-service';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';

const PRIORITY_TO_DB = { 1: 'high', 2: 'medium', 3: 'low', 4: 'low' };
const DB_TO_PRIORITY = { high: 1, medium: 2, low: 3 };

function mapRowToTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || row.notes || '',
    completed: row.completed ?? false,
    completedAt: row.completed_at || undefined,
    createdAt: row.created_at,
    dueDate: row.start_date || undefined,
    time: row.due_time || null,
    priority: DB_TO_PRIORITY[row.priority] || 3,
    projectId: row.list_id || undefined,
    sectionId: row.section_id || undefined,
    labels: row.labels || [],
    recurrence: row.recurrence || null,
    subtasks: row.subtasks || [],
    comments: row.comments || [],
    isArchived: false,
    location: row.location || null,
    url: row.url || null,
    colorId: row.color_id || null,
    status: row.status || 'confirmed',
    visibility: row.visibility || 'default',
    reminders: row.reminders || [],
    attendees: row.attendees || [],
  };
}

async function getAuthenticatedUserId() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await getUserByEmail(session.user.email);
  return user?.id || null;
}

/**
 * Best-effort mirror of a saved todo row to Google Calendar (coloured all-day
 * event) and Google Tasks (checkbox). Never throws — a Google failure must not
 * fail the CRUD response; no-op when the member hasn't connected Google.
 *
 * @param {string} userId
 * @param {object} row  - The full todos row just written.
 */
async function mirrorTodoToGoogle(userId, row) {
  try {
    const {
      getConnection, pushTodoTask, pushTodoCalendarEvent,
      syncChildSubtasks, deleteTodoTask, deleteTodoEvent,
    } = await import('@/app/_lib/integrations/google-calendar');

    const conn = await getConnection(userId);
    if (!conn) return;

    // If the todo lost its date, clean up any existing mirrors.
    if (!row.start_date) {
      const cleanPatch = {};
      if (row.gtask_id) { await deleteTodoTask(userId, row.gtask_id); cleanPatch.gtask_id = null; cleanPatch.gtask_subtask_ids = {}; }
      if (row.gcal_event_id) { await deleteTodoEvent(userId, row.gcal_event_id); cleanPatch.gcal_event_id = null; }
      if (Object.keys(cleanPatch).length) {
        await supabaseAdmin.from('todos').update(cleanPatch).eq('id', row.id).eq('user_id', userId);
      }
      return;
    }

    const todoPayload = {
      id: row.id,
      title: row.title,
      notes: row.notes || row.description || '',
      priority: row.priority,
      labels: row.labels || [],
      time: row.due_time || null,
      recurrence: row.recurrence || null,
      subtasks: row.subtasks || [],
      startKey: row.start_date,
      gcalEventId: row.gcal_event_id || null,
      gtaskId: row.gtask_id || null,
      completed: row.recurrence?.freq ? false : !!row.completed,
    };

    // Force-push when already mirrored so completion toggles always propagate.
    const alreadyMirrored = !!(row.gtask_id || row.gcal_event_id);

    // Push to Calendar for the coloured event on the grid.
    const calEventId = await pushTodoCalendarEvent(userId, todoPayload, { force: alreadyMirrored });
    // Push to Tasks for the checkbox.
    const taskId = await pushTodoTask(userId, todoPayload, { force: alreadyMirrored });

    if (!calEventId && !taskId) return;

    let subtaskMap = row.gtask_subtask_ids || {};
    if (taskId) subtaskMap = await syncChildSubtasks(userId, taskId, row.subtasks || [], row.gtask_subtask_ids || {});

    const patch = { gcal_synced_at: new Date().toISOString() };
    if (calEventId && calEventId !== row.gcal_event_id) patch.gcal_event_id = calEventId;
    if (taskId && taskId !== row.gtask_id) patch.gtask_id = taskId;
    patch.gtask_subtask_ids = subtaskMap;
    await supabaseAdmin.from('todos').update(patch).eq('id', row.id).eq('user_id', userId);
  } catch (err) {
    console.error('[todos mirrorTodoToGoogle]', err?.message);
  }
}

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tasks = (data || []).map(mapRowToTask);
    return NextResponse.json(tasks);
  } catch (err) {
    console.error('[todos GET]', err);
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, description, priority, dueDate, time, projectId, sectionId, labels, recurrence, subtasks, comments, location, url, colorId, status, visibility, reminders, attendees } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const row = {
      user_id: userId,
      title: title.trim(),
      description: description || null,
      notes: description || null,
      priority: PRIORITY_TO_DB[priority] || 'low',
      start_date: dueDate || null,
      due_time: time || null,
      list_id: projectId || null,
      section_id: sectionId || null,
      labels: labels || [],
      recurrence: recurrence || null,
      subtasks: subtasks || [],
      comments: comments || [],
      completed: false,
      location: location || null,
      url: url || null,
      color_id: colorId || null,
      status: status || 'confirmed',
      visibility: visibility || 'default',
      reminders: reminders || [],
      attendees: attendees || [],
    };

    const { data, error } = await supabaseAdmin
      .from('todos')
      .insert(row)
      .select()
      .single();

    if (error) throw error;

    await mirrorTodoToGoogle(userId, data);

    return NextResponse.json(mapRowToTask(data), { status: 201 });
  } catch (err) {
    console.error('[todos POST]', err);
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const updates = {};
    if (fields.title !== undefined) updates.title = fields.title;
    if (fields.description !== undefined) {
      updates.description = fields.description;
      updates.notes = fields.description;
    }
    if (fields.priority !== undefined) updates.priority = PRIORITY_TO_DB[fields.priority] || 'low';
    if (fields.dueDate !== undefined) updates.start_date = fields.dueDate || null;
    if (fields.time !== undefined) updates.due_time = fields.time || null;
    if (fields.projectId !== undefined) updates.list_id = fields.projectId || null;
    if (fields.sectionId !== undefined) updates.section_id = fields.sectionId || null;
    if (fields.labels !== undefined) updates.labels = fields.labels;
    if (fields.recurrence !== undefined) updates.recurrence = fields.recurrence;
    if (fields.subtasks !== undefined) updates.subtasks = fields.subtasks;
    if (fields.comments !== undefined) updates.comments = fields.comments;
    if (fields.location !== undefined) updates.location = fields.location || null;
    if (fields.url !== undefined) updates.url = fields.url || null;
    if (fields.colorId !== undefined) updates.color_id = fields.colorId || null;
    if (fields.status !== undefined) updates.status = fields.status;
    if (fields.visibility !== undefined) updates.visibility = fields.visibility;
    if (fields.reminders !== undefined) updates.reminders = fields.reminders;
    if (fields.attendees !== undefined) updates.attendees = fields.attendees;
    if (fields.completed !== undefined) {
      updates.completed = fields.completed;
      updates.completed_at = fields.completed ? new Date().toISOString() : null;
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('todos')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    await mirrorTodoToGoogle(userId, data);

    return NextResponse.json(mapRowToTask(data));
  } catch (err) {
    console.error('[todos PATCH]', err);
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    // Capture the Google mirrors before the row is gone.
    const { data: existing } = await supabaseAdmin
      .from('todos')
      .select('gtask_id, gcal_event_id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    // Best-effort: remove mirrored Google Task and Calendar event.
    if (existing?.gtask_id || existing?.gcal_event_id) {
      try {
        const { deleteTodoTask, deleteTodoEvent } = await import('@/app/_lib/integrations/google-calendar');
        if (existing.gtask_id) await deleteTodoTask(userId, existing.gtask_id);
        if (existing.gcal_event_id) await deleteTodoEvent(userId, existing.gcal_event_id);
      } catch (err) {
        console.error('[todos DELETE google]', err?.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[todos DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}
