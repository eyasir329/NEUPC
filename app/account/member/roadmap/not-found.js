/**
 * @file Roadmap not-found page — shown when a resource within the
 *   roadmap section cannot be located.
 *
 * @module MemberRoadmapNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Roadmap Not Found"
      description="The roadmap page or resource you're looking for doesn't exist."
      dashboardHref="/account/member"
    />
  );
}
