/**
 * @file CRUD for member personal calendar events.
 * @module api/member/daily-activity/personal-events
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/_lib/auth/auth';
import { getUserByEmail } from '@/app/_lib/services/data-service';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';

async function getAuthenticatedUserId() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await getUserByEmail(session.user.email);
  return user?.id || null;
}

function mapRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    location: row.location || null,
    url: row.url || null,
    date: row.event_date,
    endDate: row.end_date || null,
    startTime: row.start_time || null,
    endTime: row.end_time || null,
    recurrence: row.recurrence || null,
    colorId: row.color_id || null,
    status: row.status || 'confirmed',
    visibility: row.visibility || 'default',
    guestsCanSeeOtherGuests: row.guests_can_see_other_guests ?? true,
    reminders: row.reminders || [],
    attendees: row.attendees || [],
    conferenceLink: row.conference_link || null,
    gcalEventId: row.gcal_event_id || null,
    createdAt: row.created_at,
  };
}

function buildInsert(userId, body) {
  return {
    user_id: userId,
    title: (body.title || '').trim(),
    description: body.description || null,
    location: body.location || null,
    url: body.url || null,
    event_date: body.date,
    end_date: body.endDate || null,
    start_time: body.startTime || null,
    end_time: body.endTime || null,
    recurrence: body.recurrence || null,
    color_id: body.colorId || null,
    status: body.status || 'confirmed',
    visibility: body.visibility || 'default',
    guests_can_see_other_guests: body.guestsCanSeeOtherGuests ?? true,
    reminders: body.reminders || [],
    attendees: body.attendees || [],
  };
}

async function mirrorToGoogle(userId, row) {
  try {
    const { pushPersonalEvent } = await import('@/app/_lib/integrations/google-calendar');
    const result = await pushPersonalEvent(userId, row);
    if (!result) return;
    const patch = { gcal_synced_at: new Date().toISOString() };
    if (result.eventId && result.eventId !== row.gcal_event_id) patch.gcal_event_id = result.eventId;
    if (result.conferenceLink && result.conferenceLink !== row.conference_link) patch.conference_link = result.conferenceLink;
    if (Object.keys(patch).length > 1) {
      await supabaseAdmin.from('personal_events').update(patch).eq('id', row.id);
    }
  } catch (err) {
    console.error('[personal-events mirrorToGoogle]', err?.message);
  }
}

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('personal_events')
    .select('*')
    .eq('user_id', userId)
    .order('event_date', { ascending: true });

  if (error) {
    console.error('[personal-events GET]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json((data || []).map(mapRow));
}

export async function POST(request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.title?.trim() || !body.date) {
    return NextResponse.json({ error: 'Title and date are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('personal_events')
    .insert(buildInsert(userId, body))
    .select()
    .single();

  if (error) {
    console.error('[personal-events POST]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  mirrorToGoogle(userId, data); // fire-and-forget
  return NextResponse.json(mapRow(data), { status: 201 });
}

export async function PATCH(request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const updates = { updated_at: new Date().toISOString() };
  if (fields.title !== undefined) updates.title = fields.title;
  if (fields.description !== undefined) updates.description = fields.description || null;
  if (fields.location !== undefined) updates.location = fields.location || null;
  if (fields.url !== undefined) updates.url = fields.url || null;
  if (fields.date !== undefined) updates.event_date = fields.date;
  if (fields.endDate !== undefined) updates.end_date = fields.endDate || null;
  if (fields.startTime !== undefined) updates.start_time = fields.startTime || null;
  if (fields.endTime !== undefined) updates.end_time = fields.endTime || null;
  if (fields.recurrence !== undefined) updates.recurrence = fields.recurrence || null;
  if (fields.colorId !== undefined) updates.color_id = fields.colorId || null;
  if (fields.status !== undefined) updates.status = fields.status;
  if (fields.visibility !== undefined) updates.visibility = fields.visibility;
  if (fields.guestsCanSeeOtherGuests !== undefined) updates.guests_can_see_other_guests = fields.guestsCanSeeOtherGuests;
  if (fields.reminders !== undefined) updates.reminders = fields.reminders;
  if (fields.attendees !== undefined) updates.attendees = fields.attendees;

  const { data, error } = await supabaseAdmin
    .from('personal_events')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[personal-events PATCH]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  mirrorToGoogle(userId, data);
  return NextResponse.json(mapRow(data));
}

export async function DELETE(request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from('personal_events')
    .select('gcal_event_id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from('personal_events')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('[personal-events DELETE]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (existing?.gcal_event_id) {
    try {
      const { deletePersonalEvent } = await import('@/app/_lib/integrations/google-calendar');
      await deletePersonalEvent(userId, existing.gcal_event_id);
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({ success: true });
}
