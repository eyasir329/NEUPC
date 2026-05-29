'use server';

/**
 * @file Bootcamp modules server actions (split from bootcamp-actions).
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
// MODULE ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new module within a course.
 */
export async function createModule(courseId, data) {
  // Get course's bootcamp_id and max order_index
  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('bootcamp_id')
    .eq('id', courseId)
    .single();
  await requireAdminOrBootcampMentor(course?.bootcamp_id);

  const { data: existing } = await supabaseAdmin
    .from('modules')
    .select('order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: false })
    .limit(1);

  const orderIndex = (existing?.[0]?.order_index ?? -1) + 1;

  const { data: module, error } = await supabaseAdmin
    .from('modules')
    .insert({
      course_id: courseId,
      title: cleanPlainText(data.title?.trim() || 'Untitled Module', 200),
      description: cleanRichText(data.description) || null,
      order_index: orderIndex,
      is_published: data.is_published !== false,
      is_locked: data.is_locked === true,
    })
    .select()
    .single();

  if (error) throw error;

  if (course?.bootcamp_id) {
    revalidatePath(`/account/admin/bootcamps/${course.bootcamp_id}`);
    revalidatePath(`/account/member/bootcamps/${course.bootcamp_id}`);
  }

  return module;
}

/**
 * Update a module.
 */
export async function updateModule(moduleId, data) {
  const { data: modCheck } = await supabaseAdmin
    .from('modules')
    .select('courses(bootcamp_id)')
    .eq('id', moduleId)
    .single();
  await requireAdminOrBootcampMentor(modCheck?.courses?.bootcamp_id);

  const { data: module, error } = await supabaseAdmin
    .from('modules')
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
    .eq('id', moduleId)
    .select('*, course_id')
    .single();

  if (error) throw error;

  // Get bootcamp_id for revalidation
  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('bootcamp_id')
    .eq('id', module.course_id)
    .single();

  if (course?.bootcamp_id) {
    revalidatePath(`/account/admin/bootcamps/${course.bootcamp_id}`);
    revalidatePath(`/account/member/bootcamps/${course.bootcamp_id}`);
  }

  return module;
}

/**
 * Delete a module.
 */
export async function deleteModule(moduleId) {
  // Get course and bootcamp for revalidation
  const { data: module } = await supabaseAdmin
    .from('modules')
    .select('course_id, courses(bootcamp_id)')
    .eq('id', moduleId)
    .single();
  await requireAdminOrBootcampMentor(module?.courses?.bootcamp_id);

  const { error } = await supabaseAdmin
    .from('modules')
    .delete()
    .eq('id', moduleId);

  if (error) throw error;

  if (module?.courses?.bootcamp_id) {
    await recomputeBootcampTotals(module.courses.bootcamp_id);
    revalidatePath(`/account/admin/bootcamps/${module.courses.bootcamp_id}`);
    revalidatePath(`/account/member/bootcamps/${module.courses.bootcamp_id}`);
  }

  return { success: true };
}

/**
 * Reorder modules within a course.
 */
export async function reorderModules(courseId, moduleIds) {
  const { data: courseCheck } = await supabaseAdmin
    .from('courses')
    .select('bootcamp_id')
    .eq('id', courseId)
    .single();
  await requireAdminOrBootcampMentor(courseCheck?.bootcamp_id);

  // Use Promise.all for parallel updates
  const updates = moduleIds.map(
    (id, index) =>
      supabaseAdmin
        .from('modules')
        .update({ order_index: index })
        .eq('id', id)
        .eq('course_id', courseId) // Security: ensure module belongs to course
  );

  await Promise.all(updates);

  // Get bootcamp_id for revalidation
  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('bootcamp_id')
    .eq('id', courseId)
    .single();

  if (course?.bootcamp_id) {
    revalidatePath(`/account/admin/bootcamps/${course.bootcamp_id}`);
    revalidatePath(`/account/member/bootcamps/${course.bootcamp_id}`);
  }

  return { success: true };
}

/**
 * Toggle locked state for a module.
 */
export async function toggleModuleLock(moduleId, isLocked) {
  const { data: modCheck } = await supabaseAdmin
    .from('modules')
    .select('courses(bootcamp_id)')
    .eq('id', moduleId)
    .single();
  await requireAdminOrBootcampMentor(modCheck?.courses?.bootcamp_id);

  const { data: module, error } = await supabaseAdmin
    .from('modules')
    .update({ is_locked: isLocked })
    .eq('id', moduleId)
    .select('*, course_id')
    .single();

  if (error) throw error;

  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('bootcamp_id')
    .eq('id', module.course_id)
    .single();

  if (course?.bootcamp_id) {
    revalidatePath(`/account/admin/bootcamps/${course.bootcamp_id}`);
    revalidatePath(`/account/member/bootcamps/${course.bootcamp_id}`);
  }

  return module;
}
