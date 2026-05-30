/**
 * @file Member notifications centre — displays personal notifications
 *   with unread count and provides mark-as-read / dismiss actions.
 * @module MemberNotificationsPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getUserNotifications,
  getUnreadNotificationsCount,
} from '@/app/_lib/services/data-service';
import MemberNotificationsClient from './_components/MemberNotificationsClient';

export const metadata = { title: 'Notifications | Member | NEUPC' };

export default async function MemberNotificationsPage() {
  const { user } = await requireRole('member');

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
