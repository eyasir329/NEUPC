/**
 * @file Executive registrations page — event registration lists,
 *   participant status management, and attendance tracking.
 * @module ExecutiveRegistrationsPage
 * @access executive | admin
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { getEventsWithStats } from '@/app/_lib/services/data-service';
import RegistrationsClient from './_components/RegistrationsClient';

export const metadata = { title: 'Registrations | Executive | NEUPC' };

export default async function ExecutiveRegistrationsPage() {
  await requireRole(['executive', 'admin']);
  const eventsData = await getEventsWithStats().catch(() => ({ events: [] }));
  const events = eventsData?.events || [];

  return <RegistrationsClient events={events} />;
}
