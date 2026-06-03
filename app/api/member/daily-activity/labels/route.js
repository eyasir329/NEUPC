/**
 * @file CRUD for member todo_labels
 * @module api/member/daily-activity/labels
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/_lib/auth/auth';
import { getUserByEmail } from '@/app/_lib/services/data-service';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';

function mapRowToLabel(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.color || '#9333ea',
    isFavorite: false,
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
      .from('todo_labels')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json((data || []).map(mapRowToLabel));
  } catch (err) {
    console.error('[labels GET]', err);
    return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 });
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

    const { data, error } = await supabaseAdmin
      .from('todo_labels')
      .insert({
        user_id: userId,
        name: name.trim(),
        color: color || '#64748b',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(mapRowToLabel(data), { status: 201 });
  } catch (err) {
    console.error('[labels POST]', err);
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 });
  }
}
