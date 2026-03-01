/**
 * @file Sessions not-found page — shown when a resource within the
 *   sessions section cannot be located.
 *
 * @module MentorSessionsNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Sessions Not Found"
      description="The sessions page or resource you're looking for doesn't exist."
      dashboardHref="/account/mentor"
    />
  );
}
