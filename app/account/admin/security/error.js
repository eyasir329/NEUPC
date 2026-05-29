/**
 * @file Security error boundary — catches runtime errors on the
 *   security page and presents recovery options.
 *
 * @module AdminSecurityError
 */

'use client';

import AccountError from '@/app/account/_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Security"
      dashboardHref="/account/admin"
    />
  );
}
