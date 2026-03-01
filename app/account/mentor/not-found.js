/**
 * @file Mentor Dashboard not-found page — shown when a resource within the
 *   mentor dashboard section cannot be located.
 *
 * @module MentorDashboardNotFound
 */

'use client';

import AccountNotFoundState from '../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Mentor Dashboard Not Found"
      description="The mentor dashboard page or resource you're looking for doesn't exist."
      dashboardHref="/account/mentor"
    />
  );
}
