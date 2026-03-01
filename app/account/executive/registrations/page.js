/**
 * @file Executive event registrations — lists all events with their
 *   registration counts so executives can monitor sign-up volumes and
 *   manage participant data for upcoming or past activities.
 * @module ExecutiveRegistrationsPage
 * @access executive | admin
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { supabaseAdmin } from '@/app/_lib/supabase';
import RegistrationsClient from './_components/RegistrationsClient';

export const metadata = { title: 'Registrations | Executive | NEUPC' };

export default async function RegistrationsPage() {
  await requireRole(['executive', 'admin']);

  const { data: events } = await supabaseAdmin
    .from('events')
    .select('id, title, slug, status, start_date, event_registrations(count)')
    .in('status', ['upcoming', 'ongoing', 'completed'])
    .order('start_date', { ascending: false })
    .limit(50);

  const eventsWithCount = (events || []).map((e) => ({
    ...e,
    registrationCount: e.event_registrations?.[0]?.count ?? 0,
    event_registrations: undefined,
  }));

  return <RegistrationsClient events={eventsWithCount} />;
}
