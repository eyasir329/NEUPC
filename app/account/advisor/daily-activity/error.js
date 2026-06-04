/**
 * @file Daily Activity error boundary for Advisor.
 * @module AdvisorDailyActivityError
 */

'use client';

import AccountError from '@/app/account/_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Daily Activity"
      dashboardHref="/account/advisor"
    />
  );
}
