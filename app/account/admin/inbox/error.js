/**
 * @file Notices error boundary — catches runtime errors on the
 *   notices page and presents recovery options.
 *
 * @module AdminNoticesError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Notices"
      dashboardHref="/account/admin"
    />
  );
}
