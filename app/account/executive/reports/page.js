/**
 * @file Executive reports page server-side entry.
 *   Fetches dynamic analytics, logs, budgets, roles, events, and blogs in parallel.
 * @module ExecutiveReportsPage
 * @access executive | admin
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getUserStats,
  getPlatformStatistics,
  getDashboardMetrics,
  getBudgetSummary,
  getAllBudgetEntries,
  getEventsWithStats,
  getBlogsWithStats,
  getActivityLogs,
  getRolesWithStats,
  getAllBootcamps,
} from '@/app/_lib/data-service';
import ReportsClient from './_components/ReportsClient';

export const metadata = { title: 'Reports & Analytics | Executive | NEUPC' };

export default async function ReportsPage() {
  await requireRole(['executive', 'admin']);

  const [
    userStats,
    platformStats,
    dashboardMetrics,
    budgetSummary,
    budgetEntries,
    eventsData,
    blogsData,
    activityLogs,
    rolesStats,
    bootcamps,
  ] = await Promise.all([
    getUserStats().catch(() => ({
      total: 0,
      active: 0,
      inactive: 0,
      pending: 0,
      suspended: 0,
      banned: 0,
    })),
    getPlatformStatistics().catch(() => ({
      totalUsers: 0,
      approvedMembers: 0,
      totalEvents: 0,
      totalContests: 0,
    })),
    getDashboardMetrics().catch(() => ({
      pendingMemberApprovals: 0,
      pendingJoinRequests: 0,
      upcomingEvents: 0,
      unreadContacts: 0,
    })),
    getBudgetSummary().catch(() => ({
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
    })),
    getAllBudgetEntries().catch(() => []),
    getEventsWithStats().catch(() => ({ events: [], stats: {} })),
    getBlogsWithStats().catch(() => ({ posts: [], stats: {} })),
    getActivityLogs(100).catch(() => []),
    getRolesWithStats().catch(() => []),
    getAllBootcamps().catch(() => []),
  ]);

  return (
    <ReportsClient
      userStats={userStats}
      platformStats={platformStats}
      dashboardMetrics={dashboardMetrics}
      budgetSummary={budgetSummary}
      budgetEntries={budgetEntries}
      eventsData={eventsData}
      blogsData={blogsData}
      activityLogs={activityLogs}
      rolesStats={rolesStats}
      bootcamps={bootcamps}
    />
  );
}
