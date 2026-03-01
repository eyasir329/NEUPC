/**
 * @file Reports error boundary — catches runtime errors on the
 *   reports page and presents recovery options.
 *
 * @module AdvisorReportsError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Reports"
      dashboardHref="/account/advisor"
    />
  );
}
