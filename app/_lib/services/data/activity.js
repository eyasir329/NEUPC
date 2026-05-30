/**
 * @file activity data-access — split from the data-service module.
 */

import { supabase } from '@/app/_lib/integrations/supabase';

export async function getActivityLogs(limit = 50) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*, users(id, full_name, email)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

export async function getActivityLogsByAction(action, limit = 50) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*, users(id, full_name)')
    .eq('action', action)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

export async function createActivityLog(
  userId,
  action,
  entityType,
  entityId,
  details = {}
) {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert([
      {
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
      },
    ])
    .select()
    .single();
  if (error) {
    console.error('Error creating activity log:', error.message);
    return null;
  }
  return data;
}
