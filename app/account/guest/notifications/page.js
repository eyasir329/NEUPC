/**
 * @file Guest notifications page — displays active notices filtered for
 *   the guest audience (notices targeting “all” or “guest” users).
 * @module GuestNotificationsPage
 * @access guest
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getActiveNotices,
  getUserNoticeReadIds,
} from '@/app/_lib/services/data-service';
import GuestNotificationsClient from './_components/GuestNotificationsClient';

export const metadata = { title: 'Notifications | Guest | NEUPC' };

export default async function GuestNotificationsPage() {
  const { user } = await requireRole('guest', { checkIsActive: false });

  const [allNotices, readIds] = await Promise.all([
    getActiveNotices().catch(() => []),
    getUserNoticeReadIds(user.id).catch(() => []),
  ]);

  const notices = allNotices.filter((n) => {
    if (!n.target_audience || n.target_audience.length === 0) return true;
    return (
      n.target_audience.includes('all') || n.target_audience.includes('guest')
    );
  });

  return (
    <GuestNotificationsClient notices={notices} initialReadIds={readIds} />
  );
}
