/**
 * @file notices data-access — split from the data-service module.
 */

import { supabase, supabaseAdmin } from '@/app/_lib/integrations/supabase';

// Get all notices for admin view.
export async function getNoticesAdmin() {
  const { data, error } = await supabaseAdmin
    .from('notices')
    .select('*, users!notices_created_by_fkey(id, full_name, avatar_url)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  const notices = data ?? [];

  const now = new Date();
  const stats = {
    total: notices.length,
    pinned: notices.filter((n) => n.is_pinned).length,
    active: notices.filter((n) => !n.expires_at || new Date(n.expires_at) > now)
      .length,
    expired: notices.filter(
      (n) => n.expires_at && new Date(n.expires_at) <= now
    ).length,
    critical: notices.filter((n) => n.priority === 'critical').length,
    urgent: notices.filter((n) => n.notice_type === 'urgent').length,
  };

  return { notices, stats };
}

// Get all active/pinned notices.
export async function getAllNotices() {
  const { data, error } = await supabase
    .from('notices')
    .select('*, users!notices_created_by_fkey(id, full_name)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get currently active notices.
export async function getActiveNotices() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('notices')
    .select('*, users!notices_created_by_fkey(id, full_name)')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get a notice by ID.
export async function getNoticeById(id) {
  const { data, error } = await supabase
    .from('notices')
    .select('*, users!notices_created_by_fkey(id, full_name)')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Get notices filtered by type.
export async function getNoticesByType(type) {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .eq('notice_type', type)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get pinned notices.
export async function getPinnedNotices() {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .eq('is_pinned', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Create a new notice.
export async function createNotice(noticeData) {
  const { data, error } = await supabase
    .from('notices')
    .insert([noticeData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update a notice.
export async function updateNotice(id, updates) {
  const { data, error } = await supabase
    .from('notices')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Increment view count for a notice.
export async function incrementNoticeViews(id) {
  const { data: notice } = await supabase
    .from('notices')
    .select('views')
    .eq('id', id)
    .single();
  if (notice) {
    await supabase
      .from('notices')
      .update({ views: (notice.views || 0) + 1 })
      .eq('id', id);
  }
  return { success: true };
}

// Delete a notice.
export async function deleteNotice(id) {
  const { error } = await supabaseAdmin.from('notices').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// Get the ids of notices a user has marked read.
export async function getUserNoticeReadIds(userId) {
  const { data, error } = await supabaseAdmin
    .from('notice_reads')
    .select('notice_id')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.notice_id);
}
