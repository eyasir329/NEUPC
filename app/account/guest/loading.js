/**
 * @file Guest Dashboard loading page — skeleton UI shown while the
 *   guest dashboard page data resolves.
 *
 * @module GuestDashboardLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="dashboard" title="Guest Dashboard" />;
}
