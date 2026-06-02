/**
 * @file Daily Activity error boundary — catches runtime errors on the
 *   daily activity page and presents recovery options.
 *
 * @module MemberDailyActivityError
 */

'use client';

import AccountError from '@/app/account/_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Daily Activity"
      dashboardHref="/account/member"
    />
  );
}
