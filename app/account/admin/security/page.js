import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import { getSecurityData } from '@/app/_lib/security-service';
import RoleSync from '../../_components/RoleSync';
import SecurityClient from './_components/SecurityClient';

export const metadata = {
  title: 'Security | Admin',
};

export default async function AdminSecurityPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userEmail = session.user?.email;
  if (!userEmail) redirect('/login');

  const userRoles = await getUserRoles(userEmail);
  if (!Array.isArray(userRoles) || !userRoles.includes('admin')) {
    redirect('/account');
  }

  const userData = await getUserByEmail(userEmail);
  if (userData?.account_status !== 'active' || !userData?.is_active) {
    redirect('/account');
  }

  const securityData = await getSecurityData().catch(() => null);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="admin" />
      <SecurityClient data={securityData} adminId={userData.id} />
    </div>
  );
}
