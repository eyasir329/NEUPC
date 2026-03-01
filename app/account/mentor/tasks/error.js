/**
 * @file Tasks error boundary — catches runtime errors on the
 *   tasks page and presents recovery options.
 *
 * @module MentorTasksError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Tasks"
      dashboardHref="/account/mentor"
    />
  );
}
