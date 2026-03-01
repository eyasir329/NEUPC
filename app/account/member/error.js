/**
 * @file Member Dashboard error boundary — catches runtime errors on the
 *   member dashboard page and presents recovery options.
 *
 * @module MemberDashboardError
 */

'use client';

import AccountError from '../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Member Dashboard"
      dashboardHref="/account/member"
    />
  );
}
