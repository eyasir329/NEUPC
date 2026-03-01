/**
 * @file Profile error boundary — catches runtime errors on the
 *   profile page and presents recovery options.
 *
 * @module GuestProfileError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Profile"
      dashboardHref="/account/guest"
    />
  );
}
