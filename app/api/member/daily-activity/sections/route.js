/**
 * @file CRUD for member todo_sections
 * @module api/member/daily-activity/sections
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/_lib/auth/auth';
import { getUserByEmail } from '@/app/_lib/services/data-service';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';

function mapRowToSection(row) {
  return {
    id: row.id,
    projectId: row.list_id,
    name: row.name,
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
      .from('todo_sections')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (error) throw error;

    return NextResponse.json((data || []).map(mapRowToSection));
  } catch (err) {
    console.error('[sections GET]', err);
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { projectId, name } = body;

    if (!name?.trim() || !projectId) {
      return NextResponse.json({ error: 'name and projectId are required' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('todo_sections')
      .select('position')
      .eq('list_id', projectId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPos = (existing?.[0]?.position ?? -1) + 1;

    const { data, error } = await supabaseAdmin
      .from('todo_sections')
      .insert({
        user_id: userId,
        list_id: projectId,
        name: name.trim(),
        position: nextPos,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(mapRowToSection(data), { status: 201 });
  } catch (err) {
    console.error('[sections POST]', err);
    return NextResponse.json({ error: 'Failed to create section' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, name } = body;

    if (!id || !name?.trim()) {
      return NextResponse.json({ error: 'id and name are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('todo_sections')
      .update({ name: name.trim() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(mapRowToSection(data));
  } catch (err) {
    console.error('[sections PATCH]', err);
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
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
      .from('todo_sections')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[sections DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 });
  }
}
