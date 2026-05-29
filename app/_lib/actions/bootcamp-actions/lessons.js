'use server';

/**
 * @file Bootcamp lessons server actions (split from bootcamp-actions).
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
  ALLOWED_BOOTCAMP_IMAGE_TYPES,
  MAX_BOOTCAMP_IMAGE_SIZE,
  recomputeBootcampTotals,
  requireAdminOrBootcampMentor,
  requireAdminOrMentor,
  requireLessonAccess,
} from './_helpers';

/**
 * Upload an image for a lesson content block.
 */
export async function uploadLessonImageAction(formData) {
  const adminId = await requireAdminOrMentor();

  const file = formData.get('file');
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: 'No image provided.' };
  }

  if (!ALLOWED_BOOTCAMP_IMAGE_TYPES.includes(file.type)) {
    return { error: 'Image type not supported. Use JPEG, PNG, or WebP.' };
  }

  if (file.size > MAX_BOOTCAMP_IMAGE_SIZE) {
    return {
      error: `File size exceeds maximum of ${MAX_BOOTCAMP_IMAGE_SIZE / (1024 * 1024)}MB`,
    };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `lesson_img_${adminId}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const { url } = await uploadToDrive(
      Buffer.from(arrayBuffer),
      filename,
      file.type,
      'lesson-images'
    );

    return { success: true, url };
  } catch (error) {
    console.error('Lesson image upload error:', error);
    return { error: error.message || 'Failed to upload image.' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LESSON ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new lesson within a module.
 */
export async function createLesson(moduleId, data) {
  const { data: modCheck } = await supabaseAdmin
    .from('modules')
    .select('courses(bootcamp_id)')
    .eq('id', moduleId)
    .single();
  await requireAdminOrBootcampMentor(modCheck?.courses?.bootcamp_id);

  // Get max order_index
  const { data: existing } = await supabaseAdmin
    .from('lessons')
    .select('order_index')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: false })
    .limit(1);

  const orderIndex = (existing?.[0]?.order_index ?? -1) + 1;

  // Process video source
  let videoId = data.video_id || null;
  let duration = data.duration || 0;

  if (data.video_source === 'drive' && videoId) {
    videoId = extractDriveFileId(videoId);

    // Try to get duration from Drive metadata
    if (videoId && !duration) {
      try {
        const metadata = await getFileMetadata(videoId);
        if (metadata.duration) {
          duration = metadata.duration;
        }
      } catch {
        // Ignore errors - duration is optional
      }
    }
  }

  const { data: lesson, error } = await supabaseAdmin
    .from('lessons')
    .insert({
      module_id: moduleId,
      title: cleanPlainText(data.title?.trim() || 'Untitled Lesson', 300),
      description: cleanRichText(data.description) || null,
      content: cleanLessonContent(data.content) || null,
      video_source: data.video_source || 'none',
      video_id: videoId,
      video_url: data.video_url || null,
      duration: parseInt(duration) || 0,
      order_index: orderIndex,
      is_free_preview: data.is_free_preview === true,
      is_published: data.is_published !== false,
      is_locked: data.is_locked === true,
      attachments: cleanAttachments(data.attachments) || [],
      type: data.type || 'lesson',
      exam_type: data.exam_type || null,
      exam_questions: cleanExamQuestions(data.exam_questions) || [],
      practice_problems: cleanPracticeProblems(data.practice_problems) || [],
      weight:
        data.weight !== undefined ? Math.max(0, parseInt(data.weight) || 1) : 1,
      points:
        data.points !== undefined
          ? Math.max(0, parseInt(data.points) || 0)
          : 10,
    })
    .select()
    .single();

  if (error) throw error;

  // Get bootcamp_id for revalidation
  const { data: module } = await supabaseAdmin
    .from('modules')
    .select('course_id, courses(bootcamp_id)')
    .eq('id', moduleId)
    .single();

  if (module?.courses?.bootcamp_id) {
    await recomputeBootcampTotals(module.courses.bootcamp_id);
    revalidatePath(`/account/admin/bootcamps/${module.courses.bootcamp_id}`);
    revalidatePath(`/account/member/bootcamps/${module.courses.bootcamp_id}`);
  }

  return lesson;
}

/**
 * Update a lesson.
 */
export async function updateLesson(lessonId, data) {
  const { data: lesCheck } = await supabaseAdmin
    .from('lessons')
    .select('modules(courses(bootcamp_id))')
    .eq('id', lessonId)
    .single();
  await requireAdminOrBootcampMentor(lesCheck?.modules?.courses?.bootcamp_id);

  let duration = data.duration;
  let videoId = data.video_id;

  if (data.video_source === 'drive' && videoId) {
    videoId = extractDriveFileId(videoId);

    // Try to get duration from Drive metadata if not provided
    if (videoId && (duration === undefined || duration === null)) {
      try {
        const metadata = await getFileMetadata(videoId);
        if (metadata.duration) {
          duration = metadata.duration;
        }
      } catch {
        // Ignore errors
      }
    }
  }

  const updates = {
    title:
      data.title !== undefined
        ? cleanPlainText(data.title?.trim(), 300)
        : undefined,
    description:
      data.description !== undefined
        ? cleanRichText(data.description)
        : undefined,
    content: 'content' in data ? cleanLessonContent(data.content) : undefined,
    video_source: data.video_source,
    video_id: 'video_id' in data ? videoId : undefined,
    video_url: data.video_url,
    duration: duration !== undefined ? parseInt(duration) || 0 : undefined,
    is_free_preview: data.is_free_preview,
    is_published: data.is_published,
    is_locked: data.is_locked,
    attachments:
      'attachments' in data ? cleanAttachments(data.attachments) : undefined,
    type: data.type,
    exam_type: data.exam_type,
    exam_questions:
      'exam_questions' in data
        ? cleanExamQuestions(data.exam_questions)
        : undefined,
    practice_problems:
      'practice_problems' in data
        ? cleanPracticeProblems(data.practice_problems)
        : undefined,
    random_question_count:
      data.random_question_count !== undefined
        ? parseInt(data.random_question_count) || 0
        : undefined,
    weight:
      data.weight !== undefined
        ? Math.max(0, parseInt(data.weight) || 1)
        : undefined,
    points:
      data.points !== undefined
        ? Math.max(0, parseInt(data.points) || 0)
        : undefined,
  };

  // Remove undefined values
  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) delete updates[key];
  });

  const { data: lesson, error } = await supabaseAdmin
    .from('lessons')
    .update(updates)
    .eq('id', lessonId)
    .select('*, module_id')
    .single();

  if (error) throw error;

  // Get bootcamp_id for revalidation
  const { data: module } = await supabaseAdmin
    .from('modules')
    .select('course_id, courses(bootcamp_id)')
    .eq('id', lesson.module_id)
    .single();

  if (module?.courses?.bootcamp_id) {
    const bootcampId = module.courses.bootcamp_id;
    // Duration may have changed → refresh totals
    if ('duration' in updates) {
      await recomputeBootcampTotals(bootcampId);
    }
    revalidatePath(`/account/admin/bootcamps/${bootcampId}`);
    revalidatePath(`/account/member/bootcamps/${bootcampId}`);
    revalidatePath(`/account/member/bootcamps/${bootcampId}/${lessonId}`);
  }

  return lesson;
}

/**
 * Delete a lesson.
 */
export async function deleteLesson(lessonId) {
  // Get module and bootcamp for revalidation
  const { data: lesson } = await supabaseAdmin
    .from('lessons')
    .select('module_id, modules(course_id, courses(bootcamp_id))')
    .eq('id', lessonId)
    .single();
  await requireAdminOrBootcampMentor(lesson?.modules?.courses?.bootcamp_id);

  const { error } = await supabaseAdmin
    .from('lessons')
    .delete()
    .eq('id', lessonId);

  if (error) throw error;

  if (lesson?.modules?.courses?.bootcamp_id) {
    await recomputeBootcampTotals(lesson.modules.courses.bootcamp_id);
    revalidatePath(
      `/account/admin/bootcamps/${lesson.modules.courses.bootcamp_id}`
    );
    revalidatePath(
      `/account/member/bootcamps/${lesson.modules.courses.bootcamp_id}`
    );
  }

  return { success: true };
}

/**
 * Reorder lessons within a module.
 */
export async function reorderLessons(moduleId, lessonIds) {
  const { data: modCheck } = await supabaseAdmin
    .from('modules')
    .select('courses(bootcamp_id)')
    .eq('id', moduleId)
    .single();
  await requireAdminOrBootcampMentor(modCheck?.courses?.bootcamp_id);

  // Use Promise.all for parallel updates
  const updates = lessonIds.map(
    (id, index) =>
      supabaseAdmin
        .from('lessons')
        .update({ order_index: index })
        .eq('id', id)
        .eq('module_id', moduleId) // Security: ensure lesson belongs to module
  );

  await Promise.all(updates);

  // Get bootcamp_id for revalidation
  const { data: mod } = await supabaseAdmin
    .from('modules')
    .select('course_id, courses(bootcamp_id)')
    .eq('id', moduleId)
    .single();

  if (mod?.courses?.bootcamp_id) {
    revalidatePath(`/account/admin/bootcamps/${mod.courses.bootcamp_id}`);
    revalidatePath(`/account/member/bootcamps/${mod.courses.bootcamp_id}`);
  }

  return { success: true };
}

/**
 * Toggle locked state for a lesson.
 */
export async function toggleLessonLock(lessonId, isLocked) {
  const { data: lesCheck } = await supabaseAdmin
    .from('lessons')
    .select('modules(courses(bootcamp_id))')
    .eq('id', lessonId)
    .single();
  await requireAdminOrBootcampMentor(lesCheck?.modules?.courses?.bootcamp_id);

  const { data: lesson, error } = await supabaseAdmin
    .from('lessons')
    .update({ is_locked: isLocked })
    .eq('id', lessonId)
    .select('*, module_id')
    .single();

  if (error) throw error;

  const { data: module } = await supabaseAdmin
    .from('modules')
    .select('course_id, courses(bootcamp_id)')
    .eq('id', lesson.module_id)
    .single();

  if (module?.courses?.bootcamp_id) {
    revalidatePath(`/account/admin/bootcamps/${module.courses.bootcamp_id}`);
    revalidatePath(`/account/member/bootcamps/${module.courses.bootcamp_id}`);
  }

  return lesson;
}

/**
 * Get a single lesson with full details.
 */
export async function getLesson(lessonId) {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');

  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select(
      'id, title, description, video_source, video_id, video_url, duration, content, attachments, is_published, order_index, type, exam_type, exam_questions, random_question_count, practice_problems'
    )
    .eq('id', lessonId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch only the heavy fields missing from the curriculum stub.
 * Used by the SPA when switching lessons — stub already has
 * id/title/duration/video_source/video_id, so we only need the rest.
 */
export async function getLessonContent(lessonId) {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');

  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select(
      'id, content, attachments, video_url, type, exam_type, exam_questions, random_question_count, practice_problems'
    )
    .eq('id', lessonId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update lesson progress.
 */
export async function updateLessonProgress(lessonId, progressData) {
  const { userId, bootcampId } = await requireLessonAccess(lessonId);

  // Upsert progress
  const { data, error } = await supabaseAdmin
    .from('user_progress')
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        bootcamp_id: bootcampId,
        watch_time: progressData.watch_time,
        last_position: progressData.last_position,
        is_completed: progressData.is_completed,
        completed_at: progressData.is_completed
          ? new Date().toISOString()
          : null,
      },
      {
        onConflict: 'user_id,lesson_id',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Touch a lesson's progress row so updated_at advances — enables resume tracking.
 * No-op if the row already exists and was updated within the last 30 seconds.
 */
export async function touchLessonAccess(lessonId /* , _ignoredBootcampId */) {
  // Verify enrollment before doing anything — caller may not be in the bootcamp.
  let userId, bootcampId;
  try {
    ({ userId, bootcampId } = await requireLessonAccess(lessonId));
  } catch {
    return null;
  }

  const { data: existing } = await supabaseAdmin
    .from('user_progress')
    .select('id, updated_at')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (existing) {
    const age = Date.now() - new Date(existing.updated_at).getTime();
    if (age < 30_000) return null; // already fresh
    await supabaseAdmin
      .from('user_progress')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    return null;
  }

  await supabaseAdmin.from('user_progress').upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      bootcamp_id: bootcampId,
      watch_time: 0,
      last_position: 0,
      is_completed: false,
    },
    { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }
  );

  return null;
}

/**
 * Mark a lesson as completed.
 * Preserves existing watch_time/last_position; only flips completion flag.
 * Pass `bootcampId` from the client to skip the lesson join query.
 */
export async function markLessonComplete(lessonId /* , _ignoredBootcampId */) {
  // bootcampId from the client is ignored — derived server-side to prevent
  // attribution attacks and IDOR.
  const { userId, bootcampId } = await requireLessonAccess(lessonId);

  // Use UPDATE if the row exists so we don't clobber watch_time from an
  // in-flight tick's increment. Only INSERT (with zeros) when first-time.
  const { data: existing } = await supabaseAdmin
    .from('user_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  const completionPatch = {
    is_completed: true,
    completed_at: new Date().toISOString(),
  };

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .update(completionPatch)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabaseAdmin
    .from('user_progress')
    .insert({
      user_id: userId,
      lesson_id: lessonId,
      bootcamp_id: bootcampId,
      watch_time: 0,
      last_position: 0,
      ...completionPatch,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark a lesson as incomplete.
 * Pass `bootcampId` from the client to skip the lesson join query.
 */
export async function markLessonIncomplete(
  lessonId /* , _ignoredBootcampId */
) {
  const { userId, bootcampId } = await requireLessonAccess(lessonId);

  const { error } = await supabaseAdmin.from('user_progress').upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      bootcamp_id: bootcampId,
      is_completed: false,
      completed_at: null,
    },
    { onConflict: 'user_id,lesson_id' }
  );

  if (error) throw error;
  return { success: true };
}

/**
 * Save lesson notes.
 */
export async function saveLessonNotes(lessonId, notes) {
  const { userId, bootcampId } = await requireLessonAccess(lessonId);

  const { data, error } = await supabaseAdmin
    .from('user_progress')
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        bootcamp_id: bootcampId,
        notes: cleanRichText(notes, 20000),
      },
      {
        onConflict: 'user_id,lesson_id',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
