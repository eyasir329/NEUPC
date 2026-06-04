/**
 * @file Mentor Help Desk Page
 * @module MentorDiscussionsPage
 * @access mentor
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getDiscussions,
  getUserDiscussionStats,
  getUserBootcampEnrollments,
} from '@/app/_lib/services/data-service';
import { DiscussionErrorBoundary } from '@/app/_components/discussions';
import MemberHelpDeskClient from '@/app/account/member/discussions/_components/MemberHelpDeskClient';

export const metadata = { title: 'Help Desk | Mentor | NEUPC' };

export default async function MentorDiscussionsPage() {
  const { session, user, userRoles } = await requireRole('mentor');

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
        isMentorPanel={true}
      />
    </DiscussionErrorBoundary>
  );
}
