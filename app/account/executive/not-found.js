/**
 * @file Executive Dashboard not-found page — shown when a resource within the
 *   executive dashboard section cannot be located.
 *
 * @module ExecutiveDashboardNotFound
 */

'use client';

import AccountNotFoundState from '../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Executive Dashboard Not Found"
      description="The executive dashboard page or resource you're looking for doesn't exist."
      dashboardHref="/account/executive"
    />
  );
}
