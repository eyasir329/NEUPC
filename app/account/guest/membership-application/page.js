import { redirect } from 'next/navigation';
import { auth } from '@/app/_lib/auth';
import {
  getUserByEmail,
  getUserRoles,
  getJoinRequestByEmail,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import MembershipApplicationClient from './MembershipApplicationClient';

export const metadata = {
  title: 'Apply for Membership | NEUPC',
};

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('guest')) redirect('/account');

  const [userData, joinRequests] = await Promise.all([
    getUserByEmail(session.user.email),
    getJoinRequestByEmail(session.user.email).catch(() => []),
  ]);

  // Most recent application (sorted desc by created_at)
  const latestApplication = joinRequests?.[0] ?? null;

  return (
    <>
      <RoleSync role="guest" />
      <MembershipApplicationClient
        userData={userData}
        latestApplication={latestApplication}
      />
    </>
  );
}
