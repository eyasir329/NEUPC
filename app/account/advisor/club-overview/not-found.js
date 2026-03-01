/**
 * @file Club Overview not-found page — shown when a resource within the
 *   club overview section cannot be located.
 *
 * @module AdvisorClubOverviewNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Club Overview Not Found"
      description="The club overview page or resource you're looking for doesn't exist."
      dashboardHref="/account/advisor"
    />
  );
}
