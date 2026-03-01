/**
 * @file Manage Contests not-found page — shown when a resource within the
 *   manage contests section cannot be located.
 *
 * @module ExecutiveManageContestsNotFound
 */

'use client';

import AccountNotFoundState from '../../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Manage Contests Not Found"
      description="The manage contests page or resource you're looking for doesn't exist."
      dashboardHref="/account/executive"
    />
  );
}
