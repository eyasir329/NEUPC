/**
 * @file Certificates not-found page — shown when a resource within the
 *   certificates section cannot be located.
 *
 * @module MemberCertificatesNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Certificates Not Found"
      description="The certificates page or resource you're looking for doesn't exist."
      dashboardHref="/account/member"
    />
  );
}
