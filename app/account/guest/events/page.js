/**
 * @file Guest events browser — lists all published public events so
 *   guest users can discover and register for upcoming club activities.
 * @module GuestEventsPage
 * @access guest
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getPublishedEvents,
  getUserEventRegistrations,
} from '@/app/_lib/services/data-service';
import GuestEventsClient from './_components/GuestEventsClient';

export const metadata = { title: 'Events | Guest | NEUPC' };

export default async function GuestEventsPage() {
  const { user } = await requireRole('guest', { checkIsActive: false });

  const [events, myRegistrations] = await Promise.all([
    getPublishedEvents().catch(() => []),
    getUserEventRegistrations(user.id).catch(() => []),
  ]);

  return (
    <GuestEventsClient events={events} myRegistrations={myRegistrations} />
  );
}
