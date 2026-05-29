/**
 * @file Analytics not-found page — shown when a resource within the
 *   analytics section cannot be located.
 *
 * @module AdvisorAnalyticsNotFound
 */

'use client';

import AccountNotFoundState from '@/app/account/_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Analytics Not Found"
      description="The analytics page or resource you're looking for doesn't exist."
      dashboardHref="/account/advisor"
    />
  );
}
