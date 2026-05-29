/**
 * @file Inbox not-found view
 * @module InboxNotFound
 */

'use client';

import AccountNotFoundState from '@/app/account/_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Inbox Not Found"
      description="The inbox page or resource you're looking for doesn't exist."
      dashboardHref="/account/advisor"
    />
  );
}
