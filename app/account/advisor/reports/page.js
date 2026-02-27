import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getActivityLogs,
  getDashboardMetrics,
  getPlatformStatistics,
  getBudgetSummary,
  getEventsWithStats,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import AdvisorReportsClient from './_components/AdvisorReportsClient';

export const metadata = { title: 'Reports | Advisor' };

export default async function AdvisorReportsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('advisor')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

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
      <RoleSync role="advisor" />
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
