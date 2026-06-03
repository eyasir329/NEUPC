/**
 * @file mentor actions
 * @module mentor-actions
 */

'use server';

import { auth } from '@/app/_lib/auth/auth';
import { getUserRoles, getUserByEmail } from '@/app/_lib/services/data-service';
import { supabaseAdmin as supabase } from '@/app/_lib/integrations/supabase';
import { revalidatePath, revalidateTag } from 'next/cache';
import {
  createMeetEvent,
  endMeetConference,
} from '@/app/_lib/integrations/google-meet';
import { uploadRecordingToDrive } from '@/app/_lib/integrations/gdrive';

// --- Auth Helper ---
async function requireMentor() {
  const session = await auth();
  if (!session?.user) throw new Error('Not authenticated');
  const roles = await getUserRoles(session.user.email);
  if (!roles.includes('mentor')) throw new Error('Not authorized as mentor');
  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active') throw new Error('Account not active');
  return user;
}

// --- Task Actions ---

export async function createWeeklyTaskAction(formData) {
  try {
    const mentor = await requireMentor();
    const title = formData.get('title')?.trim();
    const description = formData.get('description')?.trim();
    const difficulty = formData.get('difficulty') || 'medium';
    const deadline = formData.get('deadline');
    const start_time = formData.get('start_time') || null;
    const problem_links = formData.get('problem_links')
      ? formData
          .get('problem_links')
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
      : [];
    const target_audience = formData.get('target_audience')?.trim() || null;
    const task_type = formData.get('task_type')?.trim() || 'Exercise';
    const points = parseInt(formData.get('points') || '10', 10);

    if (!title || !deadline)
      return { error: 'Title and deadline are required' };
    if (start_time && new Date(start_time) >= new Date(deadline))
      return { error: 'Start time must be before the deadline' };

    const { data: inserted, error } = await supabase
      .from('weekly_tasks')
      .insert([
        {
          title,
          description,
          difficulty,
          start_time: start_time ? new Date(start_time).toISOString() : null,
          deadline: new Date(deadline).toISOString(),
          assigned_by: mentor.id,
          problem_links,
          target_audience,
          bootcamp_id: target_audience || null,
          task_type,
          points,
        },
      ])
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    const { data, error: fetchError } = await supabase
      .from('weekly_tasks')
      .select('*, users!weekly_tasks_assigned_by_fkey(id, full_name)')
      .eq('id', inserted.id)
      .single();

    if (fetchError) throw new Error(fetchError.message);
    revalidatePath('/account/mentor/tasks');
    revalidatePath('/account/member/bootcamps');
    return { success: 'Task created successfully', data };
  } catch (err) {
    return { error: err.message };
  }
}

export async function updateWeeklyTaskAction(formData) {
  try {
    const mentor = await requireMentor();
    const id = formData.get('id');
    const title = formData.get('title')?.trim();
    const description = formData.get('description')?.trim();
    const difficulty = formData.get('difficulty') || 'medium';
    const deadline = formData.get('deadline');
    const start_time = formData.get('start_time') || null;
    const task_type = formData.get('task_type')?.trim() || 'Exercise';
    const points = parseInt(formData.get('points') || '10', 10);
    const problem_links = formData.get('problem_links')
      ? formData
          .get('problem_links')
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
      : [];

    if (!id || !title || !deadline) return { error: 'Missing required fields' };
    if (start_time && new Date(start_time) >= new Date(deadline))
      return { error: 'Start time must be before the deadline' };

    // Only allow editing own tasks
    const { data: existing } = await supabase
      .from('weekly_tasks')
      .select('assigned_by')
      .eq('id', id)
      .single();
    if (existing?.assigned_by !== mentor.id)
      return { error: 'Not authorized to edit this task' };

    const { error } = await supabase
      .from('weekly_tasks')
      .update({
        title,
        description,
        difficulty,
        start_time: start_time ? new Date(start_time).toISOString() : null,
        deadline: new Date(deadline).toISOString(),
        problem_links,
        task_type,
        points,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/account/mentor/tasks');
    revalidatePath('/account/member/bootcamps');
    return { success: 'Task updated successfully' };
  } catch (err) {
    return { error: err.message };
  }
}

export async function deleteWeeklyTaskAction(formData) {
  try {
    const mentor = await requireMentor();
    const id = formData.get('id');

    const { data: existing } = await supabase
      .from('weekly_tasks')
      .select('assigned_by')
      .eq('id', id)
      .single();
    if (existing?.assigned_by !== mentor.id)
      return { error: 'Not authorized to delete this task' };

    const { error } = await supabase.from('weekly_tasks').delete().eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/account/mentor/tasks');
    revalidatePath('/account/member/bootcamps');
    return { success: 'Task deleted successfully' };
  } catch (err) {
    return { error: err.message };
  }
}

export async function reviewTaskSubmissionAction(formData) {
  try {
    const reviewer = await requireMentor();
    const submissionId = formData.get('submissionId');
    const status = formData.get('status');
    const feedback = formData.get('feedback')?.trim();
    const pointsRaw = formData.get('points_earned');
    const points_earned =
      pointsRaw !== null && pointsRaw !== '' ? Number(pointsRaw) : null;

    if (!submissionId || !status) return { error: 'Missing required fields' };

    const updatePayload = { reviewed_by: reviewer.id, status, feedback };
    if (points_earned !== null) updatePayload.points_earned = points_earned;

    const { error } = await supabase
      .from('task_submissions')
      .update(updatePayload)
      .eq('id', submissionId);

    if (error) throw new Error(error.message);
    revalidatePath('/account/mentor/tasks');
    revalidatePath('/account/member/bootcamps');
    return { success: 'Submission reviewed successfully' };
  } catch (err) {
    return { error: err.message };
  }
}

// --- Resource Actions ---

export async function createResourceAction(formData) {
  try {
    const mentor = await requireMentor();
    const title = formData.get('title')?.trim();
    const description = formData.get('description')?.trim();
    const url = formData.get('url')?.trim();
    const resource_type = formData.get('resource_type') || 'article';
    const category = formData.get('category')?.trim();
    const difficulty = formData.get('difficulty') || null;
    const is_free = formData.get('is_free') !== 'false';
    const tags = formData.get('tags')
      ? formData
          .get('tags')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    if (!title || !url || !category)
      return { error: 'Title, URL and category are required' };

    const { error } = await supabase.from('resources').insert([
      {
        title,
        description,
        url,
        resource_type,
        category,
        difficulty,
        is_free,
        tags,
        created_by: mentor.id,
      },
    ]);

    if (error) throw new Error(error.message);
    revalidatePath('/account/mentor/resources');
    revalidatePath('/account/member/resources');
    revalidateTag('roadmaps');
    revalidatePath('/roadmaps');
    return { success: 'Resource added successfully' };
  } catch (err) {
    return { error: err.message };
  }
}

export async function deleteResourceAction(formData) {
  try {
    const mentor = await requireMentor();
    const id = formData.get('id');

    const { data: existing } = await supabase
      .from('resources')
      .select('created_by')
      .eq('id', id)
      .single();
    if (existing?.created_by !== mentor.id)
      return { error: 'Not authorized to delete this resource' };

    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/account/mentor/resources');
    revalidatePath('/account/member/resources');
    revalidateTag('roadmaps');
    revalidatePath('/roadmaps');
    return { success: 'Resource deleted successfully' };
  } catch (err) {
    return { error: err.message };
  }
}

// --- Session Actions ---

export async function createMentorshipSessionAction(formData) {
  try {
    const mentor = await requireMentor();
    const mentorship_id = formData.get('mentorship_id');
    const topic = formData.get('topic')?.trim();
    const session_date = formData.get('session_date');
    const duration = parseInt(formData.get('duration')) || null;
    const notes = formData.get('notes')?.trim() || null;
    const attended =
      formData.get('attended') === 'on' || formData.get('attended') === 'true';

    if (!mentorship_id || !session_date)
      return { error: 'Mentorship and session date are required' };

    // Verify this mentorship belongs to this mentor
    const { data: ms } = await supabase
      .from('mentorships')
      .select('mentor_id')
      .eq('id', mentorship_id)
      .single();
    if (ms?.mentor_id !== mentor.id)
      return { error: 'Not authorized for this mentorship' };

    const { data, error } = await supabase
      .from('mentorship_sessions')
      .insert([
        {
          mentorship_id,
          topic,
          session_date: new Date(session_date).toISOString(),
          duration,
          notes,
          attended,
          created_by: mentor.id,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    revalidatePath('/account/mentor/sessions');
    return { success: 'Session scheduled successfully', session: data };
  } catch (err) {
    return { error: err.message };
  }
}

export async function updateSessionNotesAction(formData) {
  try {
    const mentor = await requireMentor();
    const sessionId = formData.get('sessionId');
    const notes = formData.get('notes')?.trim();
    const attended = formData.get('attended') === 'true';
    const feedback = formData.get('feedback')?.trim() || null;

    if (!sessionId) return { error: 'Session ID required' };

    // Verify mentor owns this session
    const { data: session } = await supabase
      .from('mentorship_sessions')
      .select('created_by')
      .eq('id', sessionId)
      .single();
    if (session?.created_by !== mentor.id)
      return { error: 'Not authorized to update this session' };

    const { error } = await supabase
      .from('mentorship_sessions')
      .update({ notes, attended, feedback })
      .eq('id', sessionId);

    if (error) throw new Error(error.message);
    revalidatePath('/account/mentor/sessions');
    return { success: 'Session updated successfully' };
  } catch (err) {
    return { error: err.message };
  }
}

export async function deleteSessionAction(formData) {
  try {
    const mentor = await requireMentor();
    const sessionId = formData.get('sessionId');

    const { data: session } = await supabase
      .from('mentorship_sessions')
      .select('created_by')
      .eq('id', sessionId)
      .single();
    if (session?.created_by !== mentor.id)
      return { error: 'Not authorized to delete this session' };

    const { error } = await supabase
      .from('mentorship_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw new Error(error.message);
    revalidatePath('/account/mentor/sessions');
    return { success: 'Session deleted successfully' };
  } catch (err) {
    return { error: err.message };
  }
}

// --- Schedule session with Google Meet ---

export async function scheduleSessionAction(formData) {
  try {
    const mentor = await requireMentor();

    const topic = formData.get('topic')?.trim();
    const description = formData.get('description')?.trim() || '';
    const scheduled_at = formData.get('scheduled_at'); // ISO string from datetime-local
    const duration = parseInt(formData.get('duration')) || 60;
    const mentorship_id = formData.get('mentorship_id') || null;
    const bootcamp_id = formData.get('bootcamp_id') || null;
    const target_type = formData.get('target_type') || 'all-bootcamp';
    const attendee_emails_raw = formData.get('attendee_emails') || '';
    const target_student_ids_raw = formData.get('target_student_ids') || '';
    const location = formData.get('location')?.trim() || null;

    if (!topic || !scheduled_at)
      return { error: 'Topic and scheduled time are required' };

    const startIso = new Date(scheduled_at).toISOString();
    const endIso = new Date(
      new Date(scheduled_at).getTime() + duration * 60_000
    ).toISOString();

    const attendeeEmails = attendee_emails_raw
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    let meetLink = null;
    let meetEventId = null;
    let meetErrorReason = null;
    if (!location) {
      try {
        const meet = await createMeetEvent({
          title: topic,
          description,
          startIso,
          endIso,
          attendeeEmails,
        });
        meetLink = meet.meetLink;
        meetEventId = meet.eventId;
      } catch (meetErr) {
        console.error('Google Meet creation failed:', meetErr.message);
        meetErrorReason = meetErr.message.includes('invalid_grant')
          ? 'Google OAuth token expired — run scripts/get-meet-refresh-token.mjs to refresh it.'
          : meetErr.message;
      }
    }

    const target_student_ids = target_student_ids_raw
      ? target_student_ids_raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

    const insertRow = {
      topic,
      description,
      session_date: startIso,
      scheduled_at: startIso,
      duration,
      status: 'scheduled',
      meet_link: meetLink,
      meet_space_id: meetLink ? meetEventId : null,
      target_type,
      target_student_ids,
      location,
      created_by: mentor.id,
    };
    if (mentorship_id) insertRow.mentorship_id = mentorship_id;
    if (bootcamp_id) insertRow.bootcamp_id = bootcamp_id;

    const { data: session, error } = await supabase
      .from('mentorship_sessions')
      .insert([insertRow])
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/account/mentor/sessions');
    return {
      success: true,
      session,
      meetLink,
      meetWarning: location
        ? null
        : meetLink
          ? null
          : meetErrorReason
            ? `Meet link failed: ${meetErrorReason}`
            : 'Session saved but Google Meet link could not be created.',
    };
  } catch (err) {
    return { error: err.message };
  }
}

export async function updateScheduledSessionAction(formData) {
  try {
    const mentor = await requireMentor();
    const sessionId = formData.get('sessionId');

    const { data: existingSession } = await supabase
      .from('mentorship_sessions')
      .select('created_by')
      .eq('id', sessionId)
      .single();

    if (existingSession?.created_by !== mentor.id)
      return { error: 'Not authorized to update this session' };

    const topic = formData.get('topic')?.trim();
    const description = formData.get('description')?.trim() || '';
    const scheduled_at = formData.get('scheduled_at'); // ISO string from datetime-local
    const duration = parseInt(formData.get('duration')) || 60;
    const bootcamp_id = formData.get('bootcamp_id') || null;
    const target_type = formData.get('target_type') || 'all-bootcamp';
    const target_student_ids_raw = formData.get('target_student_ids') || '';

    if (!topic || !scheduled_at)
      return { error: 'Topic and scheduled time are required' };

    const startIso = new Date(scheduled_at).toISOString();

    const target_student_ids = target_student_ids_raw
      ? target_student_ids_raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

    const location = formData.get('location')?.trim() || null;

    const updateRow = {
      topic,
      description,
      session_date: startIso,
      scheduled_at: startIso,
      duration,
      target_type,
      target_student_ids,
      bootcamp_id,
      location,
    };

    const { data: session, error } = await supabase
      .from('mentorship_sessions')
      .update(updateRow)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/account/mentor/sessions');
    return {
      success: true,
      session,
    };
  } catch (err) {
    return { error: err.message };
  }
}

// --- Log a past (already-happened) session ---

export async function logPastSessionAction(formData) {
  try {
    const mentor = await requireMentor();

    const topic = formData.get('topic')?.trim();
    const description = formData.get('description')?.trim() || '';
    const scheduled_at = formData.get('scheduled_at');
    const duration = parseInt(formData.get('duration')) || 60;
    const bootcamp_id = formData.get('bootcamp_id') || null;
    const target_type = formData.get('target_type') || 'all-bootcamp';
    const target_student_ids_raw = formData.get('target_student_ids') || '';
    const attended =
      formData.get('attended') === 'on' || formData.get('attended') === 'true';
    const location = formData.get('location')?.trim() || null;

    if (!topic || !scheduled_at)
      return { error: 'Topic and session time are required' };

    const startIso = new Date(scheduled_at).toISOString();
    if (new Date(startIso).getTime() > Date.now())
      return { error: 'Logged sessions must be in the past' };

    const target_student_ids = target_student_ids_raw
      ? target_student_ids_raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

    const attendance_data = (target_student_ids ?? []).map((uid) => ({
      user_id: uid,
      attended,
      points: 0,
    }));

    const insertRow = {
      topic,
      description,
      session_date: startIso,
      scheduled_at: startIso,
      duration,
      status: 'completed',
      meet_link: null,
      meet_space_id: null,
      target_type,
      target_student_ids,
      attendance_data,
      location,
      created_by: mentor.id,
    };
    if (bootcamp_id) insertRow.bootcamp_id = bootcamp_id;

    const { data: session, error } = await supabase
      .from('mentorship_sessions')
      .insert([insertRow])
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/account/mentor/sessions');
    return { success: true, session };
  } catch (err) {
    return { error: err.message };
  }
}

// --- Fetch scheduled sessions for this mentor ---

export async function getMentorScheduledSessionsAction() {
  try {
    const mentor = await requireMentor();

    const { data, error } = await supabase
      .from('mentorship_sessions')
      .select('*')
      .eq('created_by', mentor.id)
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true });

    if (error) throw new Error(error.message);
    return { sessions: data };
  } catch (err) {
    return { error: err.message, sessions: [] };
  }
}

// --- Fetch completed (past) bootcamp sessions for this mentor ---

export async function getMentorPastScheduledSessionsAction() {
  try {
    const mentor = await requireMentor();

    const { data, error } = await supabase
      .from('mentorship_sessions')
      .select('*')
      .eq('created_by', mentor.id)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false });

    if (error) throw new Error(error.message);
    return { sessions: data ?? [] };
  } catch (err) {
    return { error: err.message, sessions: [] };
  }
}

// --- Cancel a scheduled session ---

export async function cancelSessionAction(formData) {
  try {
    const mentor = await requireMentor();
    const sessionId = formData.get('sessionId');

    const { data: session } = await supabase
      .from('mentorship_sessions')
      .select('created_by')
      .eq('id', sessionId)
      .single();
    if (session?.created_by !== mentor.id) return { error: 'Not authorized' };

    const { error } = await supabase
      .from('mentorship_sessions')
      .update({ status: 'cancelled' })
      .eq('id', sessionId);

    if (error) throw new Error(error.message);
    revalidatePath('/account/mentor/sessions');
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

export async function endSessionAction(formData) {
  try {
    const mentor = await requireMentor();
    const sessionId = formData.get('sessionId');

    const { data: session } = await supabase
      .from('mentorship_sessions')
      .select(
        'created_by, scheduled_at, duration, topic, target_type, target_student_ids, bootcamp_id, meet_link, meet_space_id, description'
      )
      .eq('id', sessionId)
      .single();
    if (session?.created_by !== mentor.id) return { error: 'Not authorized' };

    // Initialize attendance_data with one entry per invited student (all absent, 0 pts)
    const studentIds = session.target_student_ids ?? [];
    const attendance_data = studentIds.map((uid) => ({
      user_id: uid,
      attended: false,
      points: 0,
    }));

    const { error } = await supabase
      .from('mentorship_sessions')
      .update({
        status: 'completed',
        attendance_data,
        meet_link: null,
        meet_space_id: null,
      })
      .eq('id', sessionId);

    if (error) throw new Error(error.message);

    // End the Google Meet conference so the link becomes invalid
    if (session.meet_space_id) {
      await endMeetConference(session.meet_space_id).catch(() => {});
    }

    revalidatePath('/account/mentor/sessions');
    return { success: true, session, attendance_data };
  } catch (err) {
    return { error: err.message };
  }
}

export async function saveSessionAttendanceAction(formData) {
  try {
    const mentor = await requireMentor();
    const sessionId = formData.get('sessionId');
    const attendance_data = JSON.parse(formData.get('attendance_data'));

    const { data: session } = await supabase
      .from('mentorship_sessions')
      .select('created_by')
      .eq('id', sessionId)
      .single();
    if (session?.created_by !== mentor.id) return { error: 'Not authorized' };

    const { error } = await supabase
      .from('mentorship_sessions')
      .update({ attendance_data })
      .eq('id', sessionId);

    if (error) throw new Error(error.message);
    revalidatePath('/account/mentor/sessions');
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

// --- Recommendations / Progress Notes ---

export async function getMemberProgressAction(menteeId) {
  try {
    await requireMentor();
    const { data, error } = await supabase
      .from('member_progress')
      .select('*')
      .eq('user_id', menteeId)
      .order('start_date', { ascending: false });
    if (error) throw new Error(error.message);
    return { progress: data ?? [] };
  } catch (err) {
    return { error: err.message, progress: [] };
  }
}

export async function saveMentorNotesAction(formData) {
  try {
    const mentor = await requireMentor();
    const menteeId = formData.get('menteeId');
    const period = formData.get('period')?.trim();
    const mentor_notes = formData.get('mentor_notes')?.trim();
    const start_date = formData.get('start_date');
    const end_date = formData.get('end_date');
    const problems_solved = parseInt(formData.get('problems_solved')) || 0;
    const contests_participated =
      parseInt(formData.get('contests_participated')) || 0;

    if (!menteeId || !period || !start_date || !end_date)
      return { error: 'Required fields missing' };

    // Upsert member_progress
    const { data: existing } = await supabase
      .from('member_progress')
      .select('id')
      .eq('user_id', menteeId)
      .eq('period', period)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from('member_progress')
        .update({ mentor_notes, problems_solved, contests_participated })
        .eq('id', existing.id));
    } else {
      ({ error } = await supabase.from('member_progress').insert([
        {
          user_id: menteeId,
          period,
          start_date,
          end_date,
          mentor_notes,
          problems_solved,
          contests_participated,
        },
      ]));
    }

    if (error) throw new Error(error.message);
    revalidatePath('/account/mentor/assigned-members');
    return { success: 'Notes saved successfully' };
  } catch (err) {
    return { error: err.message };
  }
}

// --- Mentorship Status Update ---

export async function updateMentorshipStatusAction(formData) {
  try {
    const mentor = await requireMentor();
    const mentorshipId = formData.get('mentorshipId');
    const status = formData.get('status');
    const notes = formData.get('notes')?.trim() || null;

    const { data: ms } = await supabase
      .from('mentorships')
      .select('mentor_id')
      .eq('id', mentorshipId)
      .single();
    if (ms?.mentor_id !== mentor.id)
      return { error: 'Not authorized for this mentorship' };

    const { error } = await supabase
      .from('mentorships')
      .update({ status, notes, updated_at: new Date().toISOString() })
      .eq('id', mentorshipId);

    if (error) throw new Error(error.message);
    revalidatePath('/account/mentor/assigned-members');
    return { success: 'Mentorship status updated' };
  } catch (err) {
    return { error: err.message };
  }
}

// --- Upload session recording to Google Drive ---

export async function uploadSessionRecordingAction(formData) {
  try {
    const mentor = await requireMentor();
    const sessionId = formData.get('sessionId');
    const file = formData.get('recording'); // File object

    if (!sessionId || !file || file.size === 0)
      return { error: 'Session ID and recording file are required' };

    // Verify mentor owns this session
    const { data: session } = await supabase
      .from('mentorship_sessions')
      .select('created_by, topic, scheduled_at, session_date')
      .eq('id', sessionId)
      .single();
    if (session?.created_by !== mentor.id)
      return { error: 'Not authorized for this session' };

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'mp4';
    const date = (
      session.scheduled_at ||
      session.session_date ||
      new Date().toISOString()
    ).slice(0, 10);
    const safeTopic = (session.topic || 'session')
      .replace(/[^a-z0-9]+/gi, '-')
      .toLowerCase()
      .slice(0, 40);
    const filename = `${date}_${safeTopic}_${sessionId.slice(0, 8)}.${ext}`;

    const { driveUrl } = await uploadRecordingToDrive(
      buffer,
      filename,
      file.type
    );

    const { error } = await supabase
      .from('mentorship_sessions')
      .update({ recording_url: driveUrl })
      .eq('id', sessionId);

    if (error) throw new Error(error.message);
    revalidatePath('/account/mentor/sessions');
    return { success: true, recordingUrl: driveUrl };
  } catch (err) {
    return { error: err.message };
  }
}
