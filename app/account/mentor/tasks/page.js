import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getAllWeeklyTasks,
} from '@/app/_lib/data-service';
import RoleSync from '@/app/account/_components/RoleSync';
import MentorTasksClient from './_components/MentorTasksClient';

export const metadata = { title: 'Tasks | Mentor | NEUPC' };

export default async function MentorTasksPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('mentor')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  const tasks = await getAllWeeklyTasks().catch(() => []);

  return (
    <>
      <RoleSync role="mentor" />
      <MentorTasksClient tasks={tasks} mentorId={user.id} />
    </>
  );
}
