import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getPlatformStatistics,
  getDashboardMetrics,
  getEventsWithStats,
  getMostEarnedAchievements,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import AdvisorAnalyticsClient from './_components/AdvisorAnalyticsClient';

export const metadata = { title: 'Analytics | Advisor' };

export default async function AdvisorAnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('advisor')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

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
      <RoleSync role="advisor" />
      <AdvisorAnalyticsClient
        platformStats={platformStats}
        dashboardMetrics={dashboardMetrics}
        eventsWithStats={eventsWithStats}
        topAchievements={topAchievements}
      />
    </div>
  );
}
