/**
 * @file Reports not-found page — shown when a resource within the
 *   reports section cannot be located.
 *
 * @module ExecutiveReportsNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Reports Not Found"
      description="The reports page or resource you're looking for doesn't exist."
      dashboardHref="/account/executive"
    />
  );
}
