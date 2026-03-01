/**
 * @file Manage Blogs not-found page — shown when a resource within the
 *   manage blogs section cannot be located.
 *
 * @module ExecutiveManageBlogsNotFound
 */

'use client';

import AccountNotFoundState from '../../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Manage Blogs Not Found"
      description="The manage blogs page or resource you're looking for doesn't exist."
      dashboardHref="/account/executive"
    />
  );
}
