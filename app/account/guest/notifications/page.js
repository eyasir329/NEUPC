import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getActiveNotices,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import GuestNotificationsClient from './_components/GuestNotificationsClient';

export const metadata = { title: 'Notifications | Guest' };

export default async function GuestNotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('guest')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active') redirect('/account');

  // fetch active notices visible to guests (target_audience includes 'guest' or 'all')
  const allNotices = await getActiveNotices().catch(() => []);
  const notices = allNotices.filter((n) => {
    if (!n.target_audience || n.target_audience.length === 0) return true;
    return (
      n.target_audience.includes('all') ||
      n.target_audience.includes('guest')
    );
  });

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="guest" />
      <GuestNotificationsClient notices={notices} userId={user.id} />
    </div>
  );
}
