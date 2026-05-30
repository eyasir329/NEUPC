/**
 * @file Resources not-found page — shown when a resource within the
 *   resources section cannot be located.
 *
 * @module AdvisorResourcesNotFound
 */

'use client';

import AccountNotFoundState from '@/app/account/_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Resources Not Found"
      description="The resources page or resource you're looking for doesn't exist."
      dashboardHref="/account/advisor"
    />
  );
}
