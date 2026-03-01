/**
 * @file Committee error boundary — catches runtime errors on the
 *   committee page and presents recovery options.
 *
 * @module AdvisorCommitteeError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Committee"
      dashboardHref="/account/advisor"
    />
  );
}
