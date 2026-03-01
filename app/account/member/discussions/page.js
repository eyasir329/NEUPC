/**
 * @file Member discussions forum — lists discussion threads with
 *   categories and vote data, enabling members to browse, create, and
 *   participate in club-wide conversations.
 * @module MemberDiscussionsPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getAllDiscussionThreads,
  getDiscussionCategories,
  getUserVotes,
} from '@/app/_lib/data-service';
import MemberDiscussionsClient from './_components/MemberDiscussionsClient';

export const metadata = { title: 'Discussions | Member | NEUPC' };

export default async function MemberDiscussionsPage() {
  const { session, user } = await requireRole('member');

  const [threads, categories, userVotes] = await Promise.all([
    getAllDiscussionThreads(60).catch(() => []),
    getDiscussionCategories().catch(() => []),
    getUserVotes(user.id).catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <MemberDiscussionsClient
        threads={threads}
        categories={categories}
        userVotes={userVotes}
        userId={user.id}
        userEmail={session.user.email}
      />
    </div>
  );
}
