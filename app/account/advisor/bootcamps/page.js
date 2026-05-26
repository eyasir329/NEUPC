/**
 * @file Advisor Bootcamp Analytics page.
 * Fetches aggregated bootcamp statistics and renders the analytics client.
 *
 * @module AdvisorBootcampsPage
 * @access advisor
 */

import { getAdvisorBootcampAnalytics } from '@/app/_lib/bootcamp-actions';
import AdvisorBootcampClient from './_components/AdvisorBootcampClient';

export const metadata = {
  title: 'Bootcamp Analytics | Advisor | NEUPC',
  description: 'Faculty advisor overview of bootcamp cohort performance, enrollment trends, and student progress.',
};

export default async function AdvisorBootcampsPage() {
  let analytics = null;
  let error = null;

  try {
    analytics = await getAdvisorBootcampAnalytics();
  } catch (err) {
    error = err?.message || 'Failed to load analytics';
    console.error('Advisor bootcamp analytics error:', err);
  }

  if (error) {
    return (
      <div className="mx-4 my-6 flex min-h-[400px] items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 sm:mx-6 lg:mx-8">
        <div className="text-center">
          <p className="text-sm font-semibold text-red-400">Failed to load bootcamp analytics</p>
          <p className="mt-2 text-xs text-red-300/80">{error}</p>
        </div>
      </div>
    );
  }

  return <AdvisorBootcampClient analytics={analytics} />;
}
