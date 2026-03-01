/**
 * @file Create Notice error boundary — catches runtime errors on the
 *   create notice page and presents recovery options.
 *
 * @module ExecutiveCreateNoticeError
 */

'use client';

import AccountError from '../../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Create Notice"
      dashboardHref="/account/executive"
    />
  );
}
