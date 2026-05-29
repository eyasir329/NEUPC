/**
 * @file Applications error boundary — catches runtime errors on the
 *   applications page and presents recovery options.
 *
 * @module ExecutiveApplicationsError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Applications"
      dashboardHref="/account/executive"
    />
  );
}
