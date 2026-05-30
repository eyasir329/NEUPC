'use server';

/**
 * @file Bootcamp members server actions (split from bootcamp-actions).
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

import { requireAnyRole } from './_helpers';

/**
 * Get published bootcamps for members to browse.
 * Returns all published bootcamps with course counts.
 */
export async function getMemberBootcamps() {
  const { data, error } = await supabaseAdmin
    .from('bootcamps')
    .select(
      `
      id, title, slug, description, thumbnail, price, batch_info,
      start_date, end_date, total_duration, total_lessons, is_featured, enrollment_type,
      courses:courses (count)
    `
    )
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to fetch bootcamps');
  }

  // Transform course count
  return (data || []).map((b) => ({
    ...b,
    course_count: b.courses?.[0]?.count || 0,
  }));
}

/**
 * Get detailed student progress and performance for a specific bootcamp batch.
 * Restricted to advisor, admin, or executive.
 */
export async function getAdvisorBootcampStudents(bootcampId) {
  await requireAnyRole(['admin', 'executive', 'advisor']);

  // Fetch bootcamp total lessons
  const { data: bootcamp } = await supabaseAdmin
    .from('bootcamps')
    .select('total_lessons')
    .eq('id', bootcampId)
    .single();

  const totalLessons = bootcamp?.total_lessons || 0;

  // Fetch all enrollments for this bootcamp with student user info
  const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
    .from('enrollments')
    .select(
      `
      id, status, enrolled_at,
      users:user_id (id, full_name, email, avatar_url)
    `
    )
    .eq('bootcamp_id', bootcampId)
    .in('status', ['active', 'completed']);

  if (enrollmentsError) throw enrollmentsError;

  // Fetch user lesson completion counts
  const { data: progressRows } = await supabaseAdmin
    .from('user_progress')
    .select('user_id, is_completed')
    .eq('bootcamp_id', bootcampId)
    .eq('is_completed', true);

  const completedMap = {};
  progressRows?.forEach((p) => {
    completedMap[p.user_id] = (completedMap[p.user_id] || 0) + 1;
  });

  // Combine into a list of students with progress percent
  const students = (enrollments || []).map((e) => {
    const student = e.users || {};
    const lessonsCompleted = completedMap[student.id] || 0;
    const progressPercent =
      totalLessons > 0 ? (lessonsCompleted / totalLessons) * 100 : 0;

    return {
      enrollmentId: e.id,
      status: e.status,
      enrolledAt: e.enrolled_at,
      id: student.id,
      fullName: student.fullName || student.full_name || 'Unknown Student',
      email: student.email,
      avatarUrl: student.avatarUrl || student.avatar_url,
      lessonsCompleted,
      totalLessons,
      progressPercent: parseFloat(progressPercent.toFixed(1)),
    };
  });

  // Sort by progress percent desc, then name
  students.sort(
    (a, b) =>
      b.progressPercent - a.progressPercent ||
      a.fullName.localeCompare(b.fullName)
  );

  return students;
}
