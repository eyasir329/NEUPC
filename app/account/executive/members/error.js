/**
 * @file Members error boundary — catches runtime errors on the
 *   members page and presents recovery options.
 *
 * @module ExecutiveMembersError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Members"
      dashboardHref="/account/executive"
    />
  );
}
