import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getMemberAchievements,
  getUserCertificates,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import MemberAchievementsClient from './_components/MemberAchievementsClient';

export const metadata = { title: 'Achievements | Member' };

export default async function MemberAchievementsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('member')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || user?.is_active === false)
    redirect('/account');

  const [memberAchievements, certificates] = await Promise.all([
    getMemberAchievements(user.id).catch(() => []),
    getUserCertificates(user.id).catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="member" />
      <MemberAchievementsClient
        memberAchievements={memberAchievements}
        certificates={certificates}
        userId={user.id}
      />
    </div>
  );
}
