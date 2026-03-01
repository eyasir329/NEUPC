/**
 * @file Committee not-found page — shown when a resource within the
 *   committee section cannot be located.
 *
 * @module AdvisorCommitteeNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Committee Not Found"
      description="The committee page or resource you're looking for doesn't exist."
      dashboardHref="/account/advisor"
    />
  );
}
