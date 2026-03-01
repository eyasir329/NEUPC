/**
 * @file Admin achievement management page (server component).
 * Fetches achievements with stats and user list for the management UI.
 *
 * @module AdminAchievementsPage
 * @access admin
 */

import {
  getAchievementsAdmin,
  getUsersForSelector,
} from '@/app/_lib/data-service';
import AchievementManagementClient from './_components/AchievementManagementClient';

export const metadata = { title: 'Achievements | Admin | NEUPC' };

export default async function AdminAchievementsPage() {
  const [{ achievements, stats }, users] = await Promise.all([
    getAchievementsAdmin().catch(() => ({ achievements: [], stats: {} })),
    getUsersForSelector().catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <AchievementManagementClient
        initialAchievements={achievements}
        stats={stats}
        users={users}
      />
    </div>
  );
}
