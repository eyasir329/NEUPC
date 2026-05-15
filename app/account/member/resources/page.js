/**
 * @file Member resources library — surfaces learning materials, guides,
 *   and shared documents available to active club members.
 * @module MemberResourcesPage
 * @access member
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

export const metadata = { title: 'Resources | Member | NEUPC' };

export default async function MemberResourcesPage({ searchParams }) {
  const params = await searchParams;
  const page = Number(params?.page || 1) || 1;
  const pageSize = 12;
  const q = params?.q || '';
  const type = params?.type || '';
  const categoryId = params?.categoryId || '';

  const { user } = await requireRole('member');

  const [{ resources, total }, categories, blogCount, roadmapCount] = await Promise.all([
    getPublishedResources({
      page,
      pageSize,
      q,
      type,
      categoryId,
      includeMembers: true,
    }),
    getResourceCategories(),
    getPublishedBlogCount(),
    getPublishedRoadmapCount(),
  ]);

  const bookmarkedIds = await getBookmarkedResourceIds(
    user?.id,
    resources.map((r) => r.id)
  );

  const pinnedCount = resources.filter((r) => r.is_pinned).length;

  return (
    <ResourcesClient
      resources={resources}
      categories={categories}
      page={page}
      pageSize={pageSize}
      total={total}
      bookmarkedIds={bookmarkedIds}
      canBookmark={Boolean(user?.id)}
      basePath="/account/member/resources"
      blogCount={blogCount}
      roadmapCount={roadmapCount}
    />
  );
}
