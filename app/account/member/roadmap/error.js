/**
 * @file Roadmap error boundary — catches runtime errors on the
 *   roadmap page and presents recovery options.
 *
 * @module MemberRoadmapError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Roadmap"
      dashboardHref="/account/member"
    />
  );
}
