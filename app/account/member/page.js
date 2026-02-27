import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import MemberDashboardClient from './_components/MemberDashboardClient';
import RoleSync from '../_components/RoleSync';

export default async function MemberPage() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user is member
  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('member')) {
    redirect('/account');
  }

  // Check account status and is_active
  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || user?.is_active === false) {
    redirect('/account');
  }

  return (
    <>
      <RoleSync role="member" />
      <MemberDashboardClient session={session} />
    </>
  );
}
