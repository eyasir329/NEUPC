/**
 * @file Mentor notifications centre — displays personal notifications
 *   with unread count and provides mark-as-read / dismiss actions.
 * @module MentorNotificationsPage
 * @access mentor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getUserNotifications,
  getUnreadNotificationsCount,
} from '@/app/_lib/data-service';
import MentorNotificationsClient from './_components/MentorNotificationsClient';

export const metadata = { title: 'Notifications | Mentor | NEUPC' };

export default async function MentorNotificationsPage() {
  const { user } = await requireRole('mentor');

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(user.id, 50).catch(() => []),
    getUnreadNotificationsCount(user.id).catch(() => 0),
  ]);

  return (
    <MentorNotificationsClient
      notifications={notifications}
      unreadCount={unreadCount}
      userId={user.id}
    />
  );
}
