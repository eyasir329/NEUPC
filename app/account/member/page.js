/**
 * @file Member dashboard — personalised landing page showing the
 *   member’s recent activity, upcoming events, contest progress, and
 *   quick links to key member features.
 * Uses dynamic import for the heavy dashboard client to reduce
 * initial JS bundle size and enable code-splitting.
 *
 * @module MemberDashboardPage
 * @access member
 */

import dynamic from 'next/dynamic';
import { auth } from '@/app/_lib/auth';
import AccountLoading from '../_components/AccountLoading';

const MemberDashboardClient = dynamic(
  () => import('./_components/MemberDashboardClient'),
  { loading: () => <AccountLoading variant="dashboard" /> }
);

export const metadata = { title: 'Dashboard | Member | NEUPC' };

export default async function MemberDashboardPage() {
  const session = await auth();
  return <MemberDashboardClient session={session} />;
}
