/**
 * @file Mentor Dashboard error boundary — catches runtime errors on the
 *   mentor dashboard page and presents recovery options.
 *
 * @module MentorDashboardError
 */

'use client';

import AccountError from '../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Mentor Dashboard"
      dashboardHref="/account/mentor"
    />
  );
}
