/**
 * @file PostHog dashboard not-found page.
 *
 * @module AdminPostHogNotFound
 */

'use client';

import AccountNotFoundState from '@/app/account/_components/AccountNotFoundState';

export default function NotFound() {
  return (
    <AccountNotFoundState
      title="PostHog Page Not Found"
      description="The PostHog analytics page you're looking for doesn't exist."
      dashboardHref="/account/admin"
    />
  );
}
