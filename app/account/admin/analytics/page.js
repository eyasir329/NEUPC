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
  let analytics = null;
  try {
    analytics = await getAnalyticsData();
  } catch (err) {
    console.error("Error in getAnalyticsData:", err);
  }

  return <AnalyticsClient data={analytics} />;
}
