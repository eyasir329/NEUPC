'use server';

/**
 * @file Bootcamp sessions server actions (split from bootcamp-actions).
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

import { getCurrentUserId, requireAdminOrBootcampMentor } from './_helpers';

/**
 * Create a mentorship session linked to a bootcamp member.
 */
export async function createBootcampSessionAction(formData) {
  'use server';
  try {
    const bootcampId = formData.get('bootcamp_id');
    const mentorId = await requireAdminOrBootcampMentor(bootcampId);
    // member_user_id: the enrolled member's user ID (from the dropdown)
    const member_user_id = formData.get('member_user_id');
    const topic = cleanPlainText(formData.get('topic')?.trim(), 300);
    const session_date = formData.get('session_date');
    const duration = parseInt(formData.get('duration') || '60') || null;
    const notes =
      cleanRichText(formData.get('notes')?.trim() || '', 20000) || null;

    if (!member_user_id || !topic || !session_date)
      return { error: 'Member, topic and date are required' };

    // Upsert a mentorship for this mentor→member pair (create if missing)
    let mentorshipId;
    const { data: existing } = await supabaseAdmin
      .from('mentorships')
      .select('id')
      .eq('mentor_id', mentorId)
      .eq('mentee_id', member_user_id)
      .maybeSingle();

    if (existing) {
      mentorshipId = existing.id;
    } else {
      const { data: created, error: createErr } = await supabaseAdmin
        .from('mentorships')
        .insert([
          {
            mentor_id: mentorId,
            mentee_id: member_user_id,
            status: 'active',
            start_date: new Date().toISOString().slice(0, 10),
          },
        ])
        .select('id')
        .single();
      if (createErr) throw new Error(createErr.message);
      mentorshipId = created.id;
    }

    const { data: session, error } = await supabaseAdmin
      .from('mentorship_sessions')
      .insert([
        {
          mentorship_id: mentorshipId,
          topic,
          session_date: new Date(session_date).toISOString(),
          duration,
          notes,
          created_by: mentorId,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    revalidatePath(`/account/mentor/bootcamps/${bootcampId}`);
    return { success: 'Session scheduled', data: session, mentorshipId };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Update session attendance + notes.
 */
export async function updateBootcampSessionAction(formData) {
  'use server';
  try {
    const bootcampId = formData.get('bootcamp_id');
    const mentorId = await requireAdminOrBootcampMentor(bootcampId);
    const sessionId = formData.get('session_id');
    const notes =
      cleanRichText(formData.get('notes')?.trim() || '', 20000) || null;
    const attended = formData.get('attended') === 'true';

    // Verify mentor owns the mentorship linked to this session
    const { data: session } = await supabaseAdmin
      .from('mentorship_sessions')
      .select('mentorship_id, mentorships(mentor_id)')
      .eq('id', sessionId)
      .single();
    if (session?.mentorships?.mentor_id !== mentorId)
      return { error: 'Not authorized' };

    const { error } = await supabaseAdmin
      .from('mentorship_sessions')
      .update({ notes, attended })
      .eq('id', sessionId);

    if (error) throw new Error(error.message);
    revalidatePath(`/account/mentor/bootcamps/${bootcampId}`);
    return { success: 'Session updated' };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Member: get mentorship sessions for their mentorship(s) related to a bootcamp.
 * Finds mentorships where the member is the mentee, then returns sessions from those.
 */
export async function getMemberBootcampSessions(bootcampId) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  // Member must be enrolled
  const { data: enr } = await supabaseAdmin
    .from('enrollments')
    .select('id')
    .eq('bootcamp_id', bootcampId)
    .eq('user_id', userId)
    .in('status', ['active', 'completed'])
    .maybeSingle();
  if (!enr) return [];

  const COLS =
    'id, topic, description, session_date, scheduled_at, duration, attended, notes, status, meet_link, recording_url, target_type, target_student_ids, mentorship_id, bootcamp_id, created_by, attendance_data, location';

  // 1. Bootcamp-wide sessions (broadcast or group) tied to this bootcamp
  const { data: bcSessions } = await supabaseAdmin
    .from('mentorship_sessions')
    .select(COLS)
    .eq('bootcamp_id', bootcampId)
    .neq('status', 'cancelled')
    .order('session_date', { ascending: false });

  // Filter sessions to only those this member can see
  const visibleBcSessions = (bcSessions || []).filter((s) => {
    if (s.target_type === 'all-bootcamp') return true;
    if (s.target_type === 'selected-group')
      return (s.target_student_ids || []).includes(userId);
    if (s.target_type === 'one-on-one')
      return (s.target_student_ids || []).includes(userId);
    return true; // no target_type set — show to all enrolled members
  });

  // 2. 1:1 mentorship sessions for mentorships within this bootcamp
  const { data: mentorRows } = await supabaseAdmin
    .from('bootcamp_mentors')
    .select('user_id')
    .eq('bootcamp_id', bootcampId);

  const mentorIds = (mentorRows || []).map((r) => r.user_id);

  let mentorshipSessions = [];
  let mentorMap = {};

  if (mentorIds.length > 0) {
    const { data: mentorships } = await supabaseAdmin
      .from('mentorships')
      .select(
        'id, mentor_id, users!mentorships_mentor_id_fkey(id, full_name, avatar_url)'
      )
      .eq('mentee_id', userId)
      .in('mentor_id', mentorIds);

    if (mentorships?.length) {
      const mentorshipIds = mentorships.map((m) => m.id);
      mentorMap = Object.fromEntries(
        mentorships.map((m) => [m.id, m['users!mentorships_mentor_id_fkey']])
      );

      const { data: msSessions } = await supabaseAdmin
        .from('mentorship_sessions')
        .select(COLS)
        .in('mentorship_id', mentorshipIds)
        .neq('status', 'cancelled')
        .order('session_date', { ascending: false });

      mentorshipSessions = (msSessions || []).map((s) => ({
        ...s,
        mentor: mentorMap[s.mentorship_id] || null,
      }));
    }
  }

  // Fetch mentor info for bootcamp sessions (created_by)
  const creatorIds = [
    ...new Set(visibleBcSessions.map((s) => s.created_by).filter(Boolean)),
  ];
  let creatorMap = {};
  if (creatorIds.length > 0) {
    const { data: creators } = await supabaseAdmin
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', creatorIds);
    creatorMap = Object.fromEntries((creators || []).map((u) => [u.id, u]));
  }

  const bcSessionsMapped = visibleBcSessions.map((s) => ({
    ...s,
    mentor: creatorMap[s.created_by] || null,
  }));

  // Merge, deduplicate by id, sort by session_date desc
  const all = [...bcSessionsMapped, ...mentorshipSessions];
  const seen = new Set();
  const deduped = all.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
  deduped.sort((a, b) => new Date(b.session_date) - new Date(a.session_date));
  return deduped;
}
