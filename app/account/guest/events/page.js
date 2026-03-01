/**
 * @file Guest events browser — lists all published public events so
 *   guest users can discover and register for upcoming club activities.
 * @module GuestEventsPage
 * @access guest
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getPublishedEvents } from '@/app/_lib/data-service';
import GuestEventsClient from './_components/GuestEventsClient';

export const metadata = { title: 'Events | Guest | NEUPC' };

export default async function GuestEventsPage() {
  const [, events] = await Promise.all([
    requireRole('guest', { checkIsActive: false }),
    getPublishedEvents().catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <GuestEventsClient events={events} />
    </div>
  );
}
