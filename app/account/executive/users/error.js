/**
 * @file Users error boundary — catches runtime errors on the
 *   users page and presents recovery options.
 *
 * @module ExecutiveUsersError
 */

'use client';

import AccountError from '@/app/account/_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Users"
      dashboardHref="/account/executive"
    />
  );
}
