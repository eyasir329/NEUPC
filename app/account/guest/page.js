/**
 * @file Guest dashboard — entry point for guest users showing a welcome
 *   overview, membership application status, upcoming public events, and
 *   quick links to available guest features.
 * Uses dynamic import for the heavy dashboard client to reduce
 * initial JS bundle size and enable code-splitting.
 *
 * @module GuestDashboardPage
 * @access guest
 */

import dynamic from 'next/dynamic';
import { requireRole } from '@/app/_lib/auth-guard';
import {
  getPublishedEvents,
  getUserEventRegistrations,
  getActiveNotices,
} from '@/app/_lib/data-service';
import AccountLoading from '../_components/AccountLoading';

const GuestDashboardClient = dynamic(
  () => import('./_components/GuestDashboardClient'),
  { loading: () => <AccountLoading variant="dashboard" /> }
);

export const metadata = { title: 'Dashboard | Guest | NEUPC' };

export default async function GuestDashboardPage() {
  const { user } = await requireRole('guest', { checkIsActive: false });

  const [events, registrations, allNotices] = await Promise.all([
    getPublishedEvents().catch(() => []),
    getUserEventRegistrations(user.id).catch(() => []),
    getActiveNotices().catch(() => []),
  ]);

  const notices = allNotices.filter((n) => {
    if (!n.target_audience || n.target_audience.length === 0) return true;
    return n.target_audience.includes('all') || n.target_audience.includes('guest');
  });

  return (
    <GuestDashboardClient
      user={user}
      events={events}
      registrations={registrations}
      notices={notices}
    />
  );
}
