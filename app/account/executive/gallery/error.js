/**
 * @file Gallery error boundary — catches runtime errors on the
 *   gallery page and presents recovery options.
 *
 * @module ExecutiveGalleryError
 */

'use client';

import AccountError from '@/app/account/_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Gallery"
      dashboardHref="/account/executive"
    />
  );
}
