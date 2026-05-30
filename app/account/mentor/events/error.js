/**
 * @file Events error boundary
 * @module EventsErrorBoundary
 */

'use client';

import AccountError from '@/app/account/_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Events"
      dashboardHref="/account/mentor"
    />
  );
}
