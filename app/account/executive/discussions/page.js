/**
 * @file Executive Help Desk Page
 * @module ExecutiveDiscussionsPage
 * @access executive
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getDiscussions,
  getUserDiscussionStats,
  getUserBootcampEnrollments,
} from '@/app/_lib/services/data-service';
import { DiscussionErrorBoundary } from '@/app/_components/discussions';
import MemberHelpDeskClient from '@/app/account/member/discussions/_components/MemberHelpDeskClient';

export const metadata = { title: 'Help Desk | Executive | NEUPC' };

export default async function ExecutiveDiscussionsPage() {
  const { session, user, userRoles } = await requireRole('executive');

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
      <MemberHelpDeskClient
        initialDiscussions={discussionsResult.data || []}
        initialStats={stats}
        bootcamps={bootcamps}
        userId={user.id}
        userEmail={session.user.email}
        userRoles={userRoles}
        isExecutivePanel={true}
      />
    </DiscussionErrorBoundary>
  );
}
