import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail, getAllSettings } from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import SettingsClient from './_components/SettingsClient';

export const metadata = {
  title: 'Settings | Admin',
};

export default async function AdminSettingsPage() {
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

  const rawSettings = await getAllSettings().catch(() => []);

  // Convert array of {key, value} rows into a flat map
  const settingsMap = {};
  for (const row of rawSettings) {
    settingsMap[row.key] = row.value;
  }

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="admin" />
      <SettingsClient initialSettings={settingsMap} adminId={userData.id} />
    </div>
  );
}
