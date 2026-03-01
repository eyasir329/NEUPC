/**
 * @file Manage Events error boundary — catches runtime errors on the
 *   manage events page and presents recovery options.
 *
 * @module ExecutiveManageEventsError
 */

'use client';

import AccountError from '../../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Manage Events"
      dashboardHref="/account/executive"
    />
  );
}
