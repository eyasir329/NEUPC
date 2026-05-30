/**
 * @file Assigned members not-found view
 * @module AssignedMembersNotFound
 */

'use client';

import AccountNotFoundState from '@/app/account/_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Assigned Members Not Found"
      description="The assigned members page or resource you're looking for doesn't exist."
      dashboardHref="/account/mentor"
    />
  );
}
