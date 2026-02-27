import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import AdvisorDashboardClient from './_components/AdvisorDashboardClient';
import RoleSync from '../_components/RoleSync';

export default async function AdvisorDashboard() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user is advisor
  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('advisor')) {
    redirect('/account');
  }

  // Only available if account_status = active and is_active = true
  const userData = await getUserByEmail(session.user.email);
  if (userData?.account_status !== 'active' || !userData?.is_active) {
    redirect('/account');
  }

  return (
    <>
      <RoleSync role="advisor" />
      <AdvisorDashboardClient session={session} />
    </>
  );
}
