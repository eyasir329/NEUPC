/**
 * @file Advisor achievements overview — lists all club achievements with
 *   statistics and highlights the most-earned badges for quick insight.
 * @module AdvisorAchievementsPage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getAchievementsAdmin,
  getMostEarnedAchievements,
} from '@/app/_lib/services/data-service';
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
    <AdvisorAchievementsClient
      achievements={achievements}
      stats={stats}
      topAchievements={topAchievements}
      advisorId={user.id}
    />
  );
}
