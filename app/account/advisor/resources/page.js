/**
 * @file Advisor resources library — surfaces learning materials, guides,
 *   and shared documents available to club advisors.
 * @module AdvisorResourcesPage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getBookmarkCount,
  getBookmarkedResourceIds,
  getCompletedResourceIds,
  getLovedResourceIds,
  getCompletionCount,
  getPublishedBlogCount,
  getPublishedResources,
  getPublishedRoadmapCount,
  getResourceCategories,
  getSubmissionCount,
} from '@/app/_lib/resources/queries';
import { resourceTypeGroupToValues } from '@/app/_lib/resources/constants';
import ResourcesClient from '@/app/_components/resources/ResourcesClient';

export const metadata = { title: 'Resources | Advisor | NEUPC' };

export default async function AdvisorResourcesPage({ searchParams }) {
  const params = await searchParams;
  const page = Number(params?.page || 1) || 1;
  const pageSize = 12;
  const q = params?.q || '';
  const typeLabel = params?.type || '';
  const tab = params?.tab || 'all';
  const categoryId = tab && !['all', 'bookmarks', 'completed', 'my_submissions'].includes(tab)
    ? tab
    : (params?.categoryId || '');

  const { user } = await requireRole('advisor');
  const userId = user?.id || null;

  const types = resourceTypeGroupToValues(typeLabel);

  const [{ resources, total }, categories, blogCount, roadmapCount, bookmarkTotal, completedTotal, submissionTotal] =
    await Promise.all([
      getPublishedResources({
        page,
        pageSize,
        q,
        types,
        categoryId,
        includeMembers: true,
        onlyBookmarkedFor: tab === 'bookmarks' ? userId : null,
        onlyCompletedFor: tab === 'completed' ? userId : null,
        onlyCreatedBy: tab === 'my_submissions' ? userId : null,
      }),
      getResourceCategories(),
      getPublishedBlogCount(),
      getPublishedRoadmapCount(),
      getBookmarkCount(userId),
      getCompletionCount(userId),
      getSubmissionCount(userId),
    ]);

  const pageIds = resources.map((r) => r.id);
  const [bookmarkedIds, completedIds, lovedIds] = await Promise.all([
    getBookmarkedResourceIds(userId, pageIds),
    getCompletedResourceIds(userId, pageIds),
    getLovedResourceIds(userId, pageIds),
  ]);

  return (
    <ResourcesClient
      resources={resources}
      categories={categories}
      page={page}
      pageSize={pageSize}
      total={total}
      bookmarkedIds={bookmarkedIds}
      completedIds={completedIds}
      lovedIds={lovedIds}
      bookmarkTotal={bookmarkTotal}
      completedTotal={completedTotal}
      submissionTotal={submissionTotal}
      canBookmark={Boolean(userId)}
      submitVariant="advisor"
      basePath="/account/advisor/resources"
      blogsHref="/blogs"
      roadmapsHref="/roadmaps"
      blogCount={blogCount}
      roadmapCount={roadmapCount}
      userId={userId}
      currentUser={user}
    />
  );
}
