/**
 * @file Club Overview loading page — skeleton UI shown while the
 *   club overview page data resolves.
 *
 * @module AdvisorClubOverviewLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="dashboard" title="Club Overview" />;
}
