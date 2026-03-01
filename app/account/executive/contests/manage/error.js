/**
 * @file Manage Contests error boundary — catches runtime errors on the
 *   manage contests page and presents recovery options.
 *
 * @module ExecutiveManageContestsError
 */

'use client';

import AccountError from '../../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Manage Contests"
      dashboardHref="/account/executive"
    />
  );
}
