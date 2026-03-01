/**
 * @file Achievements not-found page — shown when a resource within the
 *   achievements section cannot be located.
 *
 * @module AdvisorAchievementsNotFound
 */

'use client';

import AccountNotFoundState from '../../_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="Achievements Not Found"
      description="The achievements page or resource you're looking for doesn't exist."
      dashboardHref="/account/advisor"
    />
  );
}
