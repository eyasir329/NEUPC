/**
 * @file Mentor dashboard — landing page for mentors showing assigned
 *   mentees, upcoming sessions, active tasks, and quick links to
 *   mentorship management features.
 * Uses dynamic import for the heavy dashboard client to reduce
 * initial JS bundle size and enable code-splitting.
 *
 * @module MentorDashboardPage
 * @access mentor
 */

import dynamic from 'next/dynamic';
import { auth } from '@/app/_lib/auth';
import AccountLoading from '../_components/AccountLoading';

const MentorDashboardClient = dynamic(
  () => import('./_components/MentorDashboardClient'),
  { loading: () => <AccountLoading variant="dashboard" /> }
);

export const metadata = { title: 'Dashboard | Mentor | NEUPC' };

export default async function MentorDashboardPage() {
  const session = await auth();
  return <MentorDashboardClient session={session} />;
}
