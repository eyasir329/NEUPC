/**
 * @file Profile not-found page — shown when a resource within the
 *   profile section cannot be located.
 *
 * @module MentorProfileNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Profile Not Found"
      description="The profile page or resource you're looking for doesn't exist."
      dashboardHref="/account/mentor"
    />
  );
}
