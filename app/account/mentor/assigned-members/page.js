import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getMentorshipsByMentor,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import AssignedMembersClient from './_components/AssignedMembersClient';

export const metadata = { title: 'Assigned Members | Mentor' };

export default async function AssignedMembersPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('mentor')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  const mentorships = await getMentorshipsByMentor(user.id).catch(() => []);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="mentor" />
      <AssignedMembersClient mentorships={mentorships} mentorId={user.id} />
    </div>
  );
}
