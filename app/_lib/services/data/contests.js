/**
 * @file contests data-access — split from the data-service module.
 */

import { supabase, supabaseAdmin } from '@/app/_lib/integrations/supabase';

// Get all contests.
export async function getAllContests() {
  const { data, error } = await supabase
    .from('contests')
    .select('*')
    .order('start_time', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get a contest by slug.
export async function getContestBySlug(slug) {
  const { data, error } = await supabase
    .from('contests')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Get a contest by ID.
export async function getContestById(id) {
  const { data, error } = await supabase
    .from('contests')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Get upcoming contests.
export async function getUpcomingContests(limit = 10) {
  const { data, error } = await supabase
    .from('contests')
    .select('*')
    .eq('status', 'upcoming')
    .order('start_time', { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

// Get official/curated contests.
export async function getOfficialContests() {
  const { data, error } = await supabase
    .from('contests')
    .select('*')
    .eq('is_official', true)
    .order('start_time', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get contests filtered by platform.
export async function getContestsByPlatform(platform) {
  const { data, error } = await supabase
    .from('contests')
    .select('*')
    .eq('platform', platform)
    .order('start_time', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Create a new contest.
export async function createContest(contestData) {
  const { data, error } = await supabase
    .from('contests')
    .insert([contestData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update a contest.
export async function updateContest(id, updates) {
  const { data, error } = await supabase
    .from('contests')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Hard-delete a contest.
export async function deleteContest(id) {
  const { error } = await supabaseAdmin.from('contests').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// Get participants for a contest.
export async function getContestParticipants(contestId) {
  const { data, error } = await supabase
    .from('contest_participants')
    .select('*, users(id, full_name, avatar_url)')
    .eq('contest_id', contestId)
    .order('rank', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

// Get contest participations for a user.
export async function getUserContestParticipations(userId) {
  const { data, error } = await supabase
    .from('contest_participants')
    .select('*, contests(id, title, slug, platform, start_time, status)')
    .eq('user_id', userId)
    .order('registered_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Add a participant to a contest.
export async function addContestParticipant(participantData) {
  const { data, error } = await supabase
    .from('contest_participants')
    .insert([participantData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update a contest participant record.
export async function updateContestParticipant(contestId, userId, updates) {
  const { data, error } = await supabase
    .from('contest_participants')
    .update(updates)
    .eq('contest_id', contestId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Get past contests.
export async function getPastContests(limit = 10) {
  const { data, error } = await supabase
    .from('contests')
    .select('*')
    .eq('status', 'finished')
    .lte('start_time', new Date().toISOString())
    .order('start_time', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

export async function getContestParticipantCount(contestId) {
  const { count, error } = await supabase
    .from('contest_participants')
    .select('*', { count: 'exact', head: true })
    .eq('contest_id', contestId);
  if (error) throw new Error(error.message);
  return count || 0;
}
