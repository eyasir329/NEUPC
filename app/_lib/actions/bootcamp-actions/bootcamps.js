'use server';

/**
 * @file Bootcamp bootcamps server actions (split from bootcamp-actions).
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
  generateSlug,
  getCurrentUserId,
  requireAdmin,
  requireAnyRole,
} from './_helpers';

// ─────────────────────────────────────────────────────────────────────────────
// BOOTCAMP ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all bootcamps (admin view - includes drafts).
 */
export async function getAdminBootcamps() {
  await requireAdmin();

  const { data, error } = await supabaseAdmin
    .from('bootcamps')
    .select('*, users:created_by (id, full_name, avatar_url)')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch bootcamps');
  }

  // Get enrollment counts separately
  const bootcampIds = data?.map((b) => b.id) || [];
  let enrollmentCounts = {};

  if (bootcampIds.length > 0) {
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('bootcamp_id')
      .in('bootcamp_id', bootcampIds);

    // Count enrollments per bootcamp
    enrollments?.forEach((e) => {
      enrollmentCounts[e.bootcamp_id] =
        (enrollmentCounts[e.bootcamp_id] || 0) + 1;
    });
  }

  // Add enrollment count to each bootcamp
  return (data || []).map((b) => ({
    ...b,
    enrollment_count: enrollmentCounts[b.id] || 0,
  }));
}

/**
 * Get a single bootcamp by ID or slug with full curriculum.
 * Authenticated only. Non-admins see only published bootcamps.
 */
export async function getBootcampWithCurriculum(idOrSlug) {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug
    );

  const query = supabaseAdmin.from('bootcamps').select(`
      *,
      users:created_by (id, full_name, avatar_url),
      courses (
        id, title, description, order_index, is_published, is_locked, total_lessons, total_duration,
        modules (
          id, title, description, order_index, is_published, is_locked, total_lessons, total_duration,
          lessons (
            id, title, description, content, video_source, video_id, video_url, duration, order_index,
            is_free_preview, is_published, is_locked, type, exam_type, exam_questions, random_question_count, weight, practice_problems
          )
        )
      )
    `);

  const { data, error } = isUuid
    ? await query.eq('id', idOrSlug).single()
    : await query.eq('slug', idOrSlug).single();

  if (error) throw error;

  // Non-admins cannot read draft/archived bootcamps unless they are an assigned mentor
  if (data && data.status !== 'published') {
    const { data: u } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();
    let hasAccess = false;
    if (u) {
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', u.id);
      const isAdmin = roles?.some(
        (r) => r.roles?.name === 'admin' || r.roles?.name === 'executive'
      );
      if (isAdmin) {
        hasAccess = true;
      } else {
        const { data: mentorRow } = await supabaseAdmin
          .from('bootcamp_mentors')
          .select('id')
          .eq('bootcamp_id', data.id)
          .eq('user_id', u.id)
          .single();
        hasAccess = !!mentorRow;
      }
    }
    if (!hasAccess) throw new Error('Not found');
  }

  // Sort nested items by order_index
  if (data?.courses) {
    data.courses.sort((a, b) => a.order_index - b.order_index);
    data.courses.forEach((course) => {
      course.modules?.sort((a, b) => a.order_index - b.order_index);
      course.modules?.forEach((module) => {
        module.lessons?.sort((a, b) => a.order_index - b.order_index);
      });
    });
  }

  return data;
}

/**
 * Lightweight variant: same shape as getBootcampWithCurriculum but
 * excludes the heavy `content` JSON on lessons. Use for sidebars/listings.
 */
export async function getBootcampCurriculumLight(idOrSlug) {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrSlug
    );

  const query = supabaseAdmin.from('bootcamps').select(`
      *,
      users:created_by (id, full_name, avatar_url),
      courses (
        id, title, description, order_index, is_published, is_locked, total_lessons, total_duration,
        modules (
          id, title, description, order_index, is_published, is_locked, total_lessons, total_duration,
          lessons (
            id, title, description, video_source, video_id, duration, order_index,
            is_free_preview, is_published, is_locked, type, exam_type, random_question_count, weight, points, practice_problems
          )
        )
      )
    `);

  const { data, error } = isUuid
    ? await query.eq('id', idOrSlug).single()
    : await query.eq('slug', idOrSlug).single();

  if (error) throw error;

  if (data && data.status !== 'published') {
    const { data: u } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();
    let isAdmin = false;
    if (u) {
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', u.id);
      isAdmin = roles?.some(
        (r) => r.roles?.name === 'admin' || r.roles?.name === 'executive'
      );
    }
    // Enrolled members may continue accessing their archived bootcamp
    if (!isAdmin) {
      if (data.status === 'archived' && u) {
        const { data: enrollment } = await supabaseAdmin
          .from('enrollments')
          .select('id')
          .eq('user_id', u.id)
          .eq('bootcamp_id', data.id)
          .in('status', ['active', 'completed'])
          .maybeSingle();
        if (!enrollment) throw new Error('Not found');
      } else {
        throw new Error('Not found');
      }
    }
  }

  if (data?.courses) {
    data.courses.sort((a, b) => a.order_index - b.order_index);
    data.courses.forEach((course) => {
      course.modules?.sort((a, b) => a.order_index - b.order_index);
      course.modules?.forEach((module) => {
        module.lessons?.sort((a, b) => a.order_index - b.order_index);
      });
    });
  }

  return data;
}

/**
 * Create a new bootcamp.
 */
export async function createBootcamp(formData) {
  const userId = await requireAdmin();

  const title = formData.get('title')?.trim();
  if (!title) throw new Error('Title is required');

  let slug = formData.get('slug')?.trim() || generateSlug(title);

  // Ensure slug is unique
  const { data: existing } = await supabaseAdmin
    .from('bootcamps')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const bootcampData = {
    title: cleanPlainText(title, 200),
    slug,
    description: cleanRichText(formData.get('description')) || null,
    thumbnail: formData.get('thumbnail') || null,
    price: parseFloat(formData.get('price')) || 0,
    status: formData.get('status') || 'draft',
    batch_info: formData.get('batch_info') || null,
    start_date: formData.get('start_date') || null,
    end_date: formData.get('end_date') || null,
    max_students: parseInt(formData.get('max_students')) || null,
    is_featured: formData.get('is_featured') === 'true',
    created_by: userId,
  };

  let { data, error } = await supabaseAdmin
    .from('bootcamps')
    .insert(bootcampData)
    .select()
    .single();

  // Retry once on slug unique-constraint conflict (race between check + insert)
  if (error && error.code === '23505') {
    bootcampData.slug = `${bootcampData.slug}-${Date.now()}`;
    ({ data, error } = await supabaseAdmin
      .from('bootcamps')
      .insert(bootcampData)
      .select()
      .single());
  }

  if (error) throw error;

  revalidatePath('/account/admin/bootcamps');
  revalidatePath('/account/executive/bootcamps');
  revalidatePath(`/bootcamps/${data.slug}`);

  return data;
}

/**
 * Update a bootcamp.
 */
export async function updateBootcamp(id, formData) {
  await requireAdmin();

  const updates = {};
  const fields = [
    'title',
    'slug',
    'description',
    'subtitle',
    'category',
    'difficulty',
    'thumbnail',
    'price',
    'status',
    'batch_info',
    'start_date',
    'end_date',
    'max_students',
    'is_featured',
    'enrollment_type',
  ];

  for (const field of fields) {
    if (!formData.has(field)) continue;
    const value = formData.get(field);
    if (field === 'price') {
      updates[field] = parseFloat(value) || 0;
    } else if (field === 'max_students') {
      updates[field] = value ? parseInt(value) : null;
    } else if (field === 'is_featured') {
      updates[field] = value === 'true';
    } else if (field === 'start_date' || field === 'end_date') {
      updates[field] = value || null;
    } else if (field === 'enrollment_type') {
      if (value === 'open' || value === 'approval') updates[field] = value;
    } else if (field === 'description') {
      updates[field] = value === '' ? null : cleanRichText(value);
    } else if (
      field === 'batch_info' ||
      field === 'thumbnail' ||
      field === 'subtitle' ||
      field === 'category' ||
      field === 'difficulty'
    ) {
      updates[field] = value === '' ? null : cleanPlainText(value, 500);
    } else if (field === 'title') {
      updates[field] = cleanPlainText(value, 200);
    } else if (field === 'slug') {
      updates[field] = value;
    } else {
      updates[field] = value;
    }
  }

  console.log('[updateBootcamp] id:', id, 'updates:', updates);

  const { data, error } = await supabaseAdmin
    .from('bootcamps')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateBootcamp] Supabase error:', error, { id, updates });
    throw error;
  }

  console.log('[updateBootcamp] saved:', data?.title, data?.status);

  revalidatePath('/account/admin/bootcamps');
  revalidatePath('/account/executive/bootcamps');
  revalidatePath(`/account/admin/bootcamps/${id}`);
  revalidatePath(`/account/executive/bootcamps/${id}`);
  revalidatePath(`/account/member/bootcamps/${id}`);
  revalidatePath(`/bootcamps/${data.slug}`);

  return data;
}

/**
 * Delete a bootcamp.
 */
export async function deleteBootcamp(id) {
  await requireAdmin();

  const { error } = await supabaseAdmin.from('bootcamps').delete().eq('id', id);

  if (error) throw error;

  revalidatePath('/account/admin/bootcamps');
  revalidatePath('/account/executive/bootcamps');

  return { success: true };
}

/**
 * Toggle bootcamp featured status.
 */
export async function toggleBootcampFeatured(id) {
  await requireAdmin();

  const { data: current } = await supabaseAdmin
    .from('bootcamps')
    .select('is_featured')
    .eq('id', id)
    .single();

  const { data, error } = await supabaseAdmin
    .from('bootcamps')
    .update({ is_featured: !current?.is_featured })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/account/admin/bootcamps');
  revalidatePath('/account/executive/bootcamps');

  return data;
}

/**
 * Get leaderboard for a specific bootcamp, ranking users by score.
 */
export async function getBootcampLeaderboard(bootcampId) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  // Verify enrollment
  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('bootcamp_id', bootcampId)
    .single();

  if (!enrollment) throw new Error('Not enrolled in this bootcamp');

  // Fetch all enrollments with scores, joined with users
  const { data: leaderboard, error } = await supabaseAdmin
    .from('enrollments')
    .select(
      `
      user_id,
      score,
      progress_percent,
      enrolled_at,
      users (id, full_name, avatar_url)
    `
    )
    .eq('bootcamp_id', bootcampId)
    .order('score', { ascending: false })
    .order('progress_percent', { ascending: false })
    .order('enrolled_at', { ascending: true });

  if (error) {
    console.error('Error fetching bootcamp leaderboard:', error);
    throw error;
  }

  return (leaderboard || []).map((entry, idx) => ({
    rank: idx + 1,
    userId: entry.user_id,
    score: entry.score || 0,
    progressPercent: entry.progress_percent || 0,
    userName: entry.users?.full_name || 'Member',
    avatarUrl: entry.users?.avatar_url || null,
  }));
}

/**
 * Member/Mentor/Admin: Get a comprehensive leaderboard across all bootcamps or a specific one,
 * optionally filtered by timeframe (all, weekly, monthly).
 */
export async function getBootcampsLeaderboardAction({
  bootcampId = 'all',
  timeframe = 'all',
} = {}) {
  try {
    await requireAnyRole(['member', 'mentor', 'admin', 'executive']);

    // 1. Fetch active or completed enrollments
    let query = supabaseAdmin
      .from('enrollments')
      .select(
        `
        id,
        user_id,
        bootcamp_id,
        score,
        progress_percent,
        enrolled_at,
        users:user_id (id, full_name, avatar_url),
        bootcamps:bootcamp_id (id, title, status)
      `
      )
      .in('status', ['active', 'completed']);

    if (bootcampId !== 'all') {
      query = query.eq('bootcamp_id', bootcampId);
    }

    const { data: enrollments, error: enrollError } = await query;
    if (enrollError) throw enrollError;

    if (!enrollments || enrollments.length === 0) {
      return { success: true, leaderboard: [] };
    }

    // Include both active and archived bootcamps' enrollments in the leaderboard
    const activeEnrollments = enrollments.filter((e) => {
      if (!e.bootcamps) return false;
      return true;
    });

    if (activeEnrollments.length === 0) {
      return { success: true, leaderboard: [] };
    }

    // Get unique user and bootcamp IDs
    const userIds = [...new Set(activeEnrollments.map((e) => e.user_id))];
    const bootcampIds = [
      ...new Set(activeEnrollments.map((e) => e.bootcamp_id)),
    ];

    // Determine timeframe boundaries
    let startDate = null;
    if (timeframe === 'weekly') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === 'monthly') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    // Fetch all published lessons to map points/types
    let lessonsQuery = supabaseAdmin
      .from('lessons')
      .select(
        `
        id,
        type,
        points,
        practice_problems,
        modules (
          is_published,
          courses (
            bootcamp_id,
            is_published
          )
        )
      `
      )
      .eq('is_published', true);

    const { data: lessons, error: lessonsErr } = await lessonsQuery;
    if (lessonsErr) throw lessonsErr;

    const lessonsMap = {};
    lessons?.forEach((l) => {
      const mod = l.modules;
      const course = mod?.courses;
      if (!mod || mod.is_published === false) return;
      if (!course || course.is_published === false) return;
      if (bootcampId !== 'all' && course.bootcamp_id !== bootcampId) return;

      lessonsMap[l.id] = {
        type: l.type,
        points: l.points ?? 10,
        practice_problems: l.practice_problems || [],
      };
    });

    // 2. Query user progress
    let progressQuery = supabaseAdmin
      .from('user_progress')
      .select(
        'user_id, bootcamp_id, lesson_id, is_completed, watch_time, solved_problems, completed_at'
      )
      .in('user_id', userIds);

    if (bootcampId !== 'all') {
      progressQuery = progressQuery.eq('bootcamp_id', bootcampId);
    }

    const { data: progressList, error: progressError } = await progressQuery;
    if (progressError) throw progressError;

    // 3. Query Reviewed Task Submissions
    // Task statuses set by mentor after review: 'completed', 'late', 'accepted', 'bonus deserved'
    let tasksQuery = supabaseAdmin
      .from('task_submissions')
      .select(
        `
        user_id,
        points_earned,
        submitted_at,
        weekly_tasks!inner (bootcamp_id)
      `
      )
      .in('user_id', userIds)
      .in('status', ['completed', 'late', 'accepted', 'bonus deserved']);

    if (bootcampId !== 'all') {
      tasksQuery = tasksQuery.eq('weekly_tasks.bootcamp_id', bootcampId);
    }
    if (startDate) {
      tasksQuery = tasksQuery.gte('submitted_at', startDate.toISOString());
    }

    const { data: taskSubs, error: taskSubsError } = await tasksQuery;
    if (taskSubsError) throw taskSubsError;

    // 4. Query Reviewed Exam Submissions
    // Exam status after MCQ auto-grade or mentor CQ review: 'reviewed'
    let examsQuery = supabaseAdmin
      .from('exam_submissions')
      .select('user_id, bootcamp_id, score, graded_at, status')
      .in('user_id', userIds)
      .eq('status', 'reviewed');

    if (bootcampId !== 'all') {
      examsQuery = examsQuery.eq('bootcamp_id', bootcampId);
    }
    if (startDate) {
      examsQuery = examsQuery.gte('graded_at', startDate.toISOString());
    }

    const { data: examSubs, error: examSubsError } = await examsQuery;
    if (examSubsError) throw examSubsError;

    // 5. Query Mentorship Sessions for Attendance Data
    let sessionsQuery = supabaseAdmin
      .from('mentorship_sessions')
      .select('id, topic, session_date, attendance_data, bootcamp_id');

    if (bootcampId !== 'all') {
      sessionsQuery = sessionsQuery.eq('bootcamp_id', bootcampId);
    }
    if (startDate) {
      sessionsQuery = sessionsQuery.gte(
        'session_date',
        startDate.toISOString()
      );
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;
    if (sessionsError) throw sessionsError;

    // 6. Aggregate data per user
    const statsMap = {};

    userIds.forEach((uid) => {
      const userEnrollments = activeEnrollments.filter(
        (e) => e.user_id === uid
      );
      const mainEnrollment = userEnrollments[0];
      statsMap[uid] = {
        userId: uid,
        userName: mainEnrollment.users?.full_name || 'Member',
        avatarUrl: mainEnrollment.users?.avatar_url || null,
        enrolledBootcampsCount: userEnrollments.length,
        lessonsCompleted: 0,
        practiceSolved: 0,
        watchTime: 0,
        sessionsAttended: 0,
        score: 0,
        allTimeScore: userEnrollments.reduce(
          (sum, e) => sum + (e.score || 0),
          0
        ),
        allTimeProgressPercent: Math.round(
          userEnrollments.reduce(
            (sum, e) => sum + (e.progress_percent || 0),
            0
          ) / userEnrollments.length
        ),
      };
    });

    // Aggregate user progress (lessons completed, solved problems, watch time)
    progressList?.forEach((p) => {
      const stats = statsMap[p.user_id];
      if (!stats) return;

      const isCompleted = p.is_completed;
      const isCompletedInTimeframe =
        !startDate || (p.completed_at && new Date(p.completed_at) >= startDate);

      if (isCompleted && isCompletedInTimeframe) {
        stats.lessonsCompleted += 1;
      }

      stats.watchTime += p.watch_time || 0;

      if (Array.isArray(p.solved_problems)) {
        if (
          !startDate ||
          (p.completed_at && new Date(p.completed_at) >= startDate)
        ) {
          stats.practiceSolved += p.solved_problems.length;
        }
      }

      // Add points for standard lessons and practice problems completed in this timeframe
      const lessonInfo = lessonsMap[p.lesson_id];
      if (lessonInfo && isCompletedInTimeframe) {
        if (lessonInfo.type === 'lesson' || lessonInfo.type === 'video') {
          if (isCompleted) {
            stats.score += lessonInfo.points;
          }
        } else if (lessonInfo.type === 'practice') {
          const practiceProblems = lessonInfo.practice_problems || [];
          const solvedIndices = p.solved_problems || [];

          if (practiceProblems.length > 0) {
            let totalPracticePts = 0;
            let solvedPracticePts = 0;

            practiceProblems.forEach((prob, idx) => {
              const pts = Number(prob?.points) || 5;
              totalPracticePts += pts;
              if (solvedIndices.includes(idx)) {
                solvedPracticePts += pts;
              }
            });

            if (totalPracticePts > 0) {
              stats.score += Math.floor(
                (solvedPracticePts / totalPracticePts) * lessonInfo.points
              );
            }
          } else if (isCompleted) {
            stats.score += lessonInfo.points;
          }
        }
      }
    });

    // Aggregate Task Points
    taskSubs?.forEach((sub) => {
      const stats = statsMap[sub.user_id];
      if (stats) {
        stats.score += sub.points_earned || 0;
      }
    });

    // Aggregate Exam Points
    examSubs?.forEach((sub) => {
      const stats = statsMap[sub.user_id];
      if (stats) {
        stats.score += sub.score || 0;
      }
    });

    // Aggregate Session Attendance Points
    sessions?.forEach((s) => {
      if (Array.isArray(s.attendance_data)) {
        s.attendance_data.forEach((a) => {
          const stats = statsMap[a.user_id];
          if (stats) {
            if (a.attended) {
              stats.sessionsAttended += 1;
            }
            stats.score += a.points || 0;
          }
        });
      }
    });

    // Format final list
    const leaderboard = Object.values(statsMap).map((stats) => {
      const finalScore = timeframe === 'all' ? stats.allTimeScore : stats.score;

      let progressPercent = 0;
      if (bootcampId !== 'all') {
        const matchingEnrollment = enrollments.find(
          (e) => e.user_id === stats.userId && e.bootcamp_id === bootcampId
        );
        progressPercent = matchingEnrollment?.progress_percent || 0;
      } else {
        progressPercent = stats.allTimeProgressPercent;
      }

      return {
        userId: stats.userId,
        userName: stats.userName,
        avatarUrl: stats.avatarUrl,
        lessonsCompleted: stats.lessonsCompleted,
        practiceSolved: stats.practiceSolved,
        watchTime: stats.watchTime,
        sessionsAttended: stats.sessionsAttended,
        score: finalScore,
        progressPercent,
      };
    });

    // Sort by score desc, then progress percent desc
    leaderboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.progressPercent - a.progressPercent;
    });

    // Add rankings
    leaderboard.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    return { success: true, leaderboard };
  } catch (error) {
    console.error('Error fetching bootcamps leaderboard:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch leaderboard',
    };
  }
}

/**
 * Get aggregated bootcamp analytics and performance overview for the Faculty Advisor.
 * Access: advisor, admin, or executive.
 */
export async function getAdvisorBootcampAnalytics() {
  await requireAnyRole(['admin', 'executive', 'advisor']);

  // Fetch all bootcamps with basic creator info
  const { data: bootcamps, error: bootcampsError } = await supabaseAdmin
    .from('bootcamps')
    .select(
      `
      id, title, slug, status, price, batch_info, category, difficulty, start_date, end_date, total_lessons, is_featured, created_at,
      users:created_by (id, full_name, avatar_url)
    `
    )
    .order('created_at', { ascending: false });

  if (bootcampsError) {
    throw new Error(
      bootcampsError.message || 'Failed to fetch bootcamps for advisor'
    );
  }

  const bootcampIds = bootcamps?.map((b) => b.id) || [];

  let enrollments = [];
  let userProgress = [];
  let mentors = [];
  let sessionsByMentor = {};
  let menteesByMentor = {};

  if (bootcampIds.length > 0) {
    const [enrollmentsRes, progressRes, mentorsRes, mentorshipsRes] =
      await Promise.all([
        supabaseAdmin
          .from('enrollments')
          .select(
            'id, user_id, bootcamp_id, status, enrolled_at, users:user_id (id, full_name, avatar_url)'
          )
          .in('bootcamp_id', bootcampIds),
        supabaseAdmin
          .from('user_progress')
          .select('user_id, bootcamp_id, is_completed')
          .in('bootcamp_id', bootcampIds)
          .eq('is_completed', true),
        supabaseAdmin
          .from('bootcamp_mentors')
          .select(
            'bootcamp_id, assigned_at, users:user_id (id, full_name, avatar_url, email)'
          )
          .in('bootcamp_id', bootcampIds),
        // fetch mentorship session counts per mentor
        supabaseAdmin.from('mentorships').select('id, mentor_id, mentee_id'),
      ]);

    enrollments = enrollmentsRes.data || [];
    userProgress = progressRes.data || [];
    mentors = mentorsRes.data || [];

    // Fetch mentorship session counts grouped by mentor_id
    const mentorshipRows = mentorshipsRes.data || [];
    const mentorshipIds = mentorshipRows.map((m) => m.id);
    let sessionRows = [];
    if (mentorshipIds.length > 0) {
      const { data: sRows } = await supabaseAdmin
        .from('mentorship_sessions')
        .select('mentorship_id, mentor_id')
        .in('mentorship_id', mentorshipIds);
      sessionRows = sRows || [];
    }

    // Build sessions per mentor map
    sessionsByMentor = {};
    sessionRows.forEach((s) => {
      sessionsByMentor[s.mentor_id] = (sessionsByMentor[s.mentor_id] || 0) + 1;
    });

    // Build mentees per mentor map
    menteesByMentor = {};
    mentorshipRows.forEach((m) => {
      menteesByMentor[m.mentor_id] = (menteesByMentor[m.mentor_id] || 0) + 1;
    });
  }

  // Group data by bootcamp
  const enrollmentsByBootcamp = {};
  enrollments.forEach((e) => {
    if (!enrollmentsByBootcamp[e.bootcamp_id]) {
      enrollmentsByBootcamp[e.bootcamp_id] = [];
    }
    enrollmentsByBootcamp[e.bootcamp_id].push(e);
  });

  const progressByBootcampAndUser = {};
  userProgress.forEach((p) => {
    if (!progressByBootcampAndUser[p.bootcamp_id]) {
      progressByBootcampAndUser[p.bootcamp_id] = {};
    }
    if (!progressByBootcampAndUser[p.bootcamp_id][p.user_id]) {
      progressByBootcampAndUser[p.bootcamp_id][p.user_id] = 0;
    }
    progressByBootcampAndUser[p.bootcamp_id][p.user_id] += 1;
  });

  const mentorsByBootcamp = {};
  mentors.forEach((m) => {
    if (!mentorsByBootcamp[m.bootcamp_id]) {
      mentorsByBootcamp[m.bootcamp_id] = [];
    }
    if (m.users) {
      mentorsByBootcamp[m.bootcamp_id].push({
        ...m.users,
        assignedAt: m.assigned_at,
        sessionsCount: sessionsByMentor[m.users.id] || 0,
        menteesCount: menteesByMentor[m.users.id] || 0,
      });
    }
  });

  let totalRevenue = 0;
  let totalActiveCompletedEnrollments = 0;
  let totalGraduatesSum = 0;

  const bootcampsWithStats = (bootcamps || []).map((b) => {
    const bEnrollments = enrollmentsByBootcamp[b.id] || [];
    const bMentors = mentorsByBootcamp[b.id] || [];

    const total = bEnrollments.length;
    const active = bEnrollments.filter((e) => e.status === 'active').length;
    const completed = bEnrollments.filter(
      (e) => e.status === 'completed'
    ).length;
    const pending = bEnrollments.filter((e) => e.status === 'pending').length;
    const cancelled = bEnrollments.filter(
      (e) => e.status === 'cancelled'
    ).length;

    const revenue = (active + completed) * (b.price || 0);
    totalRevenue += revenue;
    totalActiveCompletedEnrollments += active + completed;

    const bProgress = progressByBootcampAndUser[b.id] || {};
    const totalLessons = b.total_lessons || 0;

    let graduatedCount = 0;
    let totalProgressSum = 0;
    const enrolledUsers = bEnrollments.filter(
      (e) => e.status === 'active' || e.status === 'completed'
    );

    enrolledUsers.forEach((e) => {
      const completedCount = bProgress[e.user_id] || 0;
      const progressPercent =
        totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;
      totalProgressSum += progressPercent;
      if (totalLessons > 0 && completedCount / totalLessons >= 0.8) {
        graduatedCount += 1;
      }
    });

    totalGraduatesSum += graduatedCount;

    const avgProgress =
      enrolledUsers.length > 0 ? totalProgressSum / enrolledUsers.length : 0;
    const completionRate =
      enrolledUsers.length > 0
        ? (graduatedCount / enrolledUsers.length) * 100
        : 0;

    return {
      ...b,
      stats: {
        totalEnrollments: total,
        active,
        completed,
        pending,
        cancelled,
        revenue,
        completionRate: parseFloat(completionRate.toFixed(1)),
        avgProgress: parseFloat(avgProgress.toFixed(1)),
        graduatedCount,
      },
      mentors: bMentors,
    };
  });

  const totalTracks = bootcamps.length;
  const activeTracks = bootcamps.filter((b) => b.status === 'published').length;
  const archivedTracks = bootcamps.filter(
    (b) => b.status === 'archived'
  ).length;
  const totalEnrolled = enrollments.filter(
    (e) => e.status === 'active' || e.status === 'completed'
  ).length;

  const avgCompletionRate =
    totalActiveCompletedEnrollments > 0
      ? (totalGraduatesSum / totalActiveCompletedEnrollments) * 100
      : 0;

  const recentEnrollments = [...enrollments]
    .sort((a, b) => new Date(b.enrolled_at) - new Date(a.enrolled_at))
    .slice(0, 10)
    .map((e) => {
      const bc = bootcamps.find((b) => b.id === e.bootcamp_id);
      return {
        id: e.id,
        enrolledAt: e.enrolled_at,
        status: e.status,
        student: e.users,
        bootcampTitle: bc?.title || 'Unknown Bootcamp',
        bootcampBatch: bc?.batch_info || '',
      };
    });

  return {
    summaryStats: {
      totalTracks,
      activeTracks,
      archivedTracks,
      totalEnrollments: totalEnrolled,
      totalRevenue,
      avgCompletionRate: parseFloat(avgCompletionRate.toFixed(1)),
    },
    bootcamps: bootcampsWithStats,
    recentEnrollments,
  };
}
