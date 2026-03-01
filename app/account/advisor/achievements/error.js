/**
 * @file Achievements error boundary — catches runtime errors on the
 *   achievements page and presents recovery options.
 *
 * @module AdvisorAchievementsError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Achievements"
      dashboardHref="/account/advisor"
    />
  );
}
