/**
 * @file Gallery error boundary — catches runtime errors on the
 *   gallery page and presents recovery options.
 *
 * @module AdminGalleryError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Gallery"
      dashboardHref="/account/admin"
    />
  );
}
