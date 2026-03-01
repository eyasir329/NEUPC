/**
 * @file notification actions
 * @module notification-actions
 */

'use server';

import { auth } from '@/app/_lib/auth';
import {
  getUserNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/app/_lib/data-service';
import { revalidatePath } from 'next/cache';

async function getAuthUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

export async function getNotificationsAction() {
  const userId = await getAuthUserId();
  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(userId, 50),
    getUnreadNotificationsCount(userId),
  ]);
  return { notifications, unreadCount };
}

export async function markAsReadAction(notificationId) {
  const userId = await getAuthUserId();
  await markNotificationAsRead(notificationId, userId);
  revalidatePath('/account/member/notifications');
  return { success: true };
}

export async function markAllAsReadAction() {
  const userId = await getAuthUserId();
  await markAllNotificationsAsRead(userId);
  revalidatePath('/account/member/notifications');
  return { success: true };
}

export async function deleteNotificationAction(notificationId) {
  const userId = await getAuthUserId();
  await deleteNotification(notificationId, userId);
  revalidatePath('/account/member/notifications');
  return { success: true };
}
