/**
 * @file Recommendations not-found page — shown when a resource within the
 *   recommendations section cannot be located.
 *
 * @module MentorRecommendationsNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Recommendations Not Found"
      description="The recommendations page or resource you're looking for doesn't exist."
      dashboardHref="/account/mentor"
    />
  );
}
