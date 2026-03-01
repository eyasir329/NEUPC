/**
 * @file Admin dashboard page (server component).
 * Fetches session and renders the admin overview dashboard.
 * Uses dynamic import for the heavy dashboard client to reduce
 * initial JS bundle size and enable code-splitting.
 *
 * @module AdminDashboardPage
 * @access admin
 */

import dynamic from 'next/dynamic';
import { auth } from '@/app/_lib/auth';
import AccountLoading from '../_components/AccountLoading';

const AdminDashboardClient = dynamic(
  () => import('./_components/AdminDashboardClient'),
  { loading: () => <AccountLoading variant="dashboard" /> }
);

export const metadata = { title: 'Dashboard | Admin | NEUPC' };

export default async function AdminDashboardPage() {
  const session = await auth();

  return <AdminDashboardClient session={session} />;
}
