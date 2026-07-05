/**
 * @file Admin PostHog dashboard page (server component).
 *   Fetches every saved insight from the PostHog Query API and renders
 *   them in a native dashboard. Personal API key stays server-side.
 *
 * @module AdminPostHogPage
 * @access admin
 */

import {
  getAllInsights,
  isPostHogConfigured,
  postHogProjectUrl,
} from '@/app/_lib/services/posthog-insights-service';
import PostHogDashboardClient from './_components/PostHogDashboardClient';

export const metadata = { title: 'PostHog | Admin | NEUPC' };

export default async function AdminPostHogPage() {
  const configured = isPostHogConfigured();
  let insights = [];
  let error = null;

  if (configured) {
    try {
      insights = await getAllInsights();
    } catch (err) {
      console.error('Error fetching PostHog insights:', err);
      error = err.message || 'Failed to load PostHog insights.';
    }
  }

  return (
    <PostHogDashboardClient
      insights={insights}
      configured={configured}
      error={error}
      projectUrl={postHogProjectUrl()}
    />
  );
}
