/**
 * @file Achievements page
 * @module AchievementsPage
 */

import AchievementsClient from './AchievementsClient';
import { buildMetadata } from '@/app/_lib/seo';
import {
  CollectionPageJsonLd,
  BreadcrumbJsonLd,
} from '@/app/_components/ui/JsonLd';

export const metadata = buildMetadata({
  title: 'Hall of Achievements',
  description:
    'Explore the achievements, awards, and milestones of NEUPC — ICPC regionals, national championship results, and more.',
  pathname: '/achievements',
  keywords: [
    'achievements',
    'awards',
    'ICPC results',
    'programming contest winners',
    'milestones',
  ],
});

export default function Page() {
  return (
    <>
      <CollectionPageJsonLd
        name="Hall of Achievements - NEUPC"
        description="Awards, milestones, and competition results of NEUPC members."
        url="/achievements"
      />
      <BreadcrumbJsonLd
        items={[{ name: 'Home', url: '/' }, { name: 'Achievements' }]}
      />
      <AchievementsClient />
    </>
  );
}
