/**
 * @file Create User error boundary — catches runtime errors on the
 *   create user page and presents recovery options.
 *
 * @module AdminCreateUserError
 */

'use client';

import AccountError from '../../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Create User"
      dashboardHref="/account/admin"
    />
  );
}
