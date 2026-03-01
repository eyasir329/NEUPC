/**
 * @file System Logs error boundary — catches runtime errors on the
 *   system logs page and presents recovery options.
 *
 * @module AdminSystemLogsError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="System Logs"
      dashboardHref="/account/admin"
    />
  );
}
