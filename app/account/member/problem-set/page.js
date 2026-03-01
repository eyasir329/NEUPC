/**
 * @file Member problem set trainer — lists weekly programming tasks,
 *   tracks the member’s submissions and progress, and shows comparative
 *   statistics from their member profile.
 * @module MemberProblemSetPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getAllWeeklyTasks,
  getUserTaskSubmissions,
  getMemberProgress,
  getMemberProfileByUserId,
  getMemberStatistics,
} from '@/app/_lib/data-service';
import MemberProblemSetClient from './_components/MemberProblemSetClient';

export const metadata = { title: 'Problem Set | Member | NEUPC' };

export default async function MemberProblemSetPage() {
  const { user } = await requireRole('member');

  const [tasks, mySubmissions, progress, profile] = await Promise.all([
    getAllWeeklyTasks().catch(() => []),
    getUserTaskSubmissions(user.id).catch(() => []),
    getMemberProgress(user.id).catch(() => []),
    getMemberProfileByUserId(user.id).catch(() => null),
  ]);

  const memberStats = profile?.id
    ? await getMemberStatistics(profile.id).catch(() => null)
    : null;

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <MemberProblemSetClient
        tasks={tasks}
        mySubmissions={mySubmissions}
        progress={progress}
        memberStats={memberStats}
        userId={user.id}
      />
    </div>
  );
}
