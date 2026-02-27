import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getMemberProfileByUserId,
} from '@/app/_lib/data-service';
import RoleSync from '@/app/account/_components/RoleSync';
import MentorProfileClient from './_components/MentorProfileClient';

export const metadata = { title: 'Profile | Mentor | NEUPC' };

export default async function MentorProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('mentor')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  const memberProfile = await getMemberProfileByUserId(user.id).catch(
    () => null
  );

  return (
    <>
      <RoleSync role="mentor" />
      <MentorProfileClient user={user} memberProfile={memberProfile} />
    </>
  );
}
