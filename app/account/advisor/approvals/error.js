/**
 * @file Approvals error boundary — catches runtime errors on the
 *   approvals page and presents recovery options.
 *
 * @module AdvisorApprovalsError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Approvals"
      dashboardHref="/account/advisor"
    />
  );
}
