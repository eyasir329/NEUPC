/**
 * @file Events not-found page — shown when a resource within the
 *   events section cannot be located.
 *
 * @module MemberEventsNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Events Not Found"
      description="The events page or resource you're looking for doesn't exist."
      dashboardHref="/account/member"
    />
  );
}
