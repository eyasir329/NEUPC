import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import RoleSync from '@/app/account/_components/RoleSync';
import MentorSettingsClient from './_components/MentorSettingsClient';

export const metadata = { title: 'Settings | Mentor | NEUPC' };

export default async function MentorSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('mentor')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  return (
    <>
      <RoleSync role="mentor" />
      <MentorSettingsClient user={user} />
    </>
  );
}
