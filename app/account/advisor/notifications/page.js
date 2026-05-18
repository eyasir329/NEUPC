/**
 * @file Advisor notifications centre — displays the advisor's personal
 *   inbox with the same UX as the member notifications page (the inbox
 *   component is role-agnostic).
 * @module AdvisorNotificationsPage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getUserNotifications,
  getUnreadNotificationsCount,
} from '@/app/_lib/data-service';
import MemberNotificationsClient from '@/app/account/member/notifications/_components/MemberNotificationsClient';

export const metadata = { title: 'Notifications | Advisor | NEUPC' };

export default async function AdvisorNotificationsPage() {
  const { user } = await requireRole('advisor');

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(user.id, 50).catch(() => []),
    getUnreadNotificationsCount(user.id).catch(() => 0),
  ]);

  return (
    <MemberNotificationsClient
      notifications={notifications}
      unreadCount={unreadCount}
      userId={user.id}
    />
  );
}
