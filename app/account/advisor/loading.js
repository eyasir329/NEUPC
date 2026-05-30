/**
 * @file Advisor Dashboard loading page — skeleton UI shown while the
 *   advisor dashboard page data resolves.
 *
 * @module AdvisorDashboardLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="dashboard" title="Advisor Dashboard" />;
}
