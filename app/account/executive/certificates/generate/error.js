/**
 * @file Generate Certificates error boundary — catches runtime errors on the
 *   generate certificates page and presents recovery options.
 *
 * @module ExecutiveGenerateCertificatesError
 */

'use client';

import AccountError from '../../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Generate Certificates"
      dashboardHref="/account/executive"
    />
  );
}
