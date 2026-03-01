/**
 * @file Advisor events overview — fetches all events with participation
 *   stats and renders them for the advisor to review, approve, or
 *   provide feedback on upcoming club activities.
 * @module AdvisorEventsPage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getEventsWithStats } from '@/app/_lib/data-service';
import AdvisorEventsClient from './_components/AdvisorEventsClient';

export const metadata = { title: 'Events | Advisor | NEUPC' };

export default async function AdvisorEventsPage() {
  const [{ user }, eventsData] = await Promise.all([
    requireRole('advisor'),
    getEventsWithStats().catch(() => ({ events: [], stats: {} })),
  ]);

  const events = eventsData?.events || [];

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <AdvisorEventsClient events={events} advisorId={user.id} />
    </div>
  );
}
