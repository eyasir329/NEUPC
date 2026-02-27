import { redirect } from 'next/navigation';
import { auth } from '@/app/_lib/auth';
import { getUserByEmail, getUserRoles } from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import GuestSettingsClient from './_components/GuestSettingsClient';

export const metadata = {
  title: 'Settings | NEUPC',
};

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('guest')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active') redirect('/account');

  return (
    <>
      <RoleSync role="guest" />
      <GuestSettingsClient user={user} />
    </>
  );
}
