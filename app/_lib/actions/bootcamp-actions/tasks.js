'use server';

/**
 * @file Bootcamp tasks server actions (split from bootcamp-actions).
 */

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { auth } from '@/app/_lib/auth/auth';
import { uploadToDrive } from '@/app/_lib/integrations/gdrive';
import { extractDriveFileId } from '@/app/_lib/utils/utils';
import {
  getFileMetadata,
  canAccessFile,
} from '@/app/_lib/services/bootcamp-video';
import {
  cleanRichText,
  cleanPlainText,
  cleanLessonContent,
  cleanExamQuestions,
  cleanPracticeProblems,
  cleanAttachments,
} from '@/app/_lib/services/bootcamp-sanitize';

import {
  MAX_TASK_ATTACHMENT_SIZE,
  getCurrentUserId,
  requireAdminOrBootcampMentor,
} from './_helpers';

const DHAKA_TZ = 'Asia/Dhaka'; // UTC+6, no DST

/**
 * Parse a datetime-local string (YYYY-MM-DDTHH:MM, no timezone) as
 * Asia/Dhaka time and return a UTC ISO string for DB storage.
 */
function dhakaLocalToUTC(localStr) {
  if (!localStr) return null;
  // Intl gives us the UTC offset for Dhaka at any moment (always +0600, no DST).
  // Easiest: append the fixed offset.
  return new Date(localStr + ':00+06:00').toISOString();
}

/**
 * Get tasks scoped to a bootcamp.
 * Requires bootcamp_id column on weekly_tasks table.
 * Migration: ALTER TABLE weekly_tasks ADD COLUMN IF NOT EXISTS bootcamp_id uuid REFERENCES bootcamps(id);
 */
export async function getBootcampTasks(bootcampId) {
  await requireAdminOrBootcampMentor(bootcampId);
  const { data, error } = await supabaseAdmin
    .from('weekly_tasks')
    .select('*')
    .eq('bootcamp_id', bootcampId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function createBootcampTaskAction(formData) {
  'use server';
  try {
    const bootcampId = formData.get('bootcamp_id');
    const mentorId = await requireAdminOrBootcampMentor(bootcampId);
    const title = cleanPlainText(formData.get('title')?.trim(), 300);
    const description =
      cleanRichText(formData.get('description')?.trim() || '', 20000) || null;
    const difficulty = formData.get('difficulty') || 'medium';
    const deadline = formData.get('deadline');
    const start_time = formData.get('start_time') || null;
    const problem_links = (() => {
      try {
        return JSON.parse(formData.get('problem_links') || '[]');
      } catch {
        return [];
      }
    })();

    if (!title || !deadline)
      return { error: 'Title and deadline are required' };
    const deadlineUTC = dhakaLocalToUTC(deadline);
    const startTimeUTC = dhakaLocalToUTC(start_time);
    if (startTimeUTC && startTimeUTC >= deadlineUTC)
      return { error: 'Start time must be before the deadline' };

    const { data, error } = await supabaseAdmin
      .from('weekly_tasks')
      .insert([
        {
          title,
          description,
          difficulty,
          start_time: startTimeUTC,
          deadline: deadlineUTC,
          assigned_by: mentorId,
          problem_links,
          bootcamp_id: bootcampId,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    revalidatePath(`/account/mentor/bootcamps/${bootcampId}`);
    return { success: 'Task created', data };
  } catch (err) {
    return { error: err.message };
  }
}

export async function updateBootcampTaskAction(formData) {
  'use server';
  try {
    const bootcampId = formData.get('bootcamp_id');
    const mentorId = await requireAdminOrBootcampMentor(bootcampId);
    const id = formData.get('id');
    const title = cleanPlainText(formData.get('title')?.trim(), 300);
    const description =
      cleanRichText(formData.get('description')?.trim() || '', 20000) || null;
    const difficulty = formData.get('difficulty') || 'medium';
    const deadline = formData.get('deadline');
    const start_time = formData.get('start_time') || null;
    const problem_links = (() => {
      try {
        return JSON.parse(formData.get('problem_links') || '[]');
      } catch {
        return [];
      }
    })();

    if (!id || !title || !deadline) return { error: 'Missing required fields' };
    const deadlineUTC = dhakaLocalToUTC(deadline);
    const startTimeUTC = dhakaLocalToUTC(start_time);
    if (startTimeUTC && startTimeUTC >= deadlineUTC)
      return { error: 'Start time must be before the deadline' };

    const { data: existing } = await supabaseAdmin
      .from('weekly_tasks')
      .select('assigned_by')
      .eq('id', id)
      .single();
    if (existing?.assigned_by !== mentorId) return { error: 'Not authorized' };

    const { error } = await supabaseAdmin
      .from('weekly_tasks')
      .update({
        title,
        description,
        difficulty,
        start_time: startTimeUTC,
        deadline: deadlineUTC,
        problem_links,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath(`/account/mentor/bootcamps/${bootcampId}`);
    return { success: 'Task updated' };
  } catch (err) {
    return { error: err.message };
  }
}

export async function deleteBootcampTaskAction(formData) {
  'use server';
  try {
    const bootcampId = formData.get('bootcamp_id');
    const mentorId = await requireAdminOrBootcampMentor(bootcampId);
    const id = formData.get('id');

    const { data: existing } = await supabaseAdmin
      .from('weekly_tasks')
      .select('assigned_by')
      .eq('id', id)
      .single();
    if (existing?.assigned_by !== mentorId) return { error: 'Not authorized' };

    const { error } = await supabaseAdmin
      .from('weekly_tasks')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath(`/account/mentor/bootcamps/${bootcampId}`);
    return { success: 'Task deleted' };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Fetch help tickets for a bootcamp.
 * Requires table: bootcamp_help_requests(id, bootcamp_id, user_id, subject, body, status, reply, created_at)
 * Migration: CREATE TABLE IF NOT EXISTS bootcamp_help_requests (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   bootcamp_id uuid REFERENCES bootcamps(id) ON DELETE CASCADE,
 *   user_id uuid REFERENCES users(id) ON DELETE CASCADE,
 *   subject text NOT NULL,
 *   body text,
 *   status text DEFAULT 'open',
 *   reply text,
 *   replied_by uuid REFERENCES users(id),
 *   created_at timestamptz DEFAULT now(),
 *   updated_at timestamptz DEFAULT now()
 * );
 */
export async function getBootcampHelpTickets(bootcampId) {
  await requireAdminOrBootcampMentor(bootcampId);
  const { data, error } = await supabaseAdmin
    .from('bootcamp_help_requests')
    .select('*, users(id, full_name, avatar_url)')
    .eq('bootcamp_id', bootcampId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function replyAndResolveHelpTicketAction(formData) {
  'use server';
  try {
    const bootcampId = formData.get('bootcamp_id');
    const mentorId = await requireAdminOrBootcampMentor(bootcampId);
    const ticketId = formData.get('ticket_id');
    const rawReply = formData.get('reply')?.trim() || null;
    const reply = rawReply ? cleanRichText(rawReply, 20000) : null;
    const status = formData.get('status') || 'resolved';

    const { error } = await supabaseAdmin
      .from('bootcamp_help_requests')
      .update({
        reply,
        status,
        replied_by: mentorId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .eq('bootcamp_id', bootcampId);

    if (error) throw new Error(error.message);
    revalidatePath(`/account/mentor/bootcamps/${bootcampId}`);
    return { success: 'Ticket updated' };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Member: submit a help request for a bootcamp.
 */
export async function submitHelpTicketAction(formData) {
  'use server';
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { error: 'Not authenticated' };

    const bootcampId = formData.get('bootcamp_id');
    const subject = cleanPlainText(formData.get('subject')?.trim(), 500);
    const body = cleanRichText(formData.get('body')?.trim() || '', 20000);

    if (!bootcampId || !subject) return { error: 'Subject is required' };

    // Only enrolled members can submit help tickets to a bootcamp.
    const { data: enr } = await supabaseAdmin
      .from('enrollments')
      .select('status')
      .eq('user_id', userId)
      .eq('bootcamp_id', bootcampId)
      .single();
    if (!enr || enr.status !== 'active') {
      return { error: 'You must be enrolled to submit a help ticket' };
    }

    const { error } = await supabaseAdmin
      .from('bootcamp_help_requests')
      .insert([
        {
          bootcamp_id: bootcampId,
          user_id: userId,
          subject,
          body,
          status: 'open',
        },
      ]);

    if (error) throw new Error(error.message);
    revalidatePath(`/account/member/bootcamps/${bootcampId}`);
    return { success: 'Help request submitted' };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Member: get own help tickets for a bootcamp.
 */
export async function getMemberHelpTickets(bootcampId) {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabaseAdmin
    .from('bootcamp_help_requests')
    .select('id, subject, body, status, reply, created_at')
    .eq('bootcamp_id', bootcampId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

/**
 * Member: get tasks assigned to a bootcamp they are enrolled in.
 */
export async function getMemberBootcampTasks(bootcampId) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  // Verify member is enrolled
  const { data: enr } = await supabaseAdmin
    .from('enrollments')
    .select('id')
    .eq('bootcamp_id', bootcampId)
    .eq('user_id', userId)
    .in('status', ['active', 'completed'])
    .maybeSingle();
  if (!enr) return [];

  const { data, error } = await supabaseAdmin
    .from('weekly_tasks')
    .select(
      'id, title, description, difficulty, deadline, start_time, problem_links, task_type, points, created_at'
    )
    .eq('bootcamp_id', bootcampId)
    .order('created_at', { ascending: false });
  if (error) return [];

  const tasks = data || [];
  if (tasks.length === 0) return [];

  // Attach this member's submission (if any) to each task
  const taskIds = tasks.map((t) => t.id);
  const { data: subs } = await supabaseAdmin
    .from('task_submissions')
    .select(
      'id, task_id, submission_url, notes, attachments, status, feedback, points_earned, submitted_at, reviewed_by'
    )
    .eq('user_id', userId)
    .in('task_id', taskIds);

  // Fetch reviewer profiles separately (avoids relying on a specific FK constraint alias)
  const reviewerIds = [
    ...new Set((subs || []).map((s) => s.reviewed_by).filter(Boolean)),
  ];
  let reviewerMap = {};
  if (reviewerIds.length > 0) {
    const { data: reviewers } = await supabaseAdmin
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', reviewerIds);
    reviewerMap = Object.fromEntries((reviewers || []).map((u) => [u.id, u]));
  }

  const subMap = Object.fromEntries(
    (subs || []).map((s) => [
      s.task_id,
      {
        ...s,
        reviewer: s.reviewed_by ? reviewerMap[s.reviewed_by] || null : null,
      },
    ])
  );
  return tasks.map((t) => ({ ...t, mySubmission: subMap[t.id] || null }));
}

export async function uploadTaskAttachmentAction(formData) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { error: 'Not authenticated' };

    const file = formData.get('file');
    if (!file || !(file instanceof File) || file.size === 0) {
      return { error: 'No file provided.' };
    }
    if (file.size > MAX_TASK_ATTACHMENT_SIZE) {
      return {
        error: `File exceeds ${MAX_TASK_ATTACHMENT_SIZE / (1024 * 1024)}MB limit.`,
      };
    }

    const safeName = (file.name || 'file')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 80);
    const ext = safeName.includes('.') ? safeName.split('.').pop() : 'bin';
    const filename = `task_${userId}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { fileId } = await uploadToDrive(
      Buffer.from(arrayBuffer),
      filename,
      file.type || 'application/octet-stream',
      'task-submissions'
    );
    const url = `https://drive.google.com/file/d/${fileId}/view`;
    return {
      success: true,
      url,
      name: file.name || safeName,
      size: file.size,
      type: file.type || '',
    };
  } catch (err) {
    console.error('Task attachment upload error:', err);
    return { error: err.message || 'Failed to upload file.' };
  }
}

export async function submitTaskAction(formData) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { error: 'Not authenticated' };

    const taskId = formData.get('task_id');
    const rawUrl = formData.get('submission_url')?.trim() || null;
    // Submission URLs must be http/https; reject javascript:, data:, etc.
    let submissionUrl = null;
    if (rawUrl) {
      try {
        const u = new URL(rawUrl);
        if (u.protocol === 'http:' || u.protocol === 'https:')
          submissionUrl = rawUrl;
      } catch {}
    }
    const notes =
      cleanRichText(formData.get('notes')?.trim() || '', 10000) || null;
    const attachmentsRaw = formData.get('attachments');
    let attachments = null;
    if (attachmentsRaw) {
      try {
        const parsed = JSON.parse(attachmentsRaw);
        if (Array.isArray(parsed) && parsed.length > 0)
          attachments = cleanAttachments(parsed);
      } catch {}
    }

    if (!taskId) return { error: 'Missing task ID' };
    if (!submissionUrl && !notes && !attachments)
      return { error: 'Provide content or a file.' };

    // Check if already submitted
    const { data: existing } = await supabaseAdmin
      .from('task_submissions')
      .select('id, status')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Allow resubmit only if redo is required
      if (existing.status !== 'redo action required') {
        return {
          error:
            'Already submitted. Resubmission is only allowed when mentor requests a redo.',
        };
      }
      const { data, error } = await supabaseAdmin
        .from('task_submissions')
        .update({
          submission_url: submissionUrl,
          notes,
          attachments,
          status: 'pending',
          submitted_at: new Date().toISOString(),
          feedback: null,
        })
        .eq('id', existing.id)
        .select(
          'id, task_id, submission_url, notes, attachments, status, feedback, points_earned, submitted_at'
        )
        .single();
      if (error) return { error: error.message };
      revalidatePath('/account/member/bootcamps');
      revalidatePath('/account/mentor/tasks');
      return { success: 'Resubmission sent!', data };
    }

    const { data, error } = await supabaseAdmin
      .from('task_submissions')
      .insert({
        task_id: taskId,
        user_id: userId,
        submission_url: submissionUrl,
        notes,
        attachments,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      })
      .select(
        'id, task_id, submission_url, notes, attachments, status, feedback, points_earned, submitted_at'
      )
      .single();
    if (error) return { error: error.message };
    revalidatePath('/account/member/bootcamps');
    revalidatePath('/account/mentor/tasks');
    return { success: 'Task submitted!', data };
  } catch (err) {
    return { error: err.message };
  }
}
