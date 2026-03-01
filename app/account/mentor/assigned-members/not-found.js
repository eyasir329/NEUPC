/**
 * @file Assigned Members not-found page — shown when a resource within the
 *   assigned members section cannot be located.
 *
 * @module MentorAssignedMembersNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Assigned Members Not Found"
      description="The assigned members page or resource you're looking for doesn't exist."
      dashboardHref="/account/mentor"
    />
  );
}
