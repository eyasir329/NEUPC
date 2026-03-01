/**
 * @file Admin Dashboard not-found page — shown when a resource within the
 *   admin dashboard section cannot be located.
 *
 * @module AdminDashboardNotFound
 */

'use client';

import AccountNotFoundState from '../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Admin Dashboard Not Found"
      description="The admin dashboard page or resource you're looking for doesn't exist."
      dashboardHref="/account/admin"
    />
  );
}
