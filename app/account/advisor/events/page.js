/**
 * @file Advisor events overview — fetches all events with participation
 *   stats and renders them for the advisor to review, approve, or
 *   provide feedback on upcoming club activities.
 * @module AdvisorEventsPage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { getEventsWithStats } from '@/app/_lib/services/data-service';
import AdvisorEventsClient from './_components/AdvisorEventsClient';

export const metadata = { title: 'Events | Advisor | NEUPC' };

export default async function AdvisorEventsPage() {
  const [{ user }, eventsData] = await Promise.all([
    requireRole('advisor'),
    getEventsWithStats().catch(() => ({ events: [], stats: {} })),
  ]);

  const events = eventsData?.events || [];

  return <AdvisorEventsClient events={events} advisorId={user.id} />;
}
