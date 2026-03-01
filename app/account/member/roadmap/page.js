/**
 * @file Member learning roadmap — shows published roadmaps with topic
 *   guides and progress tracking to help members follow structured
 *   skill-building paths.
 * @module MemberRoadmapPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getPublishedRoadmaps } from '@/app/_lib/data-service';
import MemberRoadmapClient from './_components/MemberRoadmapClient';

export const metadata = { title: 'Roadmap | Member | NEUPC' };

export default async function MemberRoadmapPage() {
  const [{ user }, roadmaps] = await Promise.all([
    requireRole('member'),
    getPublishedRoadmaps().catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <MemberRoadmapClient roadmaps={roadmaps} userId={user.id} />
    </div>
  );
}
