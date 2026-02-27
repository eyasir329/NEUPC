import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '@/app/_lib/data-service';
import { getAnalyticsData } from '@/app/_lib/analytics-service';
import RoleSync from '../../_components/RoleSync';
import AnalyticsClient from './_components/AnalyticsClient';

export const metadata = {
  title: 'Analytics | Admin',
};

export default async function AdminAnalyticsPage() {
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

  const analytics = await getAnalyticsData().catch(() => null);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="admin" />
      <AnalyticsClient data={analytics} />
    </div>
  );
}
