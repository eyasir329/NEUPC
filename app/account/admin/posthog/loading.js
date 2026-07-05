/**
 * @file PostHog dashboard loading page — skeleton UI shown while insights
 *   are fetched from the PostHog Query API.
 *
 * @module AdminPostHogLoading
 */

import AccountLoading from '@/app/account/_components/AccountLoading';

export default function Loading() {
  return <AccountLoading variant="dashboard" title="PostHog Analytics" />;
}
