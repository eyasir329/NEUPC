/**
 * @file Contact Submissions not-found page — shown when a resource within the
 *   contact submissions section cannot be located.
 *
 * @module AdminContactSubmissionsNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Contact Submissions Not Found"
      description="The contact submissions page or resource you're looking for doesn't exist."
      dashboardHref="/account/admin"
    />
  );
}
