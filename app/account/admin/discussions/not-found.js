/**
 * @file Discussions not-found page — shown when a resource within the
 *   discussions section cannot be located.
 *
 * @module AdminDiscussionsNotFound
 */

'use client';

import AccountNotFoundState from '@/app/account/_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Discussions Not Found"
      description="The discussions page or resource you're looking for doesn't exist."
      dashboardHref="/account/admin"
    />
  );
}
