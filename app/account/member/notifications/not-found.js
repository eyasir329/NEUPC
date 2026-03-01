/**
 * @file Notifications not-found page — shown when a resource within the
 *   notifications section cannot be located.
 *
 * @module MemberNotificationsNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Notifications Not Found"
      description="The notifications page or resource you're looking for doesn't exist."
      dashboardHref="/account/member"
    />
  );
}
