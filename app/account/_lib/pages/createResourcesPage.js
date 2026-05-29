/**
 * @file Factory for a role's resources library page. The member, executive,
 *   advisor, admin and mentor panels all render the same {@link ResourcesClient}
 *   with identical data-loading; they differ only in the access role, the page
 *   base path, and the submission variant. This factory captures that one body.
 *
 * @module account/_lib/pages/createResourcesPage
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
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

/**
 * Build a resources library page for the given role.
 * @param {object} opts
 * @param {string} opts.role           role required to view + base path segment
 * @param {string} [opts.submitVariant] submission variant (defaults to `role`)
 */
export function createResourcesPage({ role, submitVariant = role }) {
  return async function ResourcesPage({ searchParams }) {
    const params = await searchParams;
    const page = Number(params?.page || 1) || 1;
    const pageSize = 12;
    const q = params?.q || '';
    const typeLabel = params?.type || '';
    const tab = params?.tab || 'all';
    const categoryId =
      tab && !['all', 'bookmarks', 'completed', 'my_submissions'].includes(tab)
        ? tab
        : params?.categoryId || '';

    const { user } = await requireRole(role);
    const userId = user?.id || null;

    const types = resourceTypeGroupToValues(typeLabel);

    const [
      { resources, total },
      categories,
      blogCount,
      roadmapCount,
      bookmarkTotal,
      completedTotal,
      submissionTotal,
    ] = await Promise.all([
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
        submitVariant={submitVariant}
        basePath={`/account/${role}/resources`}
        blogsHref="/blogs"
        roadmapsHref="/roadmaps"
        blogCount={blogCount}
        roadmapCount={roadmapCount}
        userId={userId}
        currentUser={user}
      />
    );
  };
}
