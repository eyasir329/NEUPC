/**
 * @file Budget error boundary — catches runtime errors on the
 *   budget page and presents recovery options.
 *
 * @module AdvisorBudgetError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Budget"
      dashboardHref="/account/advisor"
    />
  );
}
