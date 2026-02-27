import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getAllResources,
} from '@/app/_lib/data-service';
import RoleSync from '@/app/account/_components/RoleSync';
import MentorResourcesClient from './_components/MentorResourcesClient';

export const metadata = { title: 'Resources | Mentor | NEUPC' };

export default async function MentorResourcesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('mentor')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  const resources = await getAllResources().catch(() => []);

  return (
    <>
      <RoleSync role="mentor" />
      <MentorResourcesClient resources={resources} mentorId={user.id} />
    </>
  );
}
