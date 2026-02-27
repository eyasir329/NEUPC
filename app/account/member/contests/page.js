import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getAllContests,
  getUserContestParticipations,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import MemberContestsClient from './_components/MemberContestsClient';

export const metadata = { title: 'Contests | Member' };

export default async function MemberContestsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('member')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || user?.is_active === false)
    redirect('/account');

  const [contests, myParticipations] = await Promise.all([
    getAllContests().catch(() => []),
    getUserContestParticipations(user.id).catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="member" />
      <MemberContestsClient
        contests={contests}
        myParticipations={myParticipations}
        userId={user.id}
      />
    </div>
  );
}
