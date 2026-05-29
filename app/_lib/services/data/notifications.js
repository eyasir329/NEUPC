/**
 * @file notifications data-access — split from the data-service module.
 */

import { supabase } from '@/app/_lib/integrations/supabase';

// Get notifications for a user.
export async function getUserNotifications(userId, limit = 20) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

// Get unread notifications for a user.
export async function getUnreadNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get count of unread notifications.
export async function getUnreadNotificationsCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw new Error(error.message);
  return count || 0;
}

// Create a notification.
export async function createNotification(notificationData) {
  const { data, error } = await supabase
    .from('notifications')
    .insert([notificationData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Mark a notification as read.
export async function markNotificationAsRead(id, userId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Mark all notifications as read for a user.
export async function markAllNotificationsAsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw new Error(error.message);
  return { success: true };
}

// Delete a notification.
export async function deleteNotification(id, userId) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return { success: true };
}
