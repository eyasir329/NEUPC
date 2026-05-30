/**
 * @file Guest events browser — lists all published public events so
 *   guest users can discover and register for upcoming club activities.
 * @module GuestEventsPage
 * @access guest
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { getPublishedEvents } from '@/app/_lib/services/data-service';
import GuestEventsClient from './_components/GuestEventsClient';

export const metadata = { title: 'Events | Guest | NEUPC' };

export default async function GuestEventsPage() {
  const [, events] = await Promise.all([
    requireRole('guest', { checkIsActive: false }),
    getPublishedEvents().catch(() => []),
  ]);

  return <GuestEventsClient events={events} />;
}
