'use server';

import { revalidatePath } from 'next/cache';
import { requireActionAuth } from '@/app/_lib/auth/action-guard';
import { getCalendarClient } from '@/app/_lib/integrations/google-calendar';

const PATH = '/account/member/daily-activity';

async function memberId() {
  const auth = await requireActionAuth('member');
  if (auth.error) return { error: auth.error };
  return { userId: auth.user.id };
}

// ── Google Calendar Events ────────────────────────────────────────────────────

export async function createGoogleEventAction({ title, date, startTime, endTime, description, location }) {
  const a = await memberId();
  if (a.error) return { error: a.error };
  const client = await getCalendarClient(a.userId);
  if (!client) return { error: 'Google Calendar not connected.' };

  try {
    const allDay = !startTime;
    let body;
    if (allDay) {
      body = {
        summary: title,
        description: description || undefined,
        location: location || undefined,
        start: { date },
        end: { date },
      };
    } else {
      const start = `${date}T${startTime}:00`;
      const end = endTime ? `${date}T${endTime}:00` : `${date}T${startTime}:00`;
      body = {
        summary: title,
        description: description || undefined,
        location: location || undefined,
        start: { dateTime: start },
        end: { dateTime: end || start },
      };
    }
    const { data } = await client.calendar.events.insert({
      calendarId: client.calendarId,
      requestBody: body,
    });
    revalidatePath(PATH);
    return { success: true, eventId: data.id };
  } catch (err) {
    console.error('createGoogleEventAction:', err?.message);
    return { error: 'Failed to create event.' };
  }
}

export async function updateGoogleEventAction({ eventId, title, date, startTime, endTime, description, location }) {
  const a = await memberId();
  if (a.error) return { error: a.error };
  const client = await getCalendarClient(a.userId);
  if (!client) return { error: 'Google Calendar not connected.' };

  try {
    // Fetch existing to preserve fields we don't touch.
    const { data: existing } = await client.calendar.events.get({
      calendarId: client.calendarId,
      eventId,
    });

    const allDay = !startTime;
    const patch = {
      ...existing,
      summary: title,
      description: description || undefined,
      location: location || undefined,
    };
    if (allDay) {
      patch.start = { date };
      patch.end = { date };
    } else {
      patch.start = { dateTime: `${date}T${startTime}:00` };
      patch.end = { dateTime: endTime ? `${date}T${endTime}:00` : `${date}T${startTime}:00` };
    }

    await client.calendar.events.update({
      calendarId: client.calendarId,
      eventId,
      requestBody: patch,
    });
    revalidatePath(PATH);
    return { success: true };
  } catch (err) {
    console.error('updateGoogleEventAction:', err?.message);
    return { error: 'Failed to update event.' };
  }
}

export async function deleteGoogleEventAction({ eventId }) {
  const a = await memberId();
  if (a.error) return { error: a.error };
  const client = await getCalendarClient(a.userId);
  if (!client) return { error: 'Google Calendar not connected.' };

  try {
    await client.calendar.events.delete({
      calendarId: client.calendarId,
      eventId,
    });
    revalidatePath(PATH);
    return { success: true };
  } catch (err) {
    if (err?.code === 404 || err?.code === 410) return { success: true };
    console.error('deleteGoogleEventAction:', err?.message);
    return { error: 'Failed to delete event.' };
  }
}

// ── Google Tasks ──────────────────────────────────────────────────────────────

export async function createGoogleTaskAction({ title, date, notes }) {
  const a = await memberId();
  if (a.error) return { error: a.error };
  const client = await getCalendarClient(a.userId);
  if (!client) return { error: 'Google Calendar not connected.' };

  try {
    const body = {
      title,
      notes: notes || undefined,
      due: date ? `${date}T00:00:00.000Z` : undefined,
      status: 'needsAction',
    };
    const { data } = await client.tasks.tasks.insert({
      tasklist: '@default',
      requestBody: body,
    });
    revalidatePath(PATH);
    return { success: true, taskId: data.id };
  } catch (err) {
    console.error('createGoogleTaskAction:', err?.message);
    return { error: 'Failed to create task.' };
  }
}

export async function updateGoogleTaskAction({ taskId, title, date, notes }) {
  const a = await memberId();
  if (a.error) return { error: a.error };
  const client = await getCalendarClient(a.userId);
  if (!client) return { error: 'Google Calendar not connected.' };

  try {
    const body = {
      id: taskId,
      title,
      notes: notes || undefined,
      due: date ? `${date}T00:00:00.000Z` : undefined,
    };
    await client.tasks.tasks.update({
      tasklist: '@default',
      task: taskId,
      requestBody: body,
    });
    revalidatePath(PATH);
    return { success: true };
  } catch (err) {
    console.error('updateGoogleTaskAction:', err?.message);
    return { error: 'Failed to update task.' };
  }
}

export async function deleteGoogleTaskAction({ taskId }) {
  const a = await memberId();
  if (a.error) return { error: a.error };
  const client = await getCalendarClient(a.userId);
  if (!client) return { error: 'Google Calendar not connected.' };

  try {
    await client.tasks.tasks.delete({ tasklist: '@default', task: taskId });
    revalidatePath(PATH);
    return { success: true };
  } catch (err) {
    if (err?.code === 404 || err?.code === 410) return { success: true };
    console.error('deleteGoogleTaskAction:', err?.message);
    return { error: 'Failed to delete task.' };
  }
}

export async function toggleGoogleTaskAction({ taskId, completed }) {
  const a = await memberId();
  if (a.error) return { error: a.error };
  const client = await getCalendarClient(a.userId);
  if (!client) return { error: 'Google Calendar not connected.' };

  try {
    await client.tasks.tasks.patch({
      tasklist: '@default',
      task: taskId,
      requestBody: completed
        ? { status: 'completed' }
        : { status: 'needsAction', completed: null },
    });
    revalidatePath(PATH);
    return { success: true };
  } catch (err) {
    console.error('toggleGoogleTaskAction:', err?.message);
    return { error: 'Failed to update task.' };
  }
}
