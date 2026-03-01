/**
 * @file Advisor club overview — provides a bird’s-eye snapshot of the club
 *   including platform statistics, dashboard metrics, upcoming events,
 *   budget summary, and top achievements.
 * @module AdvisorClubOverviewPage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getPlatformStatistics,
  getDashboardMetrics,
  getUpcomingEvents,
  getBudgetSummary,
  getMostEarnedAchievements,
} from '@/app/_lib/data-service';
import AdvisorClubOverviewClient from './_components/AdvisorClubOverviewClient';

export const metadata = { title: 'Club Overview | Advisor | NEUPC' };

export default async function AdvisorClubOverviewPage() {
  await requireRole('advisor');

  const [
    platformStats,
    dashboardMetrics,
    upcomingEvents,
    budgetSummary,
    topAchievements,
  ] = await Promise.all([
    getPlatformStatistics().catch(() => ({})),
    getDashboardMetrics().catch(() => ({})),
    getUpcomingEvents(5).catch(() => []),
    getBudgetSummary().catch(() => ({
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
    })),
    getMostEarnedAchievements(5).catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <AdvisorClubOverviewClient
        platformStats={platformStats}
        dashboardMetrics={dashboardMetrics}
        upcomingEvents={upcomingEvents}
        budgetSummary={budgetSummary}
        topAchievements={topAchievements}
      />
    </div>
  );
}
