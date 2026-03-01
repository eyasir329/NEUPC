/**
 * @file Advisor reports centre — compiles activity logs, dashboard metrics,
 *   platform statistics, budget summaries, and event data into exportable
 *   or at-a-glance reports for the faculty advisor.
 * @module AdvisorReportsPage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getActivityLogs,
  getDashboardMetrics,
  getPlatformStatistics,
  getBudgetSummary,
  getEventsWithStats,
} from '@/app/_lib/data-service';
import AdvisorReportsClient from './_components/AdvisorReportsClient';

export const metadata = { title: 'Reports | Advisor | NEUPC' };

export default async function AdvisorReportsPage() {
  await requireRole('advisor');

  const [
    activityLogs,
    dashboardMetrics,
    platformStats,
    budgetSummary,
    eventsData,
  ] = await Promise.all([
    getActivityLogs(50).catch(() => []),
    getDashboardMetrics().catch(() => ({})),
    getPlatformStatistics().catch(() => ({})),
    getBudgetSummary().catch(() => ({
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
    })),
    getEventsWithStats().catch(() => ({ events: [], stats: {} })),
  ]);

  const eventsWithStats = eventsData?.events || [];

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <AdvisorReportsClient
        activityLogs={activityLogs}
        dashboardMetrics={dashboardMetrics}
        platformStats={platformStats}
        budgetSummary={budgetSummary}
        eventsWithStats={eventsWithStats}
      />
    </div>
  );
}
