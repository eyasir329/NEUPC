/**
 * @file Participation error boundary — catches runtime errors on the
 *   participation page and presents recovery options.
 *
 * @module MemberParticipationError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Participation"
      dashboardHref="/account/member"
    />
  );
}
