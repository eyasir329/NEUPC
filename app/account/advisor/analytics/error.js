/**
 * @file Analytics error boundary — catches runtime errors on the
 *   analytics page and presents recovery options.
 *
 * @module AdvisorAnalyticsError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Analytics"
      dashboardHref="/account/advisor"
    />
  );
}
