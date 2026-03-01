/**
 * @file Blogs not-found page — shown when a resource within the
 *   blogs section cannot be located.
 *
 * @module AdminBlogsNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Blogs Not Found"
      description="The blogs page or resource you're looking for doesn't exist."
      dashboardHref="/account/admin"
    />
  );
}
