/**
 * @file Assigned members error boundary
 * @module AssignedMembersErrorBoundary
 */

'use client';

import AccountError from '@/app/account/_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Assigned Members"
      dashboardHref="/account/mentor"
    />
  );
}
