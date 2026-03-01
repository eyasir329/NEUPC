/**
 * @file Membership Application error boundary — catches runtime errors on the
 *   membership application page and presents recovery options.
 *
 * @module GuestMembershipApplicationError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Membership Application"
      dashboardHref="/account/guest"
    />
  );
}
