/**
 * @file Notices not-found page — shown when a resource within the
 *   notices section cannot be located.
 *
 * @module AdminNoticesNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Notices Not Found"
      description="The notices page or resource you're looking for doesn't exist."
      dashboardHref="/account/admin"
    />
  );
}
