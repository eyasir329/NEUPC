/**
 * @file Sessions error boundary — catches runtime errors on the
 *   sessions page and presents recovery options.
 *
 * @module MentorSessionsError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Sessions"
      dashboardHref="/account/mentor"
    />
  );
}
