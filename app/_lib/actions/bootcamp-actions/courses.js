'use server';

/**
 * @file Bootcamp courses server actions (split from bootcamp-actions).
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
  recomputeBootcampTotals,
  requireAdminOrBootcampMentor,
} from './_helpers';

// ─────────────────────────────────────────────────────────────────────────────
// COURSE ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new course within a bootcamp.
 */
export async function createCourse(bootcampId, data) {
  await requireAdminOrBootcampMentor(bootcampId);

  // Get max order_index
  const { data: existing } = await supabaseAdmin
    .from('courses')
    .select('order_index')
    .eq('bootcamp_id', bootcampId)
    .order('order_index', { ascending: false })
    .limit(1);

  const orderIndex = (existing?.[0]?.order_index ?? -1) + 1;

  const { data: course, error } = await supabaseAdmin
    .from('courses')
    .insert({
      bootcamp_id: bootcampId,
      title: cleanPlainText(data.title?.trim() || 'Untitled Course', 200),
      description: cleanRichText(data.description) || null,
      order_index: orderIndex,
      is_published: data.is_published !== false,
      is_locked: data.is_locked === true,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath(`/account/admin/bootcamps/${bootcampId}`);
  revalidatePath(`/account/member/bootcamps/${bootcampId}`);
  return course;
}

/**
 * Update a course.
 */
export async function updateCourse(courseId, data) {
  const { data: courseCheck } = await supabaseAdmin
    .from('courses')
    .select('bootcamp_id')
    .eq('id', courseId)
    .single();
  await requireAdminOrBootcampMentor(courseCheck?.bootcamp_id);

  const { data: course, error } = await supabaseAdmin
    .from('courses')
    .update({
      title:
        data.title !== undefined
          ? cleanPlainText(data.title?.trim(), 200)
          : undefined,
      description:
        data.description !== undefined
          ? cleanRichText(data.description)
          : undefined,
      is_published: data.is_published,
      is_locked: data.is_locked,
    })
    .eq('id', courseId)
    .select('*, bootcamp_id')
    .single();

  if (error) throw error;

  revalidatePath(`/account/admin/bootcamps/${course.bootcamp_id}`);
  revalidatePath(`/account/member/bootcamps/${course.bootcamp_id}`);
  return course;
}

/**
 * Delete a course.
 */
export async function deleteCourse(courseId) {
  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('bootcamp_id')
    .eq('id', courseId)
    .single();
  await requireAdminOrBootcampMentor(course?.bootcamp_id);

  const { error } = await supabaseAdmin
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) throw error;

  if (course?.bootcamp_id) {
    await recomputeBootcampTotals(course.bootcamp_id);
    revalidatePath(`/account/admin/bootcamps/${course.bootcamp_id}`);
    revalidatePath(`/account/member/bootcamps/${course.bootcamp_id}`);
  }

  return { success: true };
}

/**
 * Reorder courses within a bootcamp.
 */
export async function reorderCourses(bootcampId, courseIds) {
  await requireAdminOrBootcampMentor(bootcampId);

  // Use Promise.all for parallel updates (much faster than sequential)
  const updates = courseIds.map(
    (id, index) =>
      supabaseAdmin
        .from('courses')
        .update({ order_index: index })
        .eq('id', id)
        .eq('bootcamp_id', bootcampId) // Security: ensure course belongs to bootcamp
  );

  await Promise.all(updates);

  revalidatePath(`/account/admin/bootcamps/${bootcampId}`);
  revalidatePath(`/account/member/bootcamps/${bootcampId}`);
  return { success: true };
}

/**
 * Toggle locked state for a course.
 */
export async function toggleCourseLock(courseId, isLocked) {
  const { data: courseCheck } = await supabaseAdmin
    .from('courses')
    .select('bootcamp_id')
    .eq('id', courseId)
    .single();
  await requireAdminOrBootcampMentor(courseCheck?.bootcamp_id);

  const { data: course, error } = await supabaseAdmin
    .from('courses')
    .update({ is_locked: isLocked })
    .eq('id', courseId)
    .select('*, bootcamp_id')
    .single();

  if (error) throw error;

  revalidatePath(`/account/admin/bootcamps/${course.bootcamp_id}`);
  revalidatePath(`/account/member/bootcamps/${course.bootcamp_id}`);
  return course;
}
