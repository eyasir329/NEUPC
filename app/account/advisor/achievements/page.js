import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getAchievementsAdmin,
  getMostEarnedAchievements,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import AdvisorAchievementsClient from './_components/AdvisorAchievementsClient';

export const metadata = { title: 'Achievements | Advisor' };

export default async function AdvisorAchievementsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('advisor')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  const { achievements, stats } = await getAchievementsAdmin().catch(() => ({
    achievements: [],
    stats: {},
  }));

  const topAchievements = await getMostEarnedAchievements(5).catch(() => []);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="advisor" />
      <AdvisorAchievementsClient
        achievements={achievements}
        stats={stats}
        topAchievements={topAchievements}
        advisorId={user.id}
      />
    </div>
  );
}
