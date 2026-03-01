/**
 * @file Settings error boundary — catches runtime errors on the
 *   settings page and presents recovery options.
 *
 * @module GuestSettingsError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Settings"
      dashboardHref="/account/guest"
    />
  );
}
