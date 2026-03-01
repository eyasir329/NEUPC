/**
 * @file Events error boundary — catches runtime errors on the
 *   events page and presents recovery options.
 *
 * @module GuestEventsError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Events"
      dashboardHref="/account/guest"
    />
  );
}
