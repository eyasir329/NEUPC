/**
 * @file tasks data-access — split from the data-service module.
 */

import { supabase, supabaseAdmin } from '@/app/_lib/integrations/supabase';

// Get all weekly tasks.
export async function getAllWeeklyTasks() {
  const { data, error } = await supabaseAdmin
    .from('weekly_tasks')
    .select('*, users!weekly_tasks_assigned_by_fkey(id, full_name)')
    .order('deadline', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get tasks with upcoming deadlines.
export async function getActiveWeeklyTasks() {
  const { data, error } = await supabase
    .from('weekly_tasks')
    .select('*, users!weekly_tasks_assigned_by_fkey(id, full_name)')
    .gte('deadline', new Date().toISOString())
    .order('deadline', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

// Get a weekly task by ID.
export async function getWeeklyTaskById(id) {
  const { data, error } = await supabase
    .from('weekly_tasks')
    .select('*, users!weekly_tasks_assigned_by_fkey(id, full_name)')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Create a weekly task.
export async function createWeeklyTask(taskData) {
  const { data, error } = await supabase
    .from('weekly_tasks')
    .insert([taskData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update a weekly task.
export async function updateWeeklyTask(id, updates) {
  const { data, error } = await supabase
    .from('weekly_tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Delete a weekly task.
export async function deleteWeeklyTask(id) {
  const { error } = await supabaseAdmin
    .from('weekly_tasks')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

// Get all submissions for a task.
export async function getTaskSubmissions(taskId) {
  const { data, error } = await supabase
    .from('task_submissions')
    .select(
      `
      *,
      users!task_submissions_user_id_fkey(
        id, full_name, avatar_url,
        member_profiles(student_id, academic_session)
      )
    `
    )
    .eq('task_id', taskId)
    .order('submitted_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get all submissions across all weekly tasks.
export async function getAllTaskSubmissions() {
  const { data, error } = await supabaseAdmin
    .from('task_submissions')
    .select(
      `
      *,
      users!task_submissions_user_id_fkey(
        id, full_name, email, avatar_url,
        member_profiles!member_profiles_user_id_fkey(student_id, academic_session)
      ),
      weekly_tasks(
        id, title, difficulty, deadline, target_audience, description, points
      )
    `
    )
    .order('submitted_at', { ascending: false, nullsFirst: false });
  if (error) {
    console.error('[getAllTaskSubmissions] query error:', error);
    throw new Error(error.message);
  }
  return data;
}

// Get all task submissions by a user.
export async function getUserTaskSubmissions(userId) {
  const { data, error } = await supabase
    .from('task_submissions')
    .select('*, weekly_tasks(id, title, deadline, difficulty)')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Get a user's submission for a specific task.
export async function getUserTaskSubmission(taskId, userId) {
  const { data, error } = await supabase
    .from('task_submissions')
    .select('*')
    .eq('task_id', taskId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// Create a task submission.
export async function createTaskSubmission(submissionData) {
  const { data, error } = await supabase
    .from('task_submissions')
    .insert([submissionData])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Update a task submission.
export async function updateTaskSubmission(id, userId, updates) {
  const { data, error } = await supabase
    .from('task_submissions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Review a task submission with feedback.
export async function reviewTaskSubmission(id, reviewedBy, status, feedback) {
  const { data, error } = await supabase
    .from('task_submissions')
    .update({ reviewed_by: reviewedBy, status, feedback })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Delete a task submission.
export async function deleteTaskSubmission(id) {
  const { error } = await supabase
    .from('task_submissions')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}
