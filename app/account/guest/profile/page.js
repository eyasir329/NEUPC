import { redirect } from 'next/navigation';
import { auth } from '@/app/_lib/auth';
import {
  getUserByEmail,
  getUserRoles,
  getUserEventRegistrations,
  getUserCertificates,
  getActiveNotices,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import GuestProfileClient from './_components/GuestProfileClient';

export const metadata = {
  title: 'My Profile | NEUPC',
};

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('guest')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active') redirect('/account');

  const [registrations, certificates, allNotices] = await Promise.all([
    getUserEventRegistrations(user.id).catch(() => []),
    getUserCertificates(user.id).catch(() => []),
    getActiveNotices().catch(() => []),
  ]);

  const noticeCount = allNotices.filter((n) => {
    if (!n.target_audience || n.target_audience.length === 0) return true;
    return n.target_audience.includes('all') || n.target_audience.includes('guest');
  }).length;

  const stats = {
    eventsRegistered: registrations.length,
    eventsAttended: registrations.filter((r) => r.attended).length,
    certificates: certificates.length,
    notices: noticeCount,
  };

  return (
    <>
      <RoleSync role="guest" />
      <GuestProfileClient user={user} stats={stats} />
    </>
  );
}
