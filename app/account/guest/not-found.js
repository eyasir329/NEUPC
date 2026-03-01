/**
 * @file Guest Dashboard not-found page — shown when a resource within the
 *   guest dashboard section cannot be located.
 *
 * @module GuestDashboardNotFound
 */

'use client';

import AccountNotFoundState from '../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Guest Dashboard Not Found"
      description="The guest dashboard page or resource you're looking for doesn't exist."
      dashboardHref="/account/guest"
    />
  );
}
