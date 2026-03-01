/**
 * @file Guest Dashboard error boundary — catches runtime errors on the
 *   guest dashboard page and presents recovery options.
 *
 * @module GuestDashboardError
 */

'use client';

import AccountError from '../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Guest Dashboard"
      dashboardHref="/account/guest"
    />
  );
}
