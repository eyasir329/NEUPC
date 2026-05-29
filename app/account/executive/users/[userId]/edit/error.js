/**
 * @file Edit User error boundary — catches runtime errors on the
 *   edit user page and presents recovery options.
 *
 * @module ExecutiveEditUserError
 */

'use client';

import AccountError from '@/app/account/_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Edit User"
      dashboardHref="/account/executive"
    />
  );
}
