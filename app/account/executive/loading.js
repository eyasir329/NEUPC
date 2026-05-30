/**
 * @file Executive Dashboard loading page — skeleton UI shown while the
 *   executive dashboard page data resolves.
 *
 * @module ExecutiveDashboardLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="dashboard" title="Executive Dashboard" />;
}
