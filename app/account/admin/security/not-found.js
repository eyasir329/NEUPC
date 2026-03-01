/**
 * @file Security not-found page — shown when a resource within the
 *   security section cannot be located.
 *
 * @module AdminSecurityNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Security Not Found"
      description="The security page or resource you're looking for doesn't exist."
      dashboardHref="/account/admin"
    />
  );
}
