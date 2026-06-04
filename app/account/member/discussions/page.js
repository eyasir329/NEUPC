/**
 * @file Member Help Desk Page
 * Full-featured help desk with tabs: All Post, Roadmap, Release Log,
 * Feature Requests, Self Troubleshoot.
 *
 * @module MemberDiscussionsPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getDiscussions,
  getUserDiscussionStats,
} from '@/app/_lib/services/data-service';
import { getMyEnrollments } from '@/app/_lib/actions/bootcamp-actions';
import { DiscussionErrorBoundary } from '@/app/_components/discussions';
import MemberHelpDeskClient from './_components/MemberHelpDeskClient';

export const metadata = { title: 'Help Desk | Member | NEUPC' };

export default async function MemberDiscussionsPage() {
  const { session, user, userRoles } = await requireRole('member');

  // Fetch initial data in parallel with detailed error logging
  const [discussionsResult, stats, bootcamps] = await Promise.all([
    getDiscussions({ userId: user.id, limit: 50 }).catch((err) => {
      console.error('Error fetching discussions:', err.message);
      return { data: [], total: 0 };
    }),
    getUserDiscussionStats(user.id).catch((err) => {
      console.error('Error fetching user stats:', err.message);
      return {};
    }),
    getMyEnrollments().catch((err) => {
      console.error('Error fetching bootcamp enrollments:', err.message);
      return [];
    }),
  ]);

  // Filter: only show bootcamps where member is currently enrolled (status = active) and bootcamp itself is active (status = published)
  const enrolledActiveBootcamps = (bootcamps || []).filter(
    (e) =>
      e.status === 'active' &&
      e.bootcamps &&
      e.bootcamps.status === 'published'
  );

  return (
    <DiscussionErrorBoundary
      title="Help Desk Error"
      message="We encountered an issue loading the Help Desk. Please refresh the page or try again later."
    >
      <MemberHelpDeskClient
        initialDiscussions={discussionsResult.data || []}
        initialStats={stats}
        bootcamps={enrolledActiveBootcamps}
        userId={user.id}
        userEmail={session.user.email}
        userRoles={userRoles}
        isMemberPanel={true}
      />
    </DiscussionErrorBoundary>
  );
}
