/**
 * @file Executive dashboard — landing page for the executive committee.
 *   Provides an overview of club operations, pending tasks, and quick
 *   links to management features. Session is passed to the client shell.
 * Uses dynamic import for the heavy dashboard client to reduce
 * initial JS bundle size and enable code-splitting.
 *
 * @module ExecutiveDashboardPage
 * @access executive | admin
 */

import dynamic from 'next/dynamic';
import { auth } from '@/app/_lib/auth';
import AccountLoading from '../_components/AccountLoading';

const ExecutiveDashboardClient = dynamic(
  () => import('./_components/ExecutiveDashboardClient'),
  { loading: () => <AccountLoading variant="dashboard" /> }
);

export const metadata = { title: 'Dashboard | Executive | NEUPC' };

export default async function ExecutiveDashboardPage() {
  const session = await auth();
  return <ExecutiveDashboardClient session={session} />;
}
