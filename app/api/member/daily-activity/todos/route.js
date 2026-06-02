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
  };
}

async function getAuthenticatedUserId() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await getUserByEmail(session.user.email);
  return user?.id || null;
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
    const { title, description, priority, dueDate, time, projectId, sectionId, labels, recurrence, subtasks, comments } = body;

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
    };

    const { data, error } = await supabaseAdmin
      .from('todos')
      .insert(row)
      .select()
      .single();

    if (error) throw error;

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

    const { error } = await supabaseAdmin
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[todos DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}
