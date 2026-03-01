/**
 * @file Executive event management — fetches all events with registration
 *   counts, venue details, and scheduling info so executives can create,
 *   edit, feature, or archive club events.
 * @module ExecutiveManageEventsPage
 * @access executive | admin
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { supabaseAdmin } from '@/app/_lib/supabase';
import ManageEventsClient from './_components/ManageEventsClient';

export const metadata = { title: 'Event Management | Executive | NEUPC' };

export default async function ManageEventsPage() {
  const { user } = await requireRole(['executive', 'admin']);

  const { data: events } = await supabaseAdmin
    .from('events')
    .select(
      `id, title, slug, status, category, venue_type, start_date, end_date,
       cover_image, is_featured, registration_required, max_participants,
       created_at, updated_at,
       event_registrations(count)`
    )
    .order('created_at', { ascending: false })
    .limit(100);

  const serialized = (events || []).map((e) => ({
    ...e,
    registrationCount: e.event_registrations?.[0]?.count ?? 0,
    event_registrations: undefined,
  }));

  return <ManageEventsClient initialEvents={serialized} userId={user.id} />;
}
