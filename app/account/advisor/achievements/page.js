/**
 * @file Advisor achievements overview — lists all club achievements with
 *   statistics and highlights the most-earned badges for quick insight.
 * @module AdvisorAchievementsPage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getAchievementsAdmin,
  getMostEarnedAchievements,
} from '@/app/_lib/data-service';
import AdvisorAchievementsClient from './_components/AdvisorAchievementsClient';

export const metadata = { title: 'Achievements | Advisor | NEUPC' };

export default async function AdvisorAchievementsPage() {
  const { user } = await requireRole('advisor');

  const [{ achievements, stats }, topAchievements] = await Promise.all([
    getAchievementsAdmin().catch(() => ({
      achievements: [],
      stats: {},
    })),
    getMostEarnedAchievements(5).catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <AdvisorAchievementsClient
        achievements={achievements}
        stats={stats}
        topAchievements={topAchievements}
        advisorId={user.id}
      />
    </div>
  );
}
