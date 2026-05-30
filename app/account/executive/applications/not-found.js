/**
 * @file Applications not-found page — shown when a resource within the
 *   applications section cannot be located.
 *
 * @module ExecutiveApplicationsNotFound
 */

'use client';

import AccountNotFoundState from '@/app/account/_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Applications Not Found"
      description="The applications page or resource you're looking for doesn't exist."
      dashboardHref="/account/executive"
    />
  );
}
