/**
 * @file Discussions error boundary — catches runtime errors on the
 *   discussions page and presents recovery options.
 *
 * @module ExecutiveDiscussionsError
 */

'use client';

import AccountError from '@/app/account/_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Discussions"
      dashboardHref="/account/executive"
    />
  );
}
