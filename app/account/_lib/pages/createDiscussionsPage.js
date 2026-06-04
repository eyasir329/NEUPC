/**
 * @file Factory for the per-role Help Desk (discussions) page.
 *   Shared by the member, mentor, executive, advisor and admin panels;
 *   the only per-role difference is the `role` passed to the auth guard
 *   and forwarded to the client as `panelRole`.
 *
 * @module account/_lib/pages/createDiscussionsPage
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getDiscussions,
  getUserDiscussionStats,
  getUserBootcampEnrollments,
} from '@/app/_lib/services/data-service';
import {
  DiscussionErrorBoundary,
  HelpDeskClient,
} from '@/app/account/_components/discussions';

/** Help Desk page for the given panel role. */
export function createDiscussionsPage(role) {
  return async function DiscussionsPage() {
    const { user, userRoles } = await requireRole(role);

    const [discussionsResult, stats, bootcamps] = await Promise.all([
      getDiscussions({ userId: user.id, limit: 50 }).catch(() => ({
        data: [],
        total: 0,
      })),
      getUserDiscussionStats(user.id).catch(() => ({})),
      getUserBootcampEnrollments(user.id).catch(() => []),
    ]);

    return (
      <DiscussionErrorBoundary
        title="Help Desk Error"
        message="We encountered an issue loading the Help Desk. Please refresh the page or try again later."
      >
        <HelpDeskClient
          initialDiscussions={discussionsResult.data || []}
          initialStats={stats}
          bootcamps={bootcamps}
          userRoles={userRoles}
          panelRole={role}
        />
      </DiscussionErrorBoundary>
    );
  };
}
