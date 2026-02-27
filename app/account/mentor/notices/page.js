import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getActiveNotices,
} from '@/app/_lib/data-service';
import RoleSync from '@/app/account/_components/RoleSync';
import MentorNoticesClient from './_components/MentorNoticesClient';

export const metadata = { title: 'Notices | Mentor | NEUPC' };

export default async function MentorNoticesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('mentor')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  const allNotices = await getActiveNotices().catch(() => []);
  const notices = allNotices.filter(
    (n) =>
      !n.target_audience ||
      n.target_audience.includes('all') ||
      n.target_audience.includes('mentor')
  );

  return (
    <>
      <RoleSync role="mentor" />
      <MentorNoticesClient notices={notices} mentorId={user.id} />
    </>
  );
}
