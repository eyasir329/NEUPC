/**
 * @file Roles not-found page — shown when a resource within the
 *   roles section cannot be located.
 *
 * @module AdminRolesNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Roles Not Found"
      description="The roles page or resource you're looking for doesn't exist."
      dashboardHref="/account/admin"
    />
  );
}
