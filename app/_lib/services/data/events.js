/**
 * @file events data-access — split from the data-service module.
 */

import { supabase, supabaseAdmin } from '@/app/_lib/integrations/supabase';

// Get all events.
export async function getAllEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*, users!events_created_by_fkey(full_name)')
    .order('start_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get published events.
export async function getPublishedEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .in('status', ['upcoming', 'ongoing', 'completed'])
    .order('start_date', { ascending: false });
  if (error) throw new Error(error.message);

  // Resolve eligibility role_ids → display names
  const events = data || [];
  const roleIds = [
    ...new Set(
      events.map((e) => e.eligibility).filter((v) => v && v !== 'all')
    ),
  ];

  if (roleIds.length > 0) {
    const { data: roles } = await supabase
      .from('roles')
      .select('id, name')
      .in('id', roleIds);
    const roleMap = {};
    (roles || []).forEach((r) => {
      roleMap[r.id] =
        r.name.charAt(0).toUpperCase() + r.name.slice(1) + 's Only';
    });
    events.forEach((e) => {
      if (e.eligibility === 'all') {
        e.eligibility = 'Everyone';
      } else if (roleMap[e.eligibility]) {
        e.eligibility = roleMap[e.eligibility];
      }
    });
  } else {
    events.forEach((e) => {
      if (e.eligibility === 'all') e.eligibility = 'Everyone';
    });
  }

  return events;
}

// Get upcoming published events.
export async function getUpcomingEvents(limit = 10) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'upcoming')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

// Get recent published events that are NOT featured (for homepage).
export async function getRecentNonFeaturedEvents(limit = 3) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .in('status', ['upcoming', 'ongoing', 'completed'])
    .eq('is_featured', false)
    .order('start_date', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

// Get featured published events.
export async function getFeaturedEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_featured', true)
    .in('status', ['upcoming', 'ongoing', 'completed'])
    .order('start_date', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

// Get a published event by slug.
export async function getEventBySlug(slug) {
  const { data, error } = await supabase
    .from('events')
    .select('*, users!events_created_by_fkey(full_name, avatar_url)')
    .eq('slug', slug)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Get an event by ID.
export async function getEventById(id) {
  // Try by UUID first, then fall back to slug
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const query = supabase
    .from('events')
    .select('*, users!events_created_by_fkey(full_name, avatar_url)');

  const { data, error } = await (
    isUUID ? query.eq('id', id) : query.eq('slug', id)
  ).single();

  if (error) throw new Error(error.message);

  // Resolve eligibility role_id → display name (keep raw value for registration logic)
  data.eligibility_raw = data.eligibility;
  if (data.eligibility && data.eligibility !== 'all') {
    const { data: role } = await supabase
      .from('roles')
      .select('name')
      .eq('id', data.eligibility)
      .single();
    if (role) {
      data.eligibility =
        role.name.charAt(0).toUpperCase() + role.name.slice(1) + 's Only';
    }
  } else if (data.eligibility === 'all') {
    data.eligibility = 'Everyone';
  }

  return data;
}

// Get published events by category.
export async function getEventsByCategory(category) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('category', category)
    .neq('status', 'draft')
    .order('start_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Create a new event.
export async function createEvent(eventData) {
  const { data, error } = await supabase
    .from('events')
    .insert([eventData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update an event.
export async function updateEvent(id, updates) {
  const { data, error } = await supabase
    .from('events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Hard-delete an event.
export async function deleteEvent(id) {
  const { error } = await supabaseAdmin.from('events').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// Get events with registration/attendance stats.
export async function getEventsWithStats() {
  const [eventsRes, regsRes] = await Promise.all([
    supabaseAdmin
      .from('events')
      .select('*, users!events_created_by_fkey(full_name, avatar_url)')
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('event_registrations').select('event_id, status'),
  ]);

  if (eventsRes.error) throw new Error(eventsRes.error.message);

  const events = eventsRes.data || [];
  const regs = regsRes.data || [];

  const regCountByEvent = regs.reduce((acc, r) => {
    if (!acc[r.event_id])
      acc[r.event_id] = { total: 0, active: 0, attended: 0, confirmed: 0 };
    acc[r.event_id].total++;
    if (r.status !== 'cancelled') acc[r.event_id].active++;
    if (r.status === 'attended') acc[r.event_id].attended++;
    if (r.status === 'confirmed') acc[r.event_id].confirmed++;
    return acc;
  }, {});

  const enriched = events.map((e) => ({
    ...e,
    creatorName: e.users?.full_name ?? 'Unknown',
    creatorAvatar: e.users?.avatar_url ?? null,
    registrationCount: regCountByEvent[e.id]?.active ?? 0,
    attendedCount: regCountByEvent[e.id]?.attended ?? 0,
    confirmedCount: regCountByEvent[e.id]?.confirmed ?? 0,
  }));

  const activeRegs = regs.filter((r) => r.status !== 'cancelled');

  const stats = {
    total: events.length,
    draft: events.filter((e) => e.status === 'draft').length,
    upcoming: events.filter((e) => e.status === 'upcoming').length,
    ongoing: events.filter((e) => e.status === 'ongoing').length,
    completed: events.filter((e) => e.status === 'completed').length,
    cancelled: events.filter((e) => e.status === 'cancelled').length,
    featured: events.filter((e) => e.is_featured).length,
    totalRegistrations: activeRegs.length,
  };

  return { events: enriched, stats };
}

// Get registrations for an event.
export async function getEventRegistrations(eventId) {
  const { data, error } = await supabaseAdmin
    .from('event_registrations')
    .select('*, users(id, full_name, email, avatar_url)')
    .eq('event_id', eventId)
    .order('registered_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get all event registrations for a user (as leader AND as team member).
export async function getUserEventRegistrations(userId) {
  // 1) Registrations where the user is the leader / individual registrant
  const { data: leaderRegs, error: leaderErr } = await supabaseAdmin
    .from('event_registrations')
    .select(
      '*, events(id, title, slug, start_date, cover_image, category, status)'
    )
    .eq('user_id', userId)
    .order('registered_at', { ascending: false });
  if (leaderErr) throw new Error(leaderErr.message);

  // 2) Registrations where the user is a non-leader team member
  const { data: memberRegs, error: memberErr } = await supabaseAdmin
    .from('event_registrations')
    .select(
      '*, events(id, title, slug, start_date, cover_image, category, status)'
    )
    .contains('team_members', [userId])
    .neq('user_id', userId) // exclude rows already in leaderRegs
    .order('registered_at', { ascending: false });
  if (memberErr) throw new Error(memberErr.message);

  // Tag each registration with the user's role in it
  const tagged = [
    ...(leaderRegs ?? []).map((r) => ({ ...r, isTeamLeader: true })),
    ...(memberRegs ?? []).map((r) => ({ ...r, isTeamLeader: false })),
  ];

  // Sort combined results by registered_at descending
  tagged.sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at));

  return tagged;
}

// Get a single event registration.
export async function getEventRegistration(eventId, userId) {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// Register a user for an event.
export async function createEventRegistration(registrationData) {
  const { data, error } = await supabase
    .from('event_registrations')
    .insert([registrationData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update an event registration.
export async function updateEventRegistration(id, updates) {
  const { data, error } = await supabase
    .from('event_registrations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Cancel an event registration.
export async function cancelEventRegistration(eventId, userId) {
  const { data, error } = await supabase
    .from('event_registrations')
    .update({ status: 'cancelled' })
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Get organizers for an event.
export async function getEventOrganizers(eventId) {
  const { data, error } = await supabase
    .from('event_organizers')
    .select('*, users(id, full_name, email, avatar_url)')
    .eq('event_id', eventId);
  if (error) throw new Error(error.message);
  return data;
}

// Add an organizer to an event.
export async function addEventOrganizer(eventId, userId, role = null) {
  const { data, error } = await supabase
    .from('event_organizers')
    .insert([{ event_id: eventId, user_id: userId, role }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Remove an organizer from an event.
export async function removeEventOrganizer(eventId, userId) {
  const { error } = await supabase
    .from('event_organizers')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return { success: true };
}

// Get certificates issued for an event.
export async function getEventCertificates(eventId) {
  const { data, error } = await supabase
    .from('certificates')
    .select('*, users!certificates_recipient_id_fkey(id, full_name, email)')
    .eq('event_id', eventId)
    .order('issue_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get budget entries for an event.
export async function getBudgetEntriesByEvent(eventId) {
  const { data, error } = await supabase
    .from('budget_entries')
    .select('*, users!budget_entries_created_by_fkey(id, full_name)')
    .eq('event_id', eventId)
    .order('transaction_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get past published events.
export async function getPastEvents(limit = 10) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'completed')
    .lte('start_date', new Date().toISOString())
    .order('start_date', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

// Get registration count for an event.
export async function getEventRegistrationCount(eventId) {
  const { count, error } = await supabase
    .from('event_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);
  if (error) throw new Error(error.message);
  return count || 0;
}
