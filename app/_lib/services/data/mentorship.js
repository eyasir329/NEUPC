/**
 * @file mentorship data-access — split from the data-service module.
 */

import { supabase, supabaseAdmin } from '@/app/_lib/integrations/supabase';

// Get all mentorship records.
export async function getAllMentorships() {
  const { data, error } = await supabase
    .from('mentorships')
    .select(
      `
      *,
      users!mentorships_mentor_id_fkey(id, full_name, avatar_url),
      users!mentorships_mentee_id_fkey(id, full_name, avatar_url)
    `
    )
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get active mentorships.
export async function getActiveMentorships() {
  const { data, error } = await supabase
    .from('mentorships')
    .select(
      `
      *,
      users!mentorships_mentor_id_fkey(id, full_name, avatar_url),
      users!mentorships_mentee_id_fkey(id, full_name, avatar_url)
    `
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get mentorships by mentor ID.
export async function getMentorshipsByMentor(mentorId) {
  const { data, error } = await supabase
    .from('mentorships')
    .select(
      `
      *,
      users!mentorships_mentee_id_fkey(id, full_name, avatar_url, member_profiles(student_id, academic_session)),
      mentorship_sessions(*)
    `
    )
    .eq('mentor_id', mentorId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get mentorships by mentee ID.
export async function getMentorshipsByMentee(menteeId) {
  const { data, error } = await supabase
    .from('mentorships')
    .select('*, users!mentorships_mentor_id_fkey(id, full_name, avatar_url)')
    .eq('mentee_id', menteeId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Create a mentorship.
export async function createMentorship(mentorshipData) {
  const { data, error } = await supabase
    .from('mentorships')
    .insert([mentorshipData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update a mentorship record.
export async function updateMentorship(id, updates) {
  const { data, error } = await supabase
    .from('mentorships')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Get sessions for a mentorship.
export async function getMentorshipSessions(mentorshipId) {
  const { data, error } = await supabase
    .from('mentorship_sessions')
    .select('*')
    .eq('mentorship_id', mentorshipId)
    .order('session_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Create a mentorship session.
export async function createMentorshipSession(sessionData) {
  const { data, error } = await supabase
    .from('mentorship_sessions')
    .insert([sessionData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update a mentorship session.
export async function updateMentorshipSession(id, updates) {
  const { data, error } = await supabase
    .from('mentorship_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Delete a mentorship session.
export async function deleteMentorshipSession(id) {
  const { error } = await supabase
    .from('mentorship_sessions')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// Delete a mentorship.
export async function deleteMentorship(id) {
  const { error } = await supabaseAdmin
    .from('mentorships')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// Get all members enrolled in bootcamps assigned to this mentor.
export async function getMentorAssignedMembers(mentorId) {
  const { data: bootcampRows, error: bErr } = await supabaseAdmin
    .from('bootcamp_mentors')
    .select('bootcamp_id, bootcamps(id, title, slug)')
    .eq('user_id', mentorId);
  if (bErr) throw new Error(bErr.message);

  const bootcampIds = (bootcampRows || []).map((r) => r.bootcamp_id);
  if (bootcampIds.length === 0) return [];

  const bootcampMap = {};
  (bootcampRows || []).forEach((r) => {
    if (r.bootcamps) bootcampMap[r.bootcamp_id] = r.bootcamps;
  });

  const { data: enrollments, error: eErr } = await supabaseAdmin
    .from('enrollments')
    .select(
      'id, user_id, bootcamp_id, status, enrolled_at, users(id, full_name, email, avatar_url, member_profiles(academic_session, student_id, department, semester))'
    )
    .in('bootcamp_id', bootcampIds)
    .order('enrolled_at', { ascending: false });
  if (eErr) throw new Error(eErr.message);

  return (enrollments || []).map((e) => ({
    ...e,
    bootcamp: bootcampMap[e.bootcamp_id] || null,
  }));
}
