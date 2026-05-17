/**
 * @file Mentor resources library — surfaces learning materials available
 *   to mentors and their mentees.
 * @module MentorResourcesPage
 * @access mentor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getBookmarkedResourceIds,
  getPublishedBlogCount,
  getPublishedResources,
  getPublishedRoadmapCount,
  getResourceCategories,
} from '@/app/_lib/resources/queries';
import ResourcesClient from '@/app/_components/resources/ResourcesClient';

export const metadata = { title: 'Resources | Mentor | NEUPC' };

export default async function MentorResourcesPage({ searchParams }) {
  const params = await searchParams;
  const page = Number(params?.page || 1) || 1;
  const pageSize = 12;
  const q = params?.q || '';
  const type = params?.type || '';
  const categoryId = params?.categoryId || '';

  const { user } = await requireRole('mentor');

  const [{ resources, total }, categories, blogCount, roadmapCount] = await Promise.all([
    getPublishedResources({ page, pageSize, q, type, categoryId, includeMembers: true }),
    getResourceCategories(),
    getPublishedBlogCount(),
    getPublishedRoadmapCount(),
  ]);

  const bookmarkedIds = await getBookmarkedResourceIds(
    user?.id,
    resources.map((r) => r.id)
  );

  return (
    <ResourcesClient
      resources={resources}
      categories={categories}
      page={page}
      pageSize={pageSize}
      total={total}
      bookmarkedIds={bookmarkedIds}
      canBookmark={Boolean(user?.id)}
      basePath="/account/mentor/resources"
      blogCount={blogCount}
      roadmapCount={roadmapCount}
    />
  );
}
