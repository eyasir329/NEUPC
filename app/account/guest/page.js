import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import GuestDashboardClient from './_components/GuestDashboardClient';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import RoleSync from '../_components/RoleSync';

async function GuestDashboard() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has guest role
  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('guest')) {
    redirect('/account');
  }

  // Check if account status is active
  const userData = await getUserByEmail(session.user.email);
  if (userData?.account_status !== 'active') {
    redirect('/account');
  }

  return (
    <>
      <RoleSync role="guest" />
      <GuestDashboardClient session={session} />
    </>
  );
}

export default GuestDashboard;
