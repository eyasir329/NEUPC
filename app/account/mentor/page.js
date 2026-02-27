import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import MentorDashboardClient from './_components/MentorDashboardClient';
import RoleSync from '../_components/RoleSync';

export default async function MentorPage() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user is mentor
  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('mentor')) {
    redirect('/account');
  }

  // Check account status and is_active
  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || user?.is_active === false) {
    redirect('/account');
  }

  return (
    <>
      <RoleSync role="mentor" />
      <MentorDashboardClient session={session} />
    </>
  );
}
