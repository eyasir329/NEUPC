/**
 * @file Create User not-found page — shown when a resource within the
 *   create user section cannot be located.
 *
 * @module AdminCreateUserNotFound
 */

'use client';

import AccountNotFoundState from '../../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Create User Not Found"
      description="The create user page or resource you're looking for doesn't exist."
      dashboardHref="/account/admin"
    />
  );
}
