'use server';

import { supabaseAdmin } from './supabase';
import { revalidatePath } from 'next/cache';

/** Register the current user for an event. */
export async function registerForEventAction(eventId, userId) {
  if (!eventId || !userId) return { error: 'Missing event or user ID.' };

  // Check event exists, is open and has capacity
  const { data: event, error: evErr } = await supabaseAdmin
    .from('events')
    .select(
      'id, title, status, registration_required, registration_deadline, max_participants'
    )
    .eq('id', eventId)
    .single();

  if (evErr || !event) return { error: 'Event not found.' };
  if (!['upcoming', 'ongoing'].includes(event.status))
    return { error: 'Registration is closed for this event.' };
  if (
    event.registration_deadline &&
    new Date(event.registration_deadline) < new Date()
  ) {
    return { error: 'Registration deadline has passed.' };
  }

  // Check if already registered
  const { data: existing } = await supabaseAdmin
    .from('event_registrations')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'cancelled') {
      // Re-activate
      const { error: reErr } = await supabaseAdmin
        .from('event_registrations')
        .update({
          status: 'registered',
          registered_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (reErr) return { error: reErr.message };
      revalidatePath('/account/member/events');
      return { success: true };
    }
    return { error: 'You are already registered for this event.' };
  }

  // Check capacity
  if (event.max_participants) {
    const { count } = await supabaseAdmin
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .neq('status', 'cancelled');
    if (count >= event.max_participants)
      return { error: 'This event is fully booked.' };
  }

  const { error: insErr } = await supabaseAdmin
    .from('event_registrations')
    .insert({
      event_id: eventId,
      user_id: userId,
      status: 'registered',
      registered_at: new Date().toISOString(),
    });

  if (insErr) return { error: insErr.message };
  revalidatePath('/account/member/events');
  return { success: true };
}

/** Cancel a user's registration for an event. */
export async function cancelEventRegistrationAction(eventId, userId) {
  if (!eventId || !userId) return { error: 'Missing event or user ID.' };

  const { error } = await supabaseAdmin
    .from('event_registrations')
    .update({ status: 'cancelled' })
    .eq('event_id', eventId)
    .eq('user_id', userId);

  if (error) return { error: error.message };
  revalidatePath('/account/member/events');
  return { success: true };
}
