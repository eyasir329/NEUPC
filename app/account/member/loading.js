/**
 * @file Member Dashboard loading page — skeleton UI shown while the
 *   member dashboard page data resolves.
 *
 * @module MemberDashboardLoading
 */

import AccountLoading from '../_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="dashboard" title="Member Dashboard" />;
}
