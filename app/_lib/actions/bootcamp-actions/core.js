'use server';

/**
 * @file Bootcamp core server actions (split from bootcamp-actions).
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

import { generateSlug, requireAdmin } from './_helpers';

// ─────────────────────────────────────────────────────────────────────────────
// BATCH LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a summary of the current batch: enrollment stats + completion breakdown + history.
 */
export async function getBatchSummary(bootcampId) {
  await requireAdmin();

  const [
    { data: bootcamp },
    { data: enrollments },
    { data: lessons },
    historyResult,
  ] = await Promise.all([
    supabaseAdmin
      .from('bootcamps')
      .select('title, batch_info, start_date, end_date, total_lessons')
      .eq('id', bootcampId)
      .single(),
    supabaseAdmin
      .from('enrollments')
      .select('status, user_id')
      .eq('bootcamp_id', bootcampId),
    supabaseAdmin
      .from('user_progress')
      .select('user_id, is_completed')
      .eq('bootcamp_id', bootcampId)
      .eq('is_completed', true),
    supabaseAdmin
      .from('batch_history')
      .select('*, bootcamps:new_bootcamp_id(id, title, batch_info, status)')
      .eq('source_bootcamp_id', bootcampId)
      .order('archived_at', { ascending: false })
      .limit(5),
  ]);
  const history = historyResult?.error ? [] : historyResult?.data || [];

  const total = enrollments?.length ?? 0;
  const active = enrollments?.filter((e) => e.status === 'active').length ?? 0;
  const pending =
    enrollments?.filter((e) => e.status === 'pending').length ?? 0;
  const completed =
    enrollments?.filter((e) => e.status === 'completed').length ?? 0;
  const cancelled =
    enrollments?.filter((e) => e.status === 'cancelled').length ?? 0;

  const totalLessons = bootcamp?.total_lessons ?? 0;
  const lessonsByUser = {};
  lessons?.forEach((p) => {
    lessonsByUser[p.user_id] = (lessonsByUser[p.user_id] || 0) + 1;
  });
  const graduatedCount = Object.values(lessonsByUser).filter(
    (n) => totalLessons === 0 || n / totalLessons >= 0.8
  ).length;

  return {
    bootcamp,
    stats: {
      total,
      active,
      pending,
      completed,
      cancelled,
      graduated: graduatedCount,
    },
    history,
  };
}

/**
 * Archive the current bootcamp batch and create a new one copying its structure.
 * The new batch gets a fresh slug, incremented batch_info, reset dates, and no enrollments.
 * Curriculum (courses → modules → lessons) is deep-copied.
 */
export async function finishBatchAndStartNew(bootcampId, newBatchData) {
  const userId = await requireAdmin();

  // 1. Archive current bootcamp
  const { error: archiveErr } = await supabaseAdmin
    .from('bootcamps')
    .update({ status: 'archived' })
    .eq('id', bootcampId);
  if (archiveErr) throw archiveErr;

  // 2. Fetch current bootcamp for cloning
  const { data: source, error: fetchErr } = await supabaseAdmin
    .from('bootcamps')
    .select(
      `
      title, description, subtitle, thumbnail, price, category, difficulty, is_featured, enrollment_type, total_lessons, total_duration,
      courses (
        title, description, order_index, is_published, is_locked,
        modules (
          title, description, order_index, is_published, is_locked,
          lessons (
            title, description, content, video_source, video_id, video_url,
            duration, order_index, is_free_preview, is_published, is_locked, attachments,
            type, exam_type, exam_questions, random_question_count, weight
          )
        )
      )
    `
    )
    .eq('id', bootcampId)
    .single();
  if (fetchErr) throw fetchErr;

  // 3. Build new slug (unique)
  const baseSlug = generateSlug(newBatchData.title || source.title);
  let slug = baseSlug;
  const { data: slugConflict } = await supabaseAdmin
    .from('bootcamps')
    .select('id')
    .eq('slug', slug)
    .single();
  if (slugConflict) slug = `${baseSlug}-${Date.now()}`;

  // 4. Insert new bootcamp
  const { data: newBootcamp, error: insertErr } = await supabaseAdmin
    .from('bootcamps')
    .insert({
      title: newBatchData.title || source.title,
      slug,
      description: source.description,
      subtitle: source.subtitle,
      thumbnail: source.thumbnail,
      price:
        newBatchData.price !== '' && newBatchData.price != null
          ? parseFloat(newBatchData.price)
          : (source.price ?? 0),
      status: 'draft',
      batch_info: newBatchData.batch_info || null,
      start_date: newBatchData.start_date || null,
      end_date: newBatchData.end_date || null,
      max_students:
        newBatchData.max_students !== '' && newBatchData.max_students != null
          ? parseInt(newBatchData.max_students)
          : null,
      category: source.category,
      difficulty: source.difficulty,
      is_featured: false,
      enrollment_type: source.enrollment_type || 'approval',
      created_by: userId,
      total_lessons: source.total_lessons,
      total_duration: source.total_duration,
    })
    .select()
    .single();
  if (insertErr) throw insertErr;

  // 5. Deep copy curriculum
  const sortedCourses = (source.courses || []).sort(
    (a, b) => a.order_index - b.order_index
  );
  for (const course of sortedCourses) {
    const { data: newCourse } = await supabaseAdmin
      .from('courses')
      .insert({
        bootcamp_id: newBootcamp.id,
        title: course.title,
        description: course.description,
        order_index: course.order_index,
        is_published: course.is_published,
        is_locked: course.is_locked,
      })
      .select()
      .single();
    if (!newCourse) continue;

    const sortedModules = (course.modules || []).sort(
      (a, b) => a.order_index - b.order_index
    );
    for (const mod of sortedModules) {
      const { data: newModule } = await supabaseAdmin
        .from('modules')
        .insert({
          course_id: newCourse.id,
          title: mod.title,
          description: mod.description,
          order_index: mod.order_index,
          is_published: mod.is_published,
          is_locked: mod.is_locked,
        })
        .select()
        .single();
      if (!newModule) continue;

      const sortedLessons = (mod.lessons || []).sort(
        (a, b) => a.order_index - b.order_index
      );
      if (sortedLessons.length > 0) {
        await supabaseAdmin.from('lessons').insert(
          sortedLessons.map((l) => ({
            module_id: newModule.id,
            title: l.title,
            description: l.description,
            content: l.content,
            video_source: l.video_source,
            video_id: l.video_id,
            video_url: l.video_url,
            duration: l.duration,
            order_index: l.order_index,
            is_free_preview: l.is_free_preview,
            is_published: l.is_published,
            is_locked: l.is_locked,
            attachments: l.attachments,
            weight: l.weight ?? 1,
          }))
        );
      }
    }
  }

  // 6. Record batch history snapshot
  const { data: archivedEnrollments } = await supabaseAdmin
    .from('enrollments')
    .select('status, user_id')
    .eq('bootcamp_id', bootcampId);
  const { data: archivedProgress } = await supabaseAdmin
    .from('user_progress')
    .select('user_id')
    .eq('bootcamp_id', bootcampId)
    .eq('is_completed', true);
  const { data: archivedBootcamp } = await supabaseAdmin
    .from('bootcamps')
    .select('total_lessons, batch_info, start_date, end_date')
    .eq('id', bootcampId)
    .single();

  const enTotal = archivedEnrollments?.length ?? 0;
  const enActive =
    archivedEnrollments?.filter((e) => e.status === 'active').length ?? 0;
  const enCompleted =
    archivedEnrollments?.filter((e) => e.status === 'completed').length ?? 0;
  const enCancelled =
    archivedEnrollments?.filter((e) => e.status === 'cancelled').length ?? 0;
  const tl = archivedBootcamp?.total_lessons ?? 0;
  const progressByUser = {};
  archivedProgress?.forEach((p) => {
    progressByUser[p.user_id] = (progressByUser[p.user_id] || 0) + 1;
  });
  const graduated = Object.values(progressByUser).filter(
    (n) => tl === 0 || n / tl >= 0.8
  ).length;

  // Non-fatal: batch_history table may not exist yet on older deployments
  await supabaseAdmin
    .from('batch_history')
    .insert({
      source_bootcamp_id: bootcampId,
      new_bootcamp_id: newBootcamp.id,
      archived_by: userId,
      enrollment_total: enTotal,
      enrollment_active: enActive,
      enrollment_completed: enCompleted,
      enrollment_cancelled: enCancelled,
      graduated_count: graduated,
      total_lessons: tl,
      batch_info: archivedBootcamp?.batch_info,
      start_date: archivedBootcamp?.start_date,
      end_date: archivedBootcamp?.end_date,
    })
    .then(() => {})
    .catch(() => {});

  revalidatePath('/account/admin/bootcamps');
  revalidatePath('/account/executive/bootcamps');
  revalidatePath(`/account/admin/bootcamps/${bootcampId}`);
  revalidatePath(`/account/executive/bootcamps/${bootcampId}`);

  return { success: true, newBootcampId: newBootcamp.id };
}
