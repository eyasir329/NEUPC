/**
 * @file Manage Gallery error boundary — catches runtime errors on the
 *   manage gallery page and presents recovery options.
 *
 * @module ExecutiveManageGalleryError
 */

'use client';

import AccountError from '../../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Manage Gallery"
      dashboardHref="/account/executive"
    />
  );
}
