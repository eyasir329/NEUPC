/**
 * @file Participation not-found page — shown when a resource within the
 *   participation section cannot be located.
 *
 * @module MemberParticipationNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Participation Not Found"
      description="The participation page or resource you're looking for doesn't exist."
      dashboardHref="/account/member"
    />
  );
}
