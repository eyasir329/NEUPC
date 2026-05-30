/**
 * @file Inbox error boundary
 * @module InboxErrorBoundary
 */

'use client';

import AccountError from '@/app/account/_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Inbox"
      dashboardHref="/account/advisor"
    />
  );
}
