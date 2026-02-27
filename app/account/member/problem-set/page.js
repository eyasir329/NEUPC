import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getAllWeeklyTasks,
  getUserTaskSubmissions,
  getMemberProgress,
  getMemberProfileByUserId,
  getMemberStatistics,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import MemberProblemSetClient from './_components/MemberProblemSetClient';

export const metadata = { title: 'Problem Set | Member' };

export default async function MemberProblemSetPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('member')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || user?.is_active === false)
    redirect('/account');

  const [tasks, mySubmissions, progress] = await Promise.all([
    getAllWeeklyTasks().catch(() => []),
    getUserTaskSubmissions(user.id).catch(() => []),
    getMemberProgress(user.id).catch(() => []),
  ]);

  // Member stats requires the member_profiles row ID
  let memberStats = null;
  try {
    const profile = await getMemberProfileByUserId(user.id);
    if (profile?.id) {
      memberStats = await getMemberStatistics(profile.id).catch(() => null);
    }
  } catch {}

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="member" />
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
