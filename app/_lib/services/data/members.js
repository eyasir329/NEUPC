/**
 * @file members data-access — split from the data-service module.
 */

import { supabase, supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { _log } from './_internal';

// Approve a member application.
export async function approveMember(userId, adminId) {
  const { error: profileError } = await supabaseAdmin
    .from('member_profiles')
    .update({
      approved: true,
      approved_by: adminId,
      approved_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  if (profileError) throw new Error(profileError.message);

  await supabaseAdmin
    .from('users')
    .update({
      account_status: 'active',
      is_online: true,
      status_reason: 'Membership approved',
      status_changed_by: adminId,
      status_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  await _log(adminId, 'approve_member', 'member_profile', userId, {});
  return { success: true };
}

// Get all member profiles.
export async function getAllMemberProfiles() {
  const { data, error } = await supabase
    .from('member_profiles')
    .select('*, users(id, full_name, email, avatar_url)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get member profile by user ID.
export async function getMemberProfileByUserId(userId) {
  const { data, error } = await supabase
    .from('member_profiles')
    .select('*, users(id, full_name, email, avatar_url)')
    .eq('user_id', userId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Get member profile by student ID.
export async function getMemberProfileByStudentId(studentId) {
  const { data, error } = await supabase
    .from('member_profiles')
    .select('*, users(id, full_name, email, avatar_url)')
    .eq('student_id', studentId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Get all approved member profiles.
export async function getApprovedMembers() {
  const { data, error } = await supabase
    .from('member_profiles')
    .select('*, users(id, full_name, email, avatar_url)')
    .eq('approved', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get pending member profile applications.
export async function getPendingMemberProfiles() {
  const { data, error } = await supabase
    .from('member_profiles')
    .select('*, users(id, full_name, email, avatar_url)')
    .eq('approved', false)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get members filtered by session.
export async function getMembersBySession(session) {
  const { data, error } = await supabase
    .from('member_profiles')
    .select('*, users(id, full_name, email, avatar_url)')
    .eq('session', session)
    .eq('approved', true);
  if (error) throw new Error(error.message);
  return data;
}

// Backward-compatible alias for older callers.
export async function getMembersByBatch(batch) {
  return getMembersBySession(batch);
}

// Create a new member profile.
export async function createMemberProfile(profileData) {
  const { data, error } = await supabase
    .from('member_profiles')
    .insert([profileData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update a member profile.
export async function updateMemberProfile(userId, updates) {
  const { data, error } = await supabase
    .from('member_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Approve a member profile.
export async function approveMemberProfile(userId, approvedBy) {
  const { data, error } = await supabase
    .from('member_profiles')
    .update({
      approved: true,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Get platform statistics for a member.
export async function getMemberStatistics(memberId) {
  const { data, error } = await supabase
    .from('member_statistics')
    .select('*')
    .eq('member_id', memberId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Get platform statistics for all members.
export async function getAllMemberStatistics() {
  const { data, error } = await supabase
    .from('member_statistics')
    .select(
      '*, member_profiles(user_id, student_id, academic_session, users(full_name, avatar_url))'
    )
    .order('codeforces_rating', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Insert or update member platform statistics.
export async function upsertMemberStatistics(memberId, stats) {
  const { data, error } = await supabase
    .from('member_statistics')
    .upsert(
      { member_id: memberId, ...stats, updated_at: new Date().toISOString() },
      { onConflict: 'member_id' }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Get progress records for a user.
export async function getMemberProgress(userId) {
  const { data, error } = await supabase
    .from('member_progress')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Create a member progress record.
export async function createMemberProgress(progressData) {
  const { data, error } = await supabase
    .from('member_progress')
    .insert([progressData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update a member progress record.
export async function updateMemberProgress(id, updates) {
  const { data, error } = await supabase
    .from('member_progress')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Delete a member progress record.
export async function deleteMemberProgress(id) {
  const { error } = await supabase
    .from('member_progress')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}
