'use server';

/**
 * @file Bootcamp enrollment server actions (split from bootcamp-actions).
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
  getCurrentUserId,
  requireAdmin,
  requireAdminOrBootcampMentor,
  requireLessonAccess,
} from './_helpers';

// ─────────────────────────────────────────────────────────────────────────────
// ENROLLMENT ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all enrollments for a bootcamp (admin).
 */
export async function getBootcampEnrollments(bootcampId) {
  await requireAdminOrBootcampMentor(bootcampId);

  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .select(
      `
      *,
      users (id, full_name, email, avatar_url)
    `
    )
    .eq('bootcamp_id', bootcampId)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get user's enrolled bootcamps.
 */
export async function getMyEnrollments() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .select(
      `
      *,
      bootcamps (
        id, title, slug, thumbnail, total_lessons, total_duration, status
      )
    `
    )
    .eq('user_id', userId)
    .in('status', ['active', 'completed', 'pending'])
    .order('last_accessed_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data;
}

/**
 * Enroll a user in a bootcamp.
 */
export async function enrollUser(bootcampId, userId = null) {
  // If no userId, use current user
  if (!userId) {
    userId = await getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');
  } else {
    // Only admins can enroll other users
    await requireAdmin();
  }

  // Get bootcamp enrollment_type
  const { data: bootcamp } = await supabaseAdmin
    .from('bootcamps')
    .select('enrollment_type')
    .eq('id', bootcampId)
    .single();
  const enrollmentType = bootcamp?.enrollment_type || 'approval';
  const newStatus = enrollmentType === 'open' ? 'active' : 'pending';

  // Check if already enrolled
  const { data: existing } = await supabaseAdmin
    .from('enrollments')
    .select('id, status')
    .eq('user_id', userId)
    .eq('bootcamp_id', bootcampId)
    .single();

  if (existing) {
    if (existing.status === 'active') {
      return { success: false, error: 'Already enrolled' };
    }
    if (existing.status === 'pending') {
      return { success: false, error: 'Enrollment request already pending' };
    }
    // Reactivate cancelled/expired enrollment
    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .update({ status: newStatus, enrolled_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/account/member/bootcamps');
    return { success: true, enrollment: data, status: newStatus };
  }

  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .insert({
      user_id: userId,
      bootcamp_id: bootcampId,
      status: newStatus,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/account/member/bootcamps');
  return { success: true, enrollment: data, status: newStatus };
}

/**
 * Cancel an enrollment.
 */
export async function cancelEnrollment(enrollmentId) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  // Users can cancel their own, admins can cancel any
  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('user_id')
    .eq('id', enrollmentId)
    .single();

  if (enrollment?.user_id !== userId) {
    await requireAdmin();
  }

  const { error } = await supabaseAdmin
    .from('enrollments')
    .update({ status: 'cancelled' })
    .eq('id', enrollmentId);

  if (error) throw error;

  revalidatePath('/account/member/bootcamps');
  return { success: true };
}

/**
 * Update enrollment access timestamp.
 */
export async function updateEnrollmentAccess(bootcampId) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  await supabaseAdmin
    .from('enrollments')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('bootcamp_id', bootcampId);
}

/**
 * Check if current user is enrolled in a bootcamp.
 */
export async function checkEnrollment(bootcampId) {
  const userId = await getCurrentUserId();
  if (!userId) return { enrolled: false };

  const { data } = await supabaseAdmin
    .from('enrollments')
    .select('id, status, progress_percent, score')
    .eq('user_id', userId)
    .eq('bootcamp_id', bootcampId)
    .single();

  return {
    enrolled: data?.status === 'active' || data?.status === 'completed',
    enrollment: data,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get user's progress for a bootcamp.
 */
export async function getBootcampProgress(bootcampId) {
  const userId = await getCurrentUserId();
  if (!userId) return { progress: [], lessonProgress: {} };

  const { data, error } = await supabaseAdmin
    .from('user_progress')
    .select('*, lessons(title)')
    .eq('user_id', userId)
    .eq('bootcamp_id', bootcampId);

  if (error) throw error;

  // Convert to a map for easy lookup
  const lessonProgress = {};
  data?.forEach((p) => {
    lessonProgress[p.lesson_id] = { ...p, lesson_title: p.lessons?.title };
  });

  return { progress: data || [], lessonProgress };
}

/**
 * Increment cumulative watch_time for a lesson and update last_position.
 * Use this for periodic ticks from the player. `deltaSeconds` is how many
 * seconds of *new* playback have elapsed since the last tick.
 * Pass `bootcampId` from the client to skip the lesson join query.
 */
export async function updateWatchTimeDelta(
  lessonId,
  deltaSeconds,
  lastPosition /* , _ignoredBootcampId */
) {
  const delta = Math.max(0, Math.floor(Number(deltaSeconds) || 0));
  const posKnown =
    lastPosition != null && Number.isFinite(Number(lastPosition));
  const pos = posKnown ? Math.max(0, Math.floor(Number(lastPosition))) : null;
  if (delta === 0 && !posKnown) return null;

  // Always derive bootcampId server-side from the lesson and verify enrollment.
  const { userId, bootcampId } = await requireLessonAccess(lessonId);

  const { data, error } = await supabaseAdmin.rpc(
    'increment_user_progress_watch_time',
    {
      p_user_id: userId,
      p_lesson_id: lessonId,
      p_bootcamp_id: bootcampId,
      p_delta: delta,
      p_last_position: pos,
    }
  );

  if (error) throw error;
  return data;
}

/**
 * Record a chunk of learning activity for today.
 * Adds `deltaSeconds` to today's watch_time bucket and unions any newly
 * completed lesson/module ids into the day's arrays.
 */
export async function recordLearningActivity({
  bootcampId,
  lessonId = null,
  deltaSeconds = 0,
  completedLessonId = null,
  completedModuleId = null,
  activityDate = null,
}) {
  const userId = await getCurrentUserId();
  if (!userId || !bootcampId) return null;

  // Trust-boundary: verify user is enrolled in the bootcamp they're claiming
  // activity for, otherwise this is an attribution attack.
  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('status')
    .eq('user_id', userId)
    .eq('bootcamp_id', bootcampId)
    .single();
  if (!enrollment || enrollment.status !== 'active') return null;

  const delta = Math.max(0, Math.floor(Number(deltaSeconds) || 0));
  if (delta === 0 && !completedLessonId && !completedModuleId) return null;

  // Validate YYYY-MM-DD if provided. Server falls back to UTC date if null.
  const dateArg =
    typeof activityDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(activityDate)
      ? activityDate
      : null;

  const { data, error } = await supabaseAdmin.rpc(
    'record_learning_activity_atomic',
    {
      p_user_id: userId,
      p_bootcamp_id: bootcampId,
      p_delta: delta,
      p_completed_lesson_id: completedLessonId,
      p_completed_module_id: completedModuleId,
      p_activity_date: dateArg,
      p_lesson_id: lessonId,
    }
  );

  if (error) throw error;
  // Only invalidate the bootcamps page cache when a completion lands.
  // Per-tick revalidation would invalidate every 30s during active watching.
  if (completedLessonId || completedModuleId) {
    revalidatePath('/account/member/bootcamps');
  }
  return data;
}

/**
 * Get the user's daily activity for a bootcamp (or all bootcamps).
 */
export async function getLearningActivity(bootcampId = null, days = 30) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  let q = supabaseAdmin
    .from('learning_activity_daily')
    .select('*')
    .eq('user_id', userId)
    .gte('activity_date', since)
    .order('activity_date', { ascending: false });
  if (bootcampId) q = q.eq('bootcamp_id', bootcampId);

  const { data, error } = await q;
  if (error) throw error;
  const rows = data || [];

  // Resolve lesson titles from lesson_watch_times (watched lessons) keyed by lesson_id
  const allLessonIds = [
    ...new Set(rows.flatMap((r) => Object.keys(r.lesson_watch_times || {}))),
  ];
  if (allLessonIds.length > 0) {
    const { data: lessons } = await supabaseAdmin
      .from('lessons')
      .select('id, title')
      .in('id', allLessonIds);
    const titleMap = Object.fromEntries(
      (lessons || []).map((l) => [l.id, l.title])
    );
    rows.forEach((r) => {
      const lwt = r.lesson_watch_times || {};
      r.completed_lessons = Object.entries(lwt).map(([id, secs]) => ({
        id,
        title: titleMap[id] || 'Lesson',
        watch_time: secs,
      }));
    });
  } else {
    rows.forEach((r) => {
      r.completed_lessons = [];
    });
  }

  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ENROLLMENT MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Search users for enrollment (admin only).
 */
export async function searchUsersForEnrollment(bootcampId, query) {
  await requireAdminOrBootcampMentor(bootcampId);

  if (!query || query.length < 2) return [];

  // Sanitize: strip PostgREST filter syntax chars to prevent injection via .or()
  const safe = String(query)
    .replace(/[,()*%\\]/g, '')
    .slice(0, 100);
  if (!safe) return [];
  const pattern = `%${safe}%`;

  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email, avatar_url')
    .or(`email.ilike.${pattern},full_name.ilike.${pattern}`)
    .limit(10);

  if (error) throw error;

  // Get already enrolled user IDs
  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select('user_id')
    .eq('bootcamp_id', bootcampId)
    .in('status', ['active', 'pending']);

  const enrolledIds = new Set(enrollments?.map((e) => e.user_id) || []);

  // Filter out already enrolled users
  return users.filter((u) => !enrolledIds.has(u.id));
}

/**
 * Admin add enrollment (can add multiple users at once).
 */
export async function adminAddEnrollment(bootcampId, userIds) {
  await requireAdminOrBootcampMentor(bootcampId);

  const ids = Array.isArray(userIds) ? userIds : [userIds];

  const enrollments = ids.map((userId) => ({
    user_id: userId,
    bootcamp_id: bootcampId,
    status: 'active',
    enrolled_at: new Date().toISOString(),
  }));

  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .upsert(enrollments, { onConflict: 'user_id,bootcamp_id' }).select(`
      *,
      users (id, full_name, email, avatar_url)
    `);

  if (error) throw error;

  revalidatePath(`/account/admin/bootcamps/${bootcampId}`);
  revalidatePath('/account/member/bootcamps');

  return { success: true, enrollments: data };
}

/**
 * Admin update enrollment status.
 */
export async function adminUpdateEnrollmentStatus(enrollmentId, status) {
  const { data: enrCheck } = await supabaseAdmin
    .from('enrollments')
    .select('bootcamp_id')
    .eq('id', enrollmentId)
    .single();
  await requireAdminOrBootcampMentor(enrCheck?.bootcamp_id);

  const validStatuses = [
    'active',
    'pending',
    'cancelled',
    'expired',
    'completed',
  ];
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid status');
  }

  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .update({ status })
    .eq('id', enrollmentId)
    .select(
      `
      *,
      users (id, full_name, email, avatar_url)
    `
    )
    .single();

  if (error) throw error;

  revalidatePath(`/account/admin/bootcamps/${data.bootcamp_id}`);
  revalidatePath('/account/member/bootcamps');

  return { success: true, enrollment: data };
}

/**
 * Admin approve a pending enrollment request.
 */
export async function adminApproveEnrollment(enrollmentId) {
  const { data: enrCheck } = await supabaseAdmin
    .from('enrollments')
    .select('bootcamp_id')
    .eq('id', enrollmentId)
    .single();
  await requireAdminOrBootcampMentor(enrCheck?.bootcamp_id);

  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .update({ status: 'active' })
    .eq('id', enrollmentId)
    .eq('status', 'pending')
    .select('*, users (id, full_name, email, avatar_url)')
    .single();

  if (error) throw error;

  revalidatePath(`/account/admin/bootcamps/${data.bootcamp_id}`);
  revalidatePath('/account/member/bootcamps');
  return { success: true, enrollment: data };
}

/**
 * Admin reject (cancel) a pending enrollment request.
 */
export async function adminRejectEnrollment(enrollmentId) {
  const { data: enrCheck } = await supabaseAdmin
    .from('enrollments')
    .select('bootcamp_id')
    .eq('id', enrollmentId)
    .single();
  await requireAdminOrBootcampMentor(enrCheck?.bootcamp_id);

  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .update({ status: 'cancelled' })
    .eq('id', enrollmentId)
    .eq('status', 'pending')
    .select('bootcamp_id')
    .single();

  if (error) throw error;

  revalidatePath(`/account/admin/bootcamps/${data.bootcamp_id}`);
  revalidatePath('/account/member/bootcamps');
  return { success: true };
}

/**
 * Admin remove enrollment (hard delete).
 */
export async function adminRemoveEnrollment(enrollmentId) {
  const { data: enrCheck } = await supabaseAdmin
    .from('enrollments')
    .select('bootcamp_id')
    .eq('id', enrollmentId)
    .single();
  await requireAdminOrBootcampMentor(enrCheck?.bootcamp_id);

  // Get bootcamp_id before deletion for revalidation
  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('bootcamp_id, user_id')
    .eq('id', enrollmentId)
    .single();

  // Delete user progress for this enrollment
  if (enrollment) {
    await supabaseAdmin
      .from('user_progress')
      .delete()
      .eq('user_id', enrollment.user_id)
      .eq('bootcamp_id', enrollment.bootcamp_id);
  }

  const { error } = await supabaseAdmin
    .from('enrollments')
    .delete()
    .eq('id', enrollmentId);

  if (error) throw error;

  if (enrollment?.bootcamp_id) {
    revalidatePath(`/account/admin/bootcamps/${enrollment.bootcamp_id}`);
  }
  revalidatePath('/account/member/bootcamps');

  return { success: true };
}

/**
 * Get enrollments with detailed progress for admin.
 */
export async function getEnrollmentsWithProgress(bootcampId) {
  await requireAdminOrBootcampMentor(bootcampId);

  // Get bootcamp total lessons count
  const { data: bootcamp } = await supabaseAdmin
    .from('bootcamps')
    .select('total_lessons')
    .eq('id', bootcampId)
    .single();

  const totalLessons = bootcamp?.total_lessons || 0;

  // Get enrollments with all score/progress fields
  const { data: enrollments, error } = await supabaseAdmin
    .from('enrollments')
    .select(
      `
      *,
      users (id, full_name, email, avatar_url)
    `
    )
    .eq('bootcamp_id', bootcampId)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;

  const userIds = enrollments.map((e) => e.user_id);

  if (userIds.length === 0) {
    return { enrollments: [], totalLessons };
  }

  // Get completed lessons count + aggregate watch_time per user
  const { data: progressData } = await supabaseAdmin
    .from('user_progress')
    .select('user_id, is_completed, watch_time')
    .eq('bootcamp_id', bootcampId)
    .in('user_id', userIds);

  const completedMap = {};
  const watchTimeMap = {};
  progressData?.forEach((p) => {
    if (p.is_completed)
      completedMap[p.user_id] = (completedMap[p.user_id] || 0) + 1;
    watchTimeMap[p.user_id] =
      (watchTimeMap[p.user_id] || 0) + (p.watch_time || 0);
  });

  // Get reviewed task points per user for this bootcamp
  // Task statuses after mentor review: 'completed', 'late', 'accepted', 'bonus deserved'
  const { data: taskSubs } = await supabaseAdmin
    .from('task_submissions')
    .select('user_id, points_earned, weekly_tasks!inner(bootcamp_id)')
    .in('user_id', userIds)
    .in('status', ['completed', 'late', 'accepted', 'bonus deserved'])
    .eq('weekly_tasks.bootcamp_id', bootcampId);

  const taskPtsMap = {};
  taskSubs?.forEach((s) => {
    taskPtsMap[s.user_id] =
      (taskPtsMap[s.user_id] || 0) + (s.points_earned || 0);
  });

  // Get reviewed exam scores per user for this bootcamp
  // Exam status after grading (MCQ auto-grade or mentor CQ review): 'reviewed'
  const { data: examSubs } = await supabaseAdmin
    .from('exam_submissions')
    .select('user_id, score')
    .in('user_id', userIds)
    .eq('bootcamp_id', bootcampId)
    .eq('status', 'reviewed');

  const examPtsMap = {};
  examSubs?.forEach((s) => {
    examPtsMap[s.user_id] = (examPtsMap[s.user_id] || 0) + (s.score || 0);
  });

  // Get session attendance points per user for this bootcamp
  const { data: sessions } = await supabaseAdmin
    .from('mentorship_sessions')
    .select('attendance_data')
    .eq('bootcamp_id', bootcampId);

  const sessionPtsMap = {};
  const sessionCountMap = {};
  sessions?.forEach((s) => {
    if (!Array.isArray(s.attendance_data)) return;
    s.attendance_data.forEach((a) => {
      if (a.user_id && a.attended) {
        sessionCountMap[a.user_id] = (sessionCountMap[a.user_id] || 0) + 1;
        sessionPtsMap[a.user_id] =
          (sessionPtsMap[a.user_id] || 0) + (a.points || 0);
      }
    });
  });

  // Merge all enriched data into enrollments
  const enrichedEnrollments = enrollments.map((enrollment) => ({
    ...enrollment,
    completed_lessons: completedMap[enrollment.user_id] || 0,
    progress_percent: enrollment.progress_percent ?? 0,
    score: enrollment.score ?? 0,
    watch_time: watchTimeMap[enrollment.user_id] || 0,
    task_points: taskPtsMap[enrollment.user_id] || 0,
    exam_points: examPtsMap[enrollment.user_id] || 0,
    session_points: sessionPtsMap[enrollment.user_id] || 0,
    sessions_attended: sessionCountMap[enrollment.user_id] || 0,
  }));

  return { enrollments: enrichedEnrollments, totalLessons };
}

/**
 * Get a specific student's lesson-level progress for a bootcamp (admin).
 */
export async function adminGetStudentProgress(bootcampId, userId) {
  await requireAdminOrBootcampMentor(bootcampId);

  const [{ data: curriculum }, { data: progressRows }] = await Promise.all([
    supabaseAdmin
      .from('bootcamps')
      .select(
        `
        title,
        courses (
          id, title, order_index,
          modules (
            id, title, order_index,
            lessons (id, title, order_index, duration, is_published, video_source, video_id, type, exam_type, random_question_count, weight)
          )
        )
      `
      )
      .eq('id', bootcampId)
      .single(),
    supabaseAdmin
      .from('user_progress')
      .select(
        'lesson_id, is_completed, completed_at, watch_time, last_position'
      )
      .eq('bootcamp_id', bootcampId)
      .eq('user_id', userId),
  ]);

  const progressMap = {};
  progressRows?.forEach((p) => {
    progressMap[p.lesson_id] = p;
  });

  if (curriculum?.courses) {
    curriculum.courses.sort((a, b) => a.order_index - b.order_index);
    curriculum.courses.forEach((course) => {
      course.modules?.sort((a, b) => a.order_index - b.order_index);
      course.modules?.forEach((module) => {
        module.lessons?.sort((a, b) => a.order_index - b.order_index);
        module.lessons = module.lessons?.map((lesson) => ({
          ...lesson,
          progress: progressMap[lesson.id] || null,
        }));
      });
    });
  }

  return curriculum;
}

/**
 * Export enrollments to CSV format.
 */
export async function exportEnrollmentsCSV(bootcampId) {
  await requireAdmin();

  const { enrollments, totalLessons } =
    await getEnrollmentsWithProgress(bootcampId);

  // Get bootcamp info
  const { data: bootcamp } = await supabaseAdmin
    .from('bootcamps')
    .select('title')
    .eq('id', bootcampId)
    .single();

  // Build CSV
  const headers = [
    'Name',
    'Email',
    'Status',
    'Enrolled Date',
    'Last Accessed',
    'Completed Lessons',
    'Total Lessons',
    'Progress %',
  ];

  const rows = enrollments.map((e) => [
    e.users?.full_name || 'N/A',
    e.users?.email || 'N/A',
    e.status,
    e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : 'N/A',
    e.last_accessed_at
      ? new Date(e.last_accessed_at).toLocaleDateString()
      : 'Never',
    e.completed_lessons,
    totalLessons,
    `${e.progress_percent}%`,
  ]);

  // Escape CSV: prefix formula-trigger chars with single quote, escape internal quotes
  const escapeCell = (cell) => {
    let s = cell == null ? '' : String(cell);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\n');

  return {
    csv,
    filename: `${bootcamp?.title || 'bootcamp'}-enrollments-${new Date().toISOString().split('T')[0]}.csv`,
  };
}

/**
 * Get enrollment statistics for a bootcamp.
 */
export async function getEnrollmentStats(bootcampId) {
  await requireAdmin();

  const { data: enrollments, error } = await supabaseAdmin
    .from('enrollments')
    .select('status, enrolled_at')
    .eq('bootcamp_id', bootcampId);

  if (error) throw error;

  const stats = {
    total: enrollments.length,
    active: 0,
    pending: 0,
    cancelled: 0,
    completed: 0,
    thisWeek: 0,
    thisMonth: 0,
  };

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  enrollments.forEach((e) => {
    stats[e.status] = (stats[e.status] || 0) + 1;

    const enrolledAt = new Date(e.enrolled_at);
    if (enrolledAt >= oneWeekAgo) stats.thisWeek++;
    if (enrolledAt >= oneMonthAgo) stats.thisMonth++;
  });

  return stats;
}
