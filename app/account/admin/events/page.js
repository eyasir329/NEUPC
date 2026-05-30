/**
 * @file Admin event management page (server component).
 * Fetches events with stats for the event management UI.
 *
 * @module AdminEventsPage
 * @access admin
 */

import {
  getEventsWithStats,
  getEligibilityRoles,
} from '@/app/_lib/services/data-service';
import EventManagementClient from './_components/EventManagementClient';

export const metadata = { title: 'Events | Admin | NEUPC' };

export default async function AdminEventsPage() {
  const [{ events, stats }, roles] = await Promise.all([
    getEventsWithStats().catch(() => ({ events: [], stats: {} })),
    getEligibilityRoles().catch(() => []),
  ]);

  return (
    <EventManagementClient initialEvents={events} stats={stats} roles={roles} />
  );
}
