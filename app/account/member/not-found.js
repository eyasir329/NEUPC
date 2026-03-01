/**
 * @file Member Dashboard not-found page — shown when a resource within the
 *   member dashboard section cannot be located.
 *
 * @module MemberDashboardNotFound
 */

'use client';

import AccountNotFoundState from '../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Member Dashboard Not Found"
      description="The member dashboard page or resource you're looking for doesn't exist."
      dashboardHref="/account/member"
    />
  );
}
