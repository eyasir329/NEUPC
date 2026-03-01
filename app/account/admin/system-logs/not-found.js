/**
 * @file System Logs not-found page — shown when a resource within the
 *   system logs section cannot be located.
 *
 * @module AdminSystemLogsNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="System Logs Not Found"
      description="The system logs page or resource you're looking for doesn't exist."
      dashboardHref="/account/admin"
    />
  );
}
