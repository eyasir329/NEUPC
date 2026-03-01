/**
 * @file Problem Set not-found page — shown when a resource within the
 *   problem set section cannot be located.
 *
 * @module MemberProblemSetNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Problem Set Not Found"
      description="The problem set page or resource you're looking for doesn't exist."
      dashboardHref="/account/member"
    />
  );
}
