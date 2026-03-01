/**
 * @file Approvals not-found page — shown when a resource within the
 *   approvals section cannot be located.
 *
 * @module AdvisorApprovalsNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Approvals Not Found"
      description="The approvals page or resource you're looking for doesn't exist."
      dashboardHref="/account/advisor"
    />
  );
}
