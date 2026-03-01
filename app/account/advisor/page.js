/**
 * @file Advisor dashboard — displays high-level club metrics, pending
 *   approvals, recent activity, and quick-action links for the faculty
 *   advisor. Data is fetched server-side and delegated to the client shell.
 * Uses dynamic import for the heavy dashboard client to reduce
 * initial JS bundle size and enable code-splitting.
 *
 * @module AdvisorDashboardPage
 * @access advisor
 */

import dynamic from 'next/dynamic';
import { auth } from '@/app/_lib/auth';
import AccountLoading from '../_components/AccountLoading';

const AdvisorDashboardClient = dynamic(
  () => import('./_components/AdvisorDashboardClient'),
  { loading: () => <AccountLoading variant="dashboard" /> }
);

export const metadata = { title: 'Dashboard | Advisor | NEUPC' };

export default async function AdvisorDashboardPage() {
  const session = await auth();
  return <AdvisorDashboardClient session={session} />;
}
