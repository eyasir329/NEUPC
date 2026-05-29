/**
 * @file Events not-found view
 * @module EventsNotFound
 */

'use client';

import AccountNotFoundState from '@/app/account/_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Event Management Not Found"
      description="The event management page or resource you're looking for doesn't exist."
      dashboardHref="/account/executive"
    />
  );
}
