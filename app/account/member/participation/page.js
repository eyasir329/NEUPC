import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getUserEventRegistrations,
  getUserContestParticipations,
  getUserCertificates,
  getAllDiscussionThreads,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import MemberParticipationClient from './_components/MemberParticipationClient';

export const metadata = { title: 'Participation | Member' };

export default async function MemberParticipationPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('member')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || user?.is_active === false)
    redirect('/account');

  const [registrations, contestParticipations, certificates, allThreads] =
    await Promise.all([
      getUserEventRegistrations(user.id).catch(() => []),
      getUserContestParticipations(user.id).catch(() => []),
      getUserCertificates(user.id).catch(() => []),
      getAllDiscussionThreads(200, 0).catch(() => []),
    ]);

  const myThreads = allThreads.filter((t) => t.author_id === user.id);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="member" />
      <MemberParticipationClient
        registrations={registrations}
        contestParticipations={contestParticipations}
        certificates={certificates}
        myThreads={myThreads}
        userId={user.id}
      />
    </div>
  );
}
