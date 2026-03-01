/**
 * @file Create Notice not-found page — shown when a resource within the
 *   create notice section cannot be located.
 *
 * @module ExecutiveCreateNoticeNotFound
 */

'use client';

import AccountNotFoundState from '../../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Create Notice Not Found"
      description="The create notice page or resource you're looking for doesn't exist."
      dashboardHref="/account/executive"
    />
  );
}
