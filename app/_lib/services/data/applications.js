/**
 * @file applications data-access — split from the data-service module.
 */

import { supabase, supabaseAdmin } from '@/app/_lib/integrations/supabase';

// Get all join requests.
export async function getAllJoinRequests() {
  const { data, error } = await supabaseAdmin
    .from('join_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get pending join requests.
export async function getPendingJoinRequests() {
  const { data, error } = await supabaseAdmin
    .from('join_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get a join request by ID.
export async function getJoinRequestById(id) {
  const { data, error } = await supabase
    .from('join_requests')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Get a join request by email.
export async function getJoinRequestByEmail(email) {
  const { data, error } = await supabase
    .from('join_requests')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Create a join request.
export async function createJoinRequest(requestData) {
  const { data, error } = await supabase
    .from('join_requests')
    .insert([requestData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Approve a join request.
export async function approveJoinRequest(id, reviewedBy) {
  const { data, error } = await supabase
    .from('join_requests')
    .update({
      status: 'approved',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Reject a join request.
export async function rejectJoinRequest(id, reviewedBy, rejectionReason) {
  const { data, error } = await supabase
    .from('join_requests')
    .update({
      status: 'rejected',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      rejection_reason: rejectionReason,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
