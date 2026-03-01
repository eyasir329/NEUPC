/**
 * @file Membership Application not-found page — shown when a resource within the
 *   membership application section cannot be located.
 *
 * @module GuestMembershipApplicationNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Membership Application Not Found"
      description="The membership application page or resource you're looking for doesn't exist."
      dashboardHref="/account/guest"
    />
  );
}
