/**
 * @file Edit User error boundary — catches runtime errors on the
 *   edit user page and presents recovery options.
 *
 * @module AdminEditUserError
 */

'use client';

import AccountError from '../../../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Edit User"
      dashboardHref="/account/admin"
    />
  );
}
