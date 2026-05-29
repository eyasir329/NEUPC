/**
 * @file committee data-access — split from the data-service module.
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';

// Get all committee positions.
export async function getCommitteePositions() {
  const { data, error } = await supabaseAdmin
    .from('committee_positions')
    .select('*')
    .order('display_order');
  if (error) throw new Error(error.message);
  return data;
}

// Get current active committee members with full profiles.
export async function getCurrentCommittee() {
  const selectWithProfiles =
    '*, users!committee_members_user_id_fkey(id, full_name, email, phone, avatar_url, member_profiles!member_profiles_user_id_fkey(academic_session, department, bio, github, linkedin, updated_at), advisor_profiles!teacher_profiles_user_id_fkey(position, department)), committee_positions(id, title, category, rank, display_order, responsibilities)';
  const selectWithoutProfiles =
    '*, users!committee_members_user_id_fkey(id, full_name, email, phone, avatar_url), committee_positions(id, title, category, rank, display_order, responsibilities)';

  const runCurrentQuery = async (selectClause) =>
    supabaseAdmin
      .from('committee_members')
      .select(selectClause)
      .eq('is_current', true);

  const runAllQuery = async (selectClause) =>
    supabaseAdmin.from('committee_members').select(selectClause);

  let selectClause = selectWithProfiles;
  let { data, error } = await runCurrentQuery(selectClause);

  // Some environments fail on nested member_profiles join; retry without it.
  if (error) {
    console.error(
      '[getCurrentCommittee] profile join failed, retrying without profiles:',
      error.message
    );
    selectClause = selectWithoutProfiles;
    ({ data, error } = await runCurrentQuery(selectClause));
  }

  if (error) {
    console.error(
      '[getCurrentCommittee] failed fetching current members:',
      error.message
    );
    return [];
  }

  if (Array.isArray(data) && data.length > 0) {
    return data;
  }

  // Fallback 1: if is_current flags are not maintained, infer by date range.
  let { data: allMembers, error: allError } = await runAllQuery(selectClause);

  if (allError && selectClause === selectWithProfiles) {
    console.error(
      '[getCurrentCommittee] fallback profile join failed, retrying without profiles:',
      allError.message
    );
    ({ data: allMembers, error: allError } = await runAllQuery(
      selectWithoutProfiles
    ));
  }

  if (allError) {
    console.error(
      '[getCurrentCommittee] failed fetching fallback committee data:',
      allError.message
    );
    return [];
  }

  const today = new Date().toISOString().slice(0, 10);
  const currentByDate = (allMembers || []).filter(
    (member) =>
      member.term_start <= today &&
      (!member.term_end || member.term_end >= today)
  );

  if (currentByDate.length > 0) {
    return currentByDate;
  }

  // Fallback 2: use latest term_start cohort when no active date window is found.
  let latestTermStart = null;
  (allMembers || []).forEach((member) => {
    if (!member.term_start) return;
    if (!latestTermStart || member.term_start > latestTermStart) {
      latestTermStart = member.term_start;
    }
  });

  if (!latestTermStart) return allMembers || [];

  return (allMembers || []).filter(
    (member) => member.term_start === latestTermStart
  );
}

// Get all committee members with position info and full profiles.
export async function getAllCommitteeMembers() {
  const { data, error } = await supabaseAdmin
    .from('committee_members')
    .select(
      '*, users!committee_members_user_id_fkey(id, full_name, email, phone, avatar_url, member_profiles!member_profiles_user_id_fkey(academic_session, department, bio, github, linkedin)), committee_positions(id, title, category, rank, display_order, responsibilities)'
    )
    .order('term_start', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Add a committee member.
export async function addCommitteeMember(memberData) {
  const { data, error } = await supabaseAdmin
    .from('committee_members')
    .insert([memberData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update a committee member record.
export async function updateCommitteeMember(id, updates) {
  const { data, error } = await supabaseAdmin
    .from('committee_members')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Remove a committee member.
export async function removeCommitteeMember(id) {
  const { error } = await supabaseAdmin
    .from('committee_members')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// Create a committee position.
export async function createCommitteePosition(positionData) {
  const { data, error } = await supabaseAdmin
    .from('committee_positions')
    .insert([positionData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update a committee position.
export async function updateCommitteePosition(id, updates) {
  const { data, error } = await supabaseAdmin
    .from('committee_positions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Delete a committee position.
export async function deleteCommitteePosition(id) {
  const { error } = await supabaseAdmin
    .from('committee_positions')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}
