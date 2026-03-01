/**
 * @file Tasks not-found page — shown when a resource within the
 *   tasks section cannot be located.
 *
 * @module MentorTasksNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Tasks Not Found"
      description="The tasks page or resource you're looking for doesn't exist."
      dashboardHref="/account/mentor"
    />
  );
}
