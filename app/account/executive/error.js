/**
 * @file Executive Dashboard error boundary — catches runtime errors on the
 *   executive dashboard page and presents recovery options.
 *
 * @module ExecutiveDashboardError
 */

'use client';

import AccountError from '../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Executive Dashboard"
      dashboardHref="/account/executive"
    />
  );
}
