/**
 * @file Contact Submissions error boundary — catches runtime errors on the
 *   contact submissions page and presents recovery options.
 *
 * @module AdminContactSubmissionsError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Contact Submissions"
      dashboardHref="/account/admin"
    />
  );
}
