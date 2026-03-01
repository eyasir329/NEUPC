/**
 * @file [roadmapId] page
 * @module [roadmapId]Page
 */

import { notFound } from 'next/navigation';
import { getPublicRoadmapBySlug } from '@/app/_lib/public-actions';
import { BreadcrumbJsonLd } from '@/app/_components/ui/JsonLd';
import RoadmapDetailClient from './RoadmapDetailClient';
import { buildRoadmapMetadata } from '@/app/_lib/seo';

export async function generateMetadata({ params }) {
  const { roadmapId } = await params;
  const roadmap = await getPublicRoadmapBySlug(roadmapId);
  if (!roadmap) return { title: 'Roadmap Not Found' };
  return buildRoadmapMetadata(roadmap, `/roadmaps/${roadmapId}`);
}

export default async function Page({ params }) {
  const { roadmapId } = await params;
  const roadmap = await getPublicRoadmapBySlug(roadmapId);

  if (!roadmap) {
    notFound();
  }

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Roadmaps', url: '/roadmaps' },
          { name: roadmap.title },
        ]}
      />
      <RoadmapDetailClient roadmap={roadmap} />
    </>
  );
}
