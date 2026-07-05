/**
 * @file PostHog dashboard error boundary — catches runtime errors on the
 *   PostHog dashboard page and presents recovery options.
 *
 * @module AdminPostHogError
 */

'use client';

import AccountError from '@/app/account/_components/AccountError';

export default function Error({ error, reset }) {
  return (
    <AccountError
      error={error}
      reset={reset}
      title="PostHog Analytics"
      dashboardHref="/account/admin"
    />
  );
}
