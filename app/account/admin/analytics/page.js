/**
 * @file Admin analytics page (server component).
 * Fetches platform analytics data for the dashboard visualization.
 *
 * @module AdminAnalyticsPage
 * @access admin
 */

import { getAnalyticsData } from '@/app/_lib/analytics-service';
import AnalyticsClient from './_components/AnalyticsClient';

export const metadata = { title: 'Analytics | Admin | NEUPC' };

export default async function AdminAnalyticsPage() {
  const analytics = await getAnalyticsData().catch(() => null);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <AnalyticsClient data={analytics} />
    </div>
  );
}
