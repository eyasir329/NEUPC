/**
 * @file Club Overview error boundary — catches runtime errors on the
 *   club overview page and presents recovery options.
 *
 * @module AdvisorClubOverviewError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Club Overview"
      dashboardHref="/account/advisor"
    />
  );
}
