/**
 * @file Members not-found page — shown when a resource within the
 *   members section cannot be located.
 *
 * @module ExecutiveMembersNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Members Not Found"
      description="The members page or resource you're looking for doesn't exist."
      dashboardHref="/account/executive"
    />
  );
}
