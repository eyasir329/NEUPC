/**
 * @file Achievements page
 * @module AchievementsPage
 */

import { getPublicAchievements, getAboutData } from '@/app/_lib/public-actions';
import AchievementsClient from './AchievementsClient';
import { buildMetadata } from '@/app/_lib/seo';
import {
  CollectionPageJsonLd,
  BreadcrumbJsonLd,
} from '@/app/_components/ui/JsonLd';

export const metadata = buildMetadata({
  title: 'Achievements',
  description:
    'Explore the achievements, awards, and milestones of NEUPC — ICPC regionals, national championship results, and more.',
  pathname: '/achievements',
  keywords: [
    'achievements',
    'awards',
    'ICPC results',
    'programming contest winners',
    'hall of fame',
    'milestones',
  ],
});

export default async function Page() {
  const [achievements, aboutData] = await Promise.all([
    getPublicAchievements(),
    getAboutData(),
  ]);

  // Stats come from about_stats setting (shared with about page)
  const stats = aboutData.stats || [];

  // Extract hall of fame from featured achievements
  const hallOfFame = achievements
    .filter((a) => a.is_featured || a.featured)
    .slice(0, 4)
    .map((a) => ({
      name: a.participants || a.title,
      title: a.title,
      rating: a.position || '',
      year: a.date ? new Date(a.date).getFullYear().toString() : '',
      avatar: (a.participants || a.title || '')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
    }));

  return (
    <>
      <CollectionPageJsonLd
        name="Achievements - NEUPC"
        description="Awards, milestones, and competition results of NEUPC members."
        url="/achievements"
      />
      <BreadcrumbJsonLd
        items={[{ name: 'Home', url: '/' }, { name: 'Achievements' }]}
      />
      <AchievementsClient
        achievements={achievements}
        hallOfFame={hallOfFame}
        stats={stats}
      />
    </>
  );
}
