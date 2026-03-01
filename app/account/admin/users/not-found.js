/**
 * @file Users not-found page — shown when a resource within the
 *   users section cannot be located.
 *
 * @module AdminUsersNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Users Not Found"
      description="The users page or resource you're looking for doesn't exist."
      dashboardHref="/account/admin"
    />
  );
}
