/**
 * @file Factory for the roadmap management page. Shared verbatim by the
 *   admin and executive panels (auth is enforced by each panel's layout),
 *   so the data-loading + stats logic lives here once.
 *
 * @module account/_lib/pages/createRoadmapsPage
 */

import { getAllRoadmaps } from '@/app/_lib/data-service';
import RoadmapManagementClient from '@/app/account/_components/roadmaps/RoadmapManagementClient';

/** Load roadmaps with a hard timeout, falling back to an empty list. */
async function loadRoadmapsSafely(timeoutMs = 10_000) {
  let timeoutId;

  try {
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Timed out while loading roadmaps'));
      }, timeoutMs);
    });

    const roadmaps = await Promise.race([getAllRoadmaps(), timeoutPromise]);
    return Array.isArray(roadmaps) ? roadmaps : [];
  } catch {
    return [];
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/** Build the roadmap management page component. */
export function createRoadmapsPage() {
  return async function RoadmapsPage() {
    const roadmaps = await loadRoadmapsSafely();

    const stats = {
      total: roadmaps.length,
      draft: roadmaps.filter((r) => r.status === 'draft').length,
      published: roadmaps.filter((r) => r.status === 'published').length,
      archived: roadmaps.filter((r) => r.status === 'archived').length,
      featured: roadmaps.filter((r) => r.is_featured).length,
      totalViews: roadmaps.reduce((s, r) => s + (r.views ?? 0), 0),
    };

    return (
      <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
        <RoadmapManagementClient initialRoadmaps={roadmaps} stats={stats} />
      </div>
    );
  };
}
