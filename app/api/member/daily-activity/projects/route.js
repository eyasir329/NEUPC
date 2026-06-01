/**
 * @file CRUD for member todo_lists (projects / space categories)
 * @module api/member/daily-activity/projects
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/_lib/auth/auth';
import { getUserByEmail } from '@/app/_lib/services/data-service';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';

function mapRowToProject(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.tone || '#2563eb',
    isFavorite: false,
    viewLayout: 'list',
    position: row.position,
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
      .from('todo_lists')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (error) throw error;

    return NextResponse.json((data || []).map(mapRowToProject));
  } catch (err) {
    console.error('[projects GET]', err);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, color } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Get max position
    const { data: existing } = await supabaseAdmin
      .from('todo_lists')
      .select('position')
      .eq('user_id', userId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPos = (existing?.[0]?.position ?? -1) + 1;

    const { data, error } = await supabaseAdmin
      .from('todo_lists')
      .insert({
        user_id: userId,
        name: name.trim(),
        tone: color || '#2563eb',
        position: nextPos,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(mapRowToProject(data), { status: 201 });
  } catch (err) {
    console.error('[projects POST]', err);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
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
      .from('todo_lists')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[projects DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
