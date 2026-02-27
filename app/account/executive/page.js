import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import ExecutiveDashboardClient from './_components/ExecutiveDashboardClient';
import RoleSync from '../_components/RoleSync';

export default async function ExecutivePage() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user is executive
  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('executive')) {
    redirect('/account');
  }

  // Check account status and is_active
  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || user?.is_active === false) {
    redirect('/account');
  }

  return (
    <>
      <RoleSync role="executive" />
      <ExecutiveDashboardClient session={session} />
    </>
  );
}
