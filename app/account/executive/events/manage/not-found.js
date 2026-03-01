/**
 * @file Manage Events not-found page — shown when a resource within the
 *   manage events section cannot be located.
 *
 * @module ExecutiveManageEventsNotFound
 */

'use client';

import AccountNotFoundState from '../../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Manage Events Not Found"
      description="The manage events page or resource you're looking for doesn't exist."
      dashboardHref="/account/executive"
    />
  );
}
