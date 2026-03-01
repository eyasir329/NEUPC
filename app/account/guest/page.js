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
import { auth } from '@/app/_lib/auth';
import AccountLoading from '../_components/AccountLoading';

const GuestDashboardClient = dynamic(
  () => import('./_components/GuestDashboardClient'),
  { loading: () => <AccountLoading variant="dashboard" /> }
);

export const metadata = { title: 'Dashboard | Guest | NEUPC' };

export default async function GuestDashboardPage() {
  const session = await auth();
  return <GuestDashboardClient session={session} />;
}
