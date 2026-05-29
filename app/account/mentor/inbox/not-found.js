/**
 * @file Inbox not-found page — shown when a resource within the
 *   inbox section cannot be located.
 *
 * @module MentorInboxNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Inbox Not Found"
      description="The inbox page or resource you're looking for doesn't exist."
      dashboardHref="/account/mentor"
    />
  );
}
