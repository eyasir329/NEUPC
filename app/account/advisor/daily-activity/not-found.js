/**
 * @file Daily Activity not found page for Advisor.
 * @module AdvisorDailyActivityNotFound
 */

'use client';

import AccountNotFoundState from '@/app/account/_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Daily Activity Not Found"
      description="The daily activity page or resource you're looking for doesn't exist."
      dashboardHref="/account/advisor"
    />
  );
}
