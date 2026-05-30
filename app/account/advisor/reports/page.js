/**
 * @file Advisor reports centre — compiles activity logs, dashboard metrics,
 *   platform statistics, budget summaries, and event data into exportable
 *   or at-a-glance reports for the faculty advisor.
 * @module AdvisorReportsPage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getActivityLogs,
  getDashboardMetrics,
  getPlatformStatistics,
  getBudgetSummary,
  getEventsWithStats,
} from '@/app/_lib/services/data-service';
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
    <AdvisorReportsClient
      activityLogs={activityLogs}
      dashboardMetrics={dashboardMetrics}
      platformStats={platformStats}
      budgetSummary={budgetSummary}
      eventsWithStats={eventsWithStats}
    />
  );
}
