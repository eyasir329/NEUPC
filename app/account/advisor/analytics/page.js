/**
 * @file Advisor analytics dashboard — aggregates platform statistics,
 *   dashboard metrics, event performance data, and top achievements into
 *   a unified view for the faculty advisor.
 * @module AdvisorAnalyticsPage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getPlatformStatistics,
  getDashboardMetrics,
  getEventsWithStats,
  getMostEarnedAchievements,
} from '@/app/_lib/data-service';
import AdvisorAnalyticsClient from './_components/AdvisorAnalyticsClient';

export const metadata = { title: 'Analytics | Advisor | NEUPC' };

export default async function AdvisorAnalyticsPage() {
  await requireRole('advisor');

  const [platformStats, dashboardMetrics, eventsData, topAchievements] =
    await Promise.all([
      getPlatformStatistics().catch(() => ({})),
      getDashboardMetrics().catch(() => ({})),
      getEventsWithStats().catch(() => ({ events: [], stats: {} })),
      getMostEarnedAchievements(5).catch(() => []),
    ]);

  const eventsWithStats = eventsData?.events || [];

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <AdvisorAnalyticsClient
        platformStats={platformStats}
        dashboardMetrics={dashboardMetrics}
        eventsWithStats={eventsWithStats}
        topAchievements={topAchievements}
      />
    </div>
  );
}
