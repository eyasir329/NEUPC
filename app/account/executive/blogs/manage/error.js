/**
 * @file Manage Blogs error boundary — catches runtime errors on the
 *   manage blogs page and presents recovery options.
 *
 * @module ExecutiveManageBlogsError
 */

'use client';

import AccountError from '../../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Manage Blogs"
      dashboardHref="/account/executive"
    />
  );
}
