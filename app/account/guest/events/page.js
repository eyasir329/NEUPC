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
    <div className="gp-page">
      <GuestEventsClient events={events} />
    </div>
  );
}
