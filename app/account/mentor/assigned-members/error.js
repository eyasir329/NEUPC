/**
 * @file Assigned Members error boundary — catches runtime errors on the
 *   assigned members page and presents recovery options.
 *
 * @module MentorAssignedMembersError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Assigned Members"
      dashboardHref="/account/mentor"
    />
  );
}
