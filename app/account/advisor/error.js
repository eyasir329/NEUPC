/**
 * @file Advisor Dashboard error boundary — catches runtime errors on the
 *   advisor dashboard page and presents recovery options.
 *
 * @module AdvisorDashboardError
 */

'use client';

import AccountError from '../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Advisor Dashboard"
      dashboardHref="/account/advisor"
    />
  );
}
