/**
 * @file Inbox error boundary — catches runtime errors on the
 *   inbox page and presents recovery options.
 *
 * @module MentorInboxError
 */

'use client';

import AccountError from '@/app/account/_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Inbox"
      dashboardHref="/account/mentor"
    />
  );
}
