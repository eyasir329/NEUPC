/**
 * @file Blogs error boundary — catches runtime errors on the
 *   blogs page and presents recovery options.
 *
 * @module AdminBlogsError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Blogs"
      dashboardHref="/account/admin"
    />
  );
}
