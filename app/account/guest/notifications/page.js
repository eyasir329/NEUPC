/**
 * @file Guest notifications page — displays active notices filtered for
 *   the guest audience (notices targeting “all” or “guest” users).
 * @module GuestNotificationsPage
 * @access guest
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getActiveNotices } from '@/app/_lib/data-service';
import GuestNotificationsClient from './_components/GuestNotificationsClient';

export const metadata = { title: 'Notifications | Guest | NEUPC' };

export default async function GuestNotificationsPage() {
  const [{ user }, allNotices] = await Promise.all([
    requireRole('guest', { checkIsActive: false }),
    getActiveNotices().catch(() => []),
  ]);

  const notices = allNotices.filter((n) => {
    if (!n.target_audience || n.target_audience.length === 0) return true;
    return (
      n.target_audience.includes('all') || n.target_audience.includes('guest')
    );
  });

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <GuestNotificationsClient notices={notices} userId={user.id} />
    </div>
  );
}
