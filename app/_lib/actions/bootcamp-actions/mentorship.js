'use server';

/**
 * @file Bootcamp mentorship server actions (split from bootcamp-actions).
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
  requireAdmin,
  requireAdminOrBootcampMentor,
  requireAnyRole,
} from './_helpers';

// ─────────────────────────────────────────────────────────────────────────────
// BOOTCAMP MENTORS
// ─────────────────────────────────────────────────────────────────────────────
export async function getBootcampMentors(bootcampId) {
  await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from('bootcamp_mentors')
    .select('id, assigned_at, users(id, full_name, avatar_url, email)')
    .eq('bootcamp_id', bootcampId)
    .order('assigned_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addBootcampMentor(bootcampId, userId) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from('bootcamp_mentors')
    .insert({ bootcamp_id: bootcampId, user_id: userId });
  if (error) throw error;
  revalidatePath(`/account/admin/bootcamps/${bootcampId}`);
}

export async function removeBootcampMentor(bootcampId, userId) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from('bootcamp_mentors')
    .delete()
    .eq('bootcamp_id', bootcampId)
    .eq('user_id', userId);
  if (error) throw error;
  revalidatePath(`/account/admin/bootcamps/${bootcampId}`);
}

export async function searchMentorUsers(query) {
  await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select(
      'users!user_roles_user_id_fkey(id, full_name, avatar_url, email), roles!inner(name)'
    )
    .eq('roles.name', 'mentor');
  if (error) throw error;
  const q = query.toLowerCase();
  return (data || [])
    .map((r) => r.users)
    .filter((u) => u?.full_name?.toLowerCase().includes(q))
    .slice(0, 10);
}

/**
 * Get bootcamps assigned to the current mentor user.
 */
export async function getMentorAssignedBootcamps() {
  const userId = await requireAnyRole(['admin', 'executive', 'mentor']);

  const { data, error } = await supabaseAdmin
    .from('bootcamp_mentors')
    .select(
      'assigned_at, bootcamps(id, title, slug, description, thumbnail, status, batch_info, start_date, end_date, total_lessons, total_duration, is_featured)'
    )
    .eq('user_id', userId)
    .order('assigned_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((r) => r.bootcamps).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// MENTOR BOOTCAMP ACTIONS
// All queries are gated by requireAdminOrBootcampMentor(bootcampId).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get enrolled members with progress for a specific bootcamp (mentor access).
 */
export async function getMentorBootcampMembers(bootcampId) {
  await requireAdminOrBootcampMentor(bootcampId);

  const { data: bootcamp } = await supabaseAdmin
    .from('bootcamps')
    .select('total_lessons')
    .eq('id', bootcampId)
    .single();

  const totalLessons = bootcamp?.total_lessons || 0;

  const { data: enrollments, error } = await supabaseAdmin
    .from('enrollments')
    .select(
      'id, user_id, status, enrolled_at, users(id, full_name, email, avatar_url, member_profiles(academic_session, student_id, department, semester))'
    )
    .eq('bootcamp_id', bootcampId)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;

  const userIds = (enrollments || []).map((e) => e.user_id);
  if (userIds.length === 0) return { members: [], totalLessons };

  const { data: progressRows } = await supabaseAdmin
    .from('user_progress')
    .select('user_id, is_completed')
    .eq('bootcamp_id', bootcampId)
    .eq('is_completed', true)
    .in('user_id', userIds);

  const completedMap = {};
  (progressRows || []).forEach((p) => {
    completedMap[p.user_id] = (completedMap[p.user_id] || 0) + 1;
  });

  const members = (enrollments || []).map((e) => ({
    ...e,
    completed_lessons: completedMap[e.user_id] || 0,
    progress_percent:
      totalLessons > 0
        ? Math.round(((completedMap[e.user_id] || 0) / totalLessons) * 100)
        : 0,
  }));

  return { members, totalLessons };
}

/**
 * Get mentorships + sessions for members enrolled in a specific bootcamp.
 * Links: enrollments(bootcamp_id) → user_id → mentorships(mentee_id) where mentor = current user.
 */
export async function getMentorBootcampSessions(bootcampId) {
  const mentorId = await requireAdminOrBootcampMentor(bootcampId);

  // All mentorships this mentor has (not limited to bootcamp enrollments)
  const { data: mentorships } = await supabaseAdmin
    .from('mentorships')
    .select(
      'id, mentee_id, users!mentorships_mentee_id_fkey(id, full_name, avatar_url)'
    )
    .eq('mentor_id', mentorId);

  if (!mentorships?.length) return [];

  const mentorshipIds = mentorships.map((m) => m.id);
  const menteeMap = Object.fromEntries(
    mentorships.map((m) => [m.id, m['users!mentorships_mentee_id_fkey']])
  );

  const { data: sessions, error } = await supabaseAdmin
    .from('mentorship_sessions')
    .select('*')
    .in('mentorship_id', mentorshipIds)
    .order('session_date', { ascending: false });

  if (error) throw error;

  return (sessions || []).map((s) => ({
    ...s,
    mentee: menteeMap[s.mentorship_id] || null,
  }));
}

/**
 * Get mentorships (with notes + progress) for enrolled members of a bootcamp.
 */
export async function getMentorBootcampMentorships(bootcampId) {
  const mentorId = await requireAdminOrBootcampMentor(bootcampId);

  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select(
      'user_id, users(id, full_name, email, member_profiles(academic_session, student_id, department, skills))'
    )
    .eq('bootcamp_id', bootcampId);

  const userIds = (enrollments || []).map((e) => e.user_id);
  if (userIds.length === 0) return [];

  // Existing mentorships for this mentor with these enrolled members
  const { data: mentorships } = await supabaseAdmin
    .from('mentorships')
    .select('id, mentee_id, status, focus_area, notes')
    .eq('mentor_id', mentorId)
    .in('mentee_id', userIds);

  const mentorshipByMentee = Object.fromEntries(
    (mentorships || []).map((m) => [m.mentee_id, m])
  );

  // Collect all mentee IDs (enrolled members, regardless of having a mentorship)
  const menteeIds = userIds;

  const { data: progressRows } = await supabaseAdmin
    .from('member_progress')
    .select(
      'user_id, period, problems_solved, contests_participated, mentor_notes'
    )
    .in('user_id', menteeIds)
    .order('period', { ascending: false });

  const progressByMentee = {};
  (progressRows || []).forEach((p) => {
    if (!progressByMentee[p.user_id]) progressByMentee[p.user_id] = [];
    progressByMentee[p.user_id].push(p);
  });

  // Return one record per enrolled member — using mentorship if it exists, else synthetic stub
  return (enrollments || []).map((e) => {
    const u = e.users;
    const ms = mentorshipByMentee[e.user_id];
    return {
      id: ms?.id || `enr_${e.user_id}`,
      mentee_id: e.user_id,
      status: ms?.status || 'none',
      focus_area: ms?.focus_area || null,
      notes: ms?.notes || null,
      'users!mentorships_mentee_id_fkey': u,
      users: u,
      member_progress: progressByMentee[e.user_id] || [],
      _no_mentorship: !ms,
    };
  });
}

/**
 * Save mentor notes/recommendation for a mentorship (bootcamp context).
 * Migration needed for bootcamp_help_requests table (see below).
 */
export async function saveBootcampMentorshipNotesAction(formData) {
  'use server';
  try {
    const bootcampId = formData.get('bootcamp_id');
    const mentorId = await requireAdminOrBootcampMentor(bootcampId);
    const menteeUserId = formData.get('mentee_user_id');
    const notes = cleanRichText(formData.get('notes')?.trim() || '', 20000);

    if (!menteeUserId) return { error: 'Missing mentee' };

    // Upsert mentorship so notes can always be saved regardless of prior mentorship existence
    const { data: existing } = await supabaseAdmin
      .from('mentorships')
      .select('id, mentor_id')
      .eq('mentor_id', mentorId)
      .eq('mentee_id', menteeUserId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin
        .from('mentorships')
        .update({ notes })
        .eq('id', existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from('mentorships').insert([
        {
          mentor_id: mentorId,
          mentee_id: menteeUserId,
          notes,
          status: 'active',
          start_date: new Date().toISOString().slice(0, 10),
        },
      ]);
      if (error) throw new Error(error.message);
    }

    revalidatePath(`/account/mentor/bootcamps/${bootcampId}`);
    return { success: 'Notes saved' };
  } catch (err) {
    return { error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MENTOR: DETAILED STUDENT STATS FOR DRAWER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a fully detailed breakdown of a student's performance in a bootcamp,
 * including lesson points, task scores, exam scores, and session attendance.
 * Accessible by admins and assigned mentors.
 */
export async function getMentorStudentDetailedStats(bootcampId, userId) {
  await requireAdminOrBootcampMentor(bootcampId);

  // 1. Fetch curriculum with lesson metadata in parallel with all progress data
  const [
    curriculumResult,
    progressResult,
    taskSubsResult,
    examSubsResult,
    sessionsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from('bootcamps')
      .select(
        `
        title,
        courses (
          id, title, order_index,
          modules (
            id, title, order_index,
            lessons (
              id, title, order_index, duration, is_published,
              video_source, video_id, type, exam_type,
              random_question_count, weight, points, practice_problems
            )
          )
        )
      `
      )
      .eq('id', bootcampId)
      .single(),

    supabaseAdmin
      .from('user_progress')
      .select(
        'lesson_id, is_completed, completed_at, watch_time, last_position, solved_problems'
      )
      .eq('bootcamp_id', bootcampId)
      .eq('user_id', userId),

    supabaseAdmin
      .from('task_submissions')
      .select(
        `
        id, status, points_earned, submitted_at, feedback,
        weekly_tasks!inner (id, title, bootcamp_id, deadline)
      `
      )
      .eq('user_id', userId)
      .eq('weekly_tasks.bootcamp_id', bootcampId),

    supabaseAdmin
      .from('exam_submissions')
      .select('id, lesson_id, score, status, submitted_at, graded_at')
      .eq('user_id', userId)
      .eq('bootcamp_id', bootcampId),

    supabaseAdmin
      .from('mentorship_sessions')
      .select('id, topic, session_date, attendance_data')
      .eq('bootcamp_id', bootcampId)
      .order('session_date', { ascending: false }),
  ]);

  const curriculum = curriculumResult.data;
  const progressRows = progressResult.data || [];
  const taskSubs = taskSubsResult.data || [];
  const examSubs = examSubsResult.data || [];
  const sessions = sessionsResult.data || [];

  // 2. Build a progress map by lesson_id
  const progressMap = {};
  progressRows.forEach((p) => {
    progressMap[p.lesson_id] = p;
  });

  // 3. Build exam submission map by lesson_id
  const examMap = {};
  examSubs.forEach((e) => {
    examMap[e.lesson_id] = e;
  });

  // 4. Attach progress + exam data to curriculum lessons
  let lessonScore = 0;
  if (curriculum?.courses) {
    curriculum.courses.sort((a, b) => a.order_index - b.order_index);
    curriculum.courses.forEach((course) => {
      course.modules?.sort((a, b) => a.order_index - b.order_index);
      course.modules?.forEach((module) => {
        module.lessons?.sort((a, b) => a.order_index - b.order_index);
        module.lessons = module.lessons?.map((lesson) => {
          const prog = progressMap[lesson.id] || null;
          const examSub = examMap[lesson.id] || null;

          // Compute lesson-level score contribution
          if (prog?.is_completed) {
            const pts = lesson.points ?? 10;
            if (lesson.type === 'lesson' || lesson.type === 'video') {
              lessonScore += pts;
            } else if (lesson.type === 'practice') {
              const problems = lesson.practice_problems || [];
              const solved = prog.solved_problems || [];
              if (problems.length > 0) {
                let totalPts = 0,
                  solvedPts = 0;
                problems.forEach((prob, idx) => {
                  const p = Number(prob?.points) || 5;
                  totalPts += p;
                  if (solved.includes(idx)) solvedPts += p;
                });
                if (totalPts > 0)
                  lessonScore += Math.floor((solvedPts / totalPts) * pts);
              } else {
                lessonScore += pts;
              }
            }
          }

          return { ...lesson, progress: prog, examSubmission: examSub };
        });
      });
    });
  }

  // 5. Aggregate task, exam, session scores
  const taskScore = taskSubs
    .filter((s) => s.status === 'graded')
    .reduce((sum, s) => sum + (s.points_earned || 0), 0);

  const examScore = examSubs
    .filter((s) => s.status === 'graded')
    .reduce((sum, s) => sum + (s.score || 0), 0);

  let sessionScore = 0;
  let sessionsAttended = 0;
  const sessionDetails = sessions.map((s) => {
    const myAttendance = Array.isArray(s.attendance_data)
      ? s.attendance_data.find((a) => a.user_id === userId)
      : null;
    if (myAttendance?.attended) {
      sessionsAttended += 1;
      sessionScore += myAttendance.points || 0;
    }
    return {
      id: s.id,
      topic: s.topic,
      session_date: s.session_date,
      attended: myAttendance?.attended ?? false,
      points: myAttendance?.points || 0,
    };
  });

  const totalScore = lessonScore + taskScore + examScore + sessionScore;

  // 6. Compute aggregates
  const allLessons =
    curriculum?.courses?.flatMap(
      (c) => c.modules?.flatMap((m) => m.lessons || []) || []
    ) || [];
  const lessonsCompleted = allLessons.filter(
    (l) => l.progress?.is_completed
  ).length;
  const totalWatchTime = progressRows.reduce(
    (sum, p) => sum + (p.watch_time || 0),
    0
  );
  const practiceSolved = progressRows.reduce((sum, p) => {
    if (Array.isArray(p.solved_problems)) return sum + p.solved_problems.length;
    return sum;
  }, 0);

  return {
    curriculum,
    scoreBreakdown: {
      lesson: lessonScore,
      task: taskScore,
      exam: examScore,
      session: sessionScore,
      total: totalScore,
    },
    lessonsCompleted,
    totalWatchTime,
    practiceSolved,
    taskSubmissions: taskSubs,
    examSubmissions: examSubs,
    sessionDetails,
    sessionsAttended,
  };
}
