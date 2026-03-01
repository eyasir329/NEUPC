/**
 * @file Recommendations error boundary — catches runtime errors on the
 *   recommendations page and presents recovery options.
 *
 * @module MentorRecommendationsError
 */

'use client';

import AccountError from '../../_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="Recommendations"
      dashboardHref="/account/mentor"
    />
  );
}
