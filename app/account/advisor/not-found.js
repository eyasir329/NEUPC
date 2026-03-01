/**
 * @file Advisor Dashboard not-found page — shown when a resource within the
 *   advisor dashboard section cannot be located.
 *
 * @module AdvisorDashboardNotFound
 */

'use client';

import AccountNotFoundState from '../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Advisor Dashboard Not Found"
      description="The advisor dashboard page or resource you're looking for doesn't exist."
      dashboardHref="/account/advisor"
    />
  );
}
