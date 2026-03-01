/**
 * @file Generate Certificates not-found page — shown when a resource within the
 *   generate certificates section cannot be located.
 *
 * @module ExecutiveGenerateCertificatesNotFound
 */

'use client';

import AccountNotFoundState from '../../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Generate Certificates Not Found"
      description="The generate certificates page or resource you're looking for doesn't exist."
      dashboardHref="/account/executive"
    />
  );
}
