/**
 * @file Edit User not-found page — shown when a resource within the
 *   edit user section cannot be located.
 *
 * @module AdminEditUserNotFound
 */

'use client';

import AccountNotFoundState from '../../../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Edit User Not Found"
      description="The edit user page or resource you're looking for doesn't exist."
      dashboardHref="/account/admin"
    />
  );
}
