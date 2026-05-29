/**
 * @file Events not-found view
 * @module EventsNotFound
 */

'use client';

import AccountNotFoundState from '@/app/account/_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Events Not Found"
      description="The events page or resource you're looking for doesn't exist."
      dashboardHref="/account/mentor"
    />
  );
}
