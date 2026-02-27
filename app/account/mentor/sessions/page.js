import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getMentorshipsByMentor,
} from '@/app/_lib/data-service';
import RoleSync from '@/app/account/_components/RoleSync';
import MentorSessionsClient from './_components/MentorSessionsClient';

export const metadata = { title: 'Sessions | Mentor | NEUPC' };

export default async function MentorSessionsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('mentor')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  const mentorships = await getMentorshipsByMentor(user.id).catch(() => []);

  return (
    <>
      <RoleSync role="mentor" />
      <MentorSessionsClient mentorships={mentorships} mentorId={user.id} />
    </>
  );
}
