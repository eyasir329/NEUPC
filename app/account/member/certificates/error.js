/**
 * @file Certificates error boundary — catches runtime errors on the
 *   certificates page and presents recovery options.
 *
 * @module MemberCertificatesError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Certificates"
      dashboardHref="/account/member"
    />
  );
}
