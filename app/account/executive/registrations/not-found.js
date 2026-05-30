/**
 * @file Registrations not-found page — shown when a resource within the
 *   registrations section cannot be located.
 *
 * @module ExecutiveRegistrationsNotFound
 */

'use client';

import AccountNotFoundState from '@/app/account/_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Registrations Not Found"
      description="The registrations page or resource you're looking for doesn't exist."
      dashboardHref="/account/executive"
    />
  );
}
