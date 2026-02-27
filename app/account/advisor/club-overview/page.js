import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getPlatformStatistics,
  getDashboardMetrics,
  getUpcomingEvents,
  getBudgetSummary,
  getMostEarnedAchievements,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import AdvisorClubOverviewClient from './_components/AdvisorClubOverviewClient';

export const metadata = { title: 'Club Overview | Advisor' };

export default async function AdvisorClubOverviewPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('advisor')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

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
      <RoleSync role="advisor" />
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
