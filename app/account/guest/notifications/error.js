/**
 * @file Notifications error boundary — catches runtime errors on the
 *   notifications page and presents recovery options.
 *
 * @module GuestNotificationsError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Notifications"
      dashboardHref="/account/guest"
    />
  );
}
