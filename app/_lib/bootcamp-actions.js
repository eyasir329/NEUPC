/**
 * @file Bootcamp server actions for admin and member operations.
 * @module bootcamp-actions
 *
 * Handles all CRUD operations for bootcamps, courses, modules, lessons,
 * enrollments, and user progress tracking.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/app/_lib/supabase';
import { auth } from '@/app/_lib/auth';
import { uploadToDrive } from './gdrive';
import { extractDriveFileId } from './utils';
import {
  getFileMetadata,
  canAccessFile,
} from './bootcamp-video';
import {
  cleanRichText,
  cleanPlainText,
  cleanLessonContent,
  cleanExamQuestions,
  cleanPracticeProblems,
  cleanAttachments,
} from './bootcamp-sanitize';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve session → { userId, roleNames }. Returns nulls when unauthenticated.
 * Single source of truth for the auth/lookup dance these actions share.
 */
async function getSessionUserAndRoles() {
  const session = await auth();
  if (!session?.user?.email) return { userId: null, roleNames: [] };

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single();

  if (!user) return { userId: null, roleNames: [] };

  const { data: roles } = await supabaseAdmin
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);

  const roleNames = (roles || []).map((r) => r.roles?.name).filter(Boolean);
  return { userId: user.id, roleNames };
}

/**
 * Throw if the current user lacks any of the given roles; otherwise return userId.
 */
async function requireAnyRole(allowedRoles, deniedMessage = 'Access denied') {
  const { userId, roleNames } = await getSessionUserAndRoles();
  if (!userId) throw new Error('Unauthorized');
  if (!allowedRoles.some((r) => roleNames.includes(r))) {
    throw new Error(deniedMessage);
  }
  return userId;
}

/**
 * Check if current user is admin or executive.
 */
async function requireAdmin() {
  return requireAnyRole(['admin', 'executive'], 'Admin or Executive access required');
}

/**
 * Check if current user is admin, executive, or any mentor.
 */
async function requireAdminOrMentor() {
  return requireAnyRole(['admin', 'executive', 'mentor']);
}

/**
 * Check if current user is admin, executive, or a mentor assigned to this specific bootcamp.
 */
async function requireAdminOrBootcampMentor(bootcampId) {
  const { userId, roleNames } = await getSessionUserAndRoles();
  if (!userId) throw new Error('Unauthorized');
  if (roleNames.includes('admin') || roleNames.includes('executive')) return userId;
  if (bootcampId) {
    const { data: mentorRow } = await supabaseAdmin
      .from('bootcamp_mentors')
      .select('id')
      .eq('bootcamp_id', bootcampId)
      .eq('user_id', userId)
      .single();
    if (mentorRow) return userId;
  }
  throw new Error('Access denied');
}

/**
 * Get current user ID.
 */
async function getCurrentUserId() {
  const { userId } = await getSessionUserAndRoles();
  return userId;
}

/**
 * Resolve the bootcamp owning a lesson and assert the current user is
 * enrolled (active status) in it. Free-preview lessons skip enrollment.
 * Centralized so progress/notes/practice actions can't be called for a
 * bootcamp the caller isn't a member of (closes IDOR).
 *
 * @returns {Promise<{ userId: string, bootcampId: string, lessonId: string, isFreePreview: boolean }>}
 * @throws if unauthenticated, lesson missing, or user not enrolled.
 */
async function requireLessonAccess(lessonId) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data: lesson } = await supabaseAdmin
    .from('lessons')
    .select('id, is_free_preview, modules(courses(bootcamp_id))')
    .eq('id', lessonId)
    .single();
  const bootcampId = lesson?.modules?.courses?.bootcamp_id;
  if (!bootcampId) throw new Error('Lesson not found');

  if (lesson.is_free_preview) {
    return { userId, bootcampId, lessonId, isFreePreview: true };
  }

  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('status')
    .eq('user_id', userId)
    .eq('bootcamp_id', bootcampId)
    .single();
  if (!enrollment || enrollment.status !== 'active') {
    throw new Error('Not enrolled in this bootcamp');
  }

  return { userId, bootcampId, lessonId, isFreePreview: false };
}

/**
 * Generate a URL-friendly slug from a string.
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const ALLOWED_BOOTCAMP_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MAX_BOOTCAMP_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Recompute and persist total_lessons / total_duration on a bootcamp
 * by aggregating across its courses → modules → lessons.
 */
async function recomputeBootcampTotals(bootcampId) {
  if (!bootcampId) return;
  try {
    const { data: lessons } = await supabaseAdmin
      .from('lessons')
      .select('duration, modules!inner(course_id, courses!inner(bootcamp_id))')
      .eq('modules.courses.bootcamp_id', bootcampId);

    const total_lessons = lessons?.length || 0;
    const total_duration = (lessons || []).reduce(
      (sum, l) => sum + (parseInt(l.duration) || 0),
      0
    );

    await supabaseAdmin
      .from('bootcamps')
      .update({ total_lessons, total_duration })
      .eq('id', bootcampId);
  } catch {
    // Non-fatal: stale totals are cosmetic, don't break the parent op
  }
}

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
 * Upload a bootcamp thumbnail image before the bootcamp exists.
 */
export async function uploadBootcampThumbnailAction(formData) {
  const adminId = await requireAdmin();

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
  const filename = `bootcamp_${adminId}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const { url } = await uploadToDrive(
      Buffer.from(arrayBuffer),
      filename,
      file.type,
      'bootcamp-thumbnails'
    );

    return { success: true, url };
  } catch (error) {
    console.error('Bootcamp thumbnail upload error:', error);
    return { error: error.message || 'Failed to upload image.' };
  }
}

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
      .from('users').select('id').eq('email', session.user.email).single();
    let hasAccess = false;
    if (u) {
      const { data: roles } = await supabaseAdmin
        .from('user_roles').select('roles(name)').eq('user_id', u.id);
      const isAdmin = roles?.some((r) => r.roles?.name === 'admin' || r.roles?.name === 'executive');
      if (isAdmin) {
        hasAccess = true;
      } else {
        const { data: mentorRow } = await supabaseAdmin
          .from('bootcamp_mentors').select('id').eq('bootcamp_id', data.id).eq('user_id', u.id).single();
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
      .from('users').select('id').eq('email', session.user.email).single();
    let isAdmin = false;
    if (u) {
      const { data: roles } = await supabaseAdmin
        .from('user_roles').select('roles(name)').eq('user_id', u.id);
      isAdmin = roles?.some((r) => r.roles?.name === 'admin' || r.roles?.name === 'executive');
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
    } else if (field === 'batch_info' || field === 'thumbnail' || field === 'subtitle' || field === 'category' || field === 'difficulty') {
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
  const { data: courseCheck } = await supabaseAdmin.from('courses').select('bootcamp_id').eq('id', courseId).single();
  await requireAdminOrBootcampMentor(courseCheck?.bootcamp_id);

  const { data: course, error } = await supabaseAdmin
    .from('courses')
    .update({
      title: data.title !== undefined ? cleanPlainText(data.title?.trim(), 200) : undefined,
      description: data.description !== undefined ? cleanRichText(data.description) : undefined,
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
  const { data: courseCheck } = await supabaseAdmin.from('courses').select('bootcamp_id').eq('id', courseId).single();
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
  const { data: modCheck } = await supabaseAdmin.from('modules').select('courses(bootcamp_id)').eq('id', moduleId).single();
  await requireAdminOrBootcampMentor(modCheck?.courses?.bootcamp_id);

  const { data: module, error } = await supabaseAdmin
    .from('modules')
    .update({
      title: data.title !== undefined ? cleanPlainText(data.title?.trim(), 200) : undefined,
      description: data.description !== undefined ? cleanRichText(data.description) : undefined,
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
  const { data: courseCheck } = await supabaseAdmin.from('courses').select('bootcamp_id').eq('id', courseId).single();
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
  const { data: modCheck } = await supabaseAdmin.from('modules').select('courses(bootcamp_id)').eq('id', moduleId).single();
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

// ─────────────────────────────────────────────────────────────────────────────
// LESSON ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new lesson within a module.
 */
export async function createLesson(moduleId, data) {
  const { data: modCheck } = await supabaseAdmin.from('modules').select('courses(bootcamp_id)').eq('id', moduleId).single();
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
      weight: data.weight !== undefined ? Math.max(0, parseInt(data.weight) || 1) : 1,
      points: data.points !== undefined ? Math.max(0, parseInt(data.points) || 0) : 10,
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
  const { data: lesCheck } = await supabaseAdmin.from('lessons').select('modules(courses(bootcamp_id))').eq('id', lessonId).single();
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
    title: data.title !== undefined ? cleanPlainText(data.title?.trim(), 300) : undefined,
    description: data.description !== undefined ? cleanRichText(data.description) : undefined,
    content: 'content' in data ? cleanLessonContent(data.content) : undefined,
    video_source: data.video_source,
    video_id: 'video_id' in data ? videoId : undefined,
    video_url: data.video_url,
    duration: duration !== undefined ? parseInt(duration) || 0 : undefined,
    is_free_preview: data.is_free_preview,
    is_published: data.is_published,
    is_locked: data.is_locked,
    attachments: 'attachments' in data ? cleanAttachments(data.attachments) : undefined,
    type: data.type,
    exam_type: data.exam_type,
    exam_questions: 'exam_questions' in data ? cleanExamQuestions(data.exam_questions) : undefined,
    practice_problems: 'practice_problems' in data ? cleanPracticeProblems(data.practice_problems) : undefined,
    random_question_count: data.random_question_count !== undefined ? parseInt(data.random_question_count) || 0 : undefined,
    weight: data.weight !== undefined ? Math.max(0, parseInt(data.weight) || 1) : undefined,
    points: data.points !== undefined ? Math.max(0, parseInt(data.points) || 0) : undefined,
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
  const { data: modCheck } = await supabaseAdmin.from('modules').select('courses(bootcamp_id)').eq('id', moduleId).single();
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
  const { data: lesCheck } = await supabaseAdmin.from('lessons').select('modules(courses(bootcamp_id))').eq('id', lessonId).single();
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
    .select('id, content, attachments, video_url, type, exam_type, exam_questions, random_question_count, practice_problems')
    .eq('id', lessonId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Validate a Google Drive video ID and return metadata.
 */
export async function validateDriveVideo(videoId) {
  await requireAdminOrMentor();
  try {
    const fileId = extractDriveFileId(videoId);
    if (!fileId) {
      return { valid: false, error: 'Invalid Drive URL or ID' };
    }

    const hasAccess = await canAccessFile(fileId);
    if (!hasAccess) {
      return {
        valid: false,
        error:
          "Cannot access file. Make sure it's shared with the service account.",
      };
    }

    const metadata = await getFileMetadata(fileId);
    return {
      valid: true,
      fileId,
      name: metadata.name,
      duration: metadata.duration,
      mimeType: metadata.mimeType,
    };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

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

  await supabaseAdmin.from('user_progress').upsert({
    user_id: userId,
    lesson_id: lessonId,
    bootcamp_id: bootcampId,
    watch_time: 0,
    last_position: 0,
    is_completed: false,
  }, { onConflict: 'user_id,lesson_id', ignoreDuplicates: true });

  return null;
}

/**
 * Increment cumulative watch_time for a lesson and update last_position.
 * Use this for periodic ticks from the player. `deltaSeconds` is how many
 * seconds of *new* playback have elapsed since the last tick.
 * Pass `bootcampId` from the client to skip the lesson join query.
 */
export async function updateWatchTimeDelta(lessonId, deltaSeconds, lastPosition /* , _ignoredBootcampId */) {
  const delta = Math.max(0, Math.floor(Number(deltaSeconds) || 0));
  const posKnown = lastPosition != null && Number.isFinite(Number(lastPosition));
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
  const allLessonIds = [...new Set(rows.flatMap(r => Object.keys(r.lesson_watch_times || {})))];
  if (allLessonIds.length > 0) {
    const { data: lessons } = await supabaseAdmin
      .from('lessons')
      .select('id, title')
      .in('id', allLessonIds);
    const titleMap = Object.fromEntries((lessons || []).map(l => [l.id, l.title]));
    rows.forEach(r => {
      const lwt = r.lesson_watch_times || {};
      r.completed_lessons = Object.entries(lwt).map(([id, secs]) => ({
        id,
        title: titleMap[id] || 'Lesson',
        watch_time: secs,
      }));
    });
  } else {
    rows.forEach(r => { r.completed_lessons = []; });
  }

  return rows;
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
export async function markLessonIncomplete(lessonId /* , _ignoredBootcampId */) {
  const { userId, bootcampId } = await requireLessonAccess(lessonId);

  const { error } = await supabaseAdmin
    .from('user_progress')
    .upsert(
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

/**
 * Toggle a practice problem's solved status for a user.
 * Automatically marks the entire lesson as completed when all problems are solved.
 */
export async function togglePracticeProblemSolved(lessonId, problemIndex, solved /* , _ignoredBootcampId */) {
  const { userId, bootcampId } = await requireLessonAccess(lessonId);

  // Get current user progress
  const { data: progress } = await supabaseAdmin
    .from('user_progress')
    .select('id, solved_problems, is_completed')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  // Get total practice problems configured
  const { data: lessonData } = await supabaseAdmin
    .from('lessons')
    .select('practice_problems')
    .eq('id', lessonId)
    .single();

  const totalProblems = lessonData?.practice_problems || [];
  let currentSolved = progress?.solved_problems || [];

  if (solved) {
    if (!currentSolved.includes(problemIndex)) {
      currentSolved = [...currentSolved, problemIndex];
    }
  } else {
    currentSolved = currentSolved.filter((idx) => idx !== problemIndex);
  }

  // Determine if all practice problems are solved
  // If no practice problems are configured, or all of them are solved
  const isAllSolved = totalProblems.length > 0 && totalProblems.every((_, idx) => currentSolved.includes(idx));

  const patch = {
    solved_problems: currentSolved,
    // If all are solved, auto mark lesson as completed
    is_completed: isAllSolved,
    completed_at: isAllSolved ? new Date().toISOString() : null,
  };

  let result;
  if (progress) {
    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .update(patch)
      .eq('id', progress.id)
      .select()
      .single();
    if (error) throw error;
    result = data;
  } else {
    const { data, error } = await supabaseAdmin
      .from('user_progress')
      .insert({
        user_id: userId,
        lesson_id: lessonId,
        bootcamp_id: bootcampId,
        watch_time: 0,
        last_position: 0,
        ...patch,
      })
      .select()
      .single();
    if (error) throw error;
    result = data;
  }

  // Revalidate to show updated completion in progress calculations
  revalidatePath(`/account/member/bootcamps/${bootcampId}`);
  revalidatePath(`/account/member/bootcamps/${bootcampId}/${lessonId}`);

  return result;
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
  const safe = String(query).replace(/[,()*%\\]/g, '').slice(0, 100);
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
  const { data: enrCheck } = await supabaseAdmin.from('enrollments').select('bootcamp_id').eq('id', enrollmentId).single();
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
  const { data: enrCheck } = await supabaseAdmin.from('enrollments').select('bootcamp_id').eq('id', enrollmentId).single();
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
  const { data: enrCheck } = await supabaseAdmin.from('enrollments').select('bootcamp_id').eq('id', enrollmentId).single();
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
  const { data: enrCheck } = await supabaseAdmin.from('enrollments').select('bootcamp_id').eq('id', enrollmentId).single();
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
    if (p.is_completed) completedMap[p.user_id] = (completedMap[p.user_id] || 0) + 1;
    watchTimeMap[p.user_id] = (watchTimeMap[p.user_id] || 0) + (p.watch_time || 0);
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
    taskPtsMap[s.user_id] = (taskPtsMap[s.user_id] || 0) + (s.points_earned || 0);
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
        sessionPtsMap[a.user_id] = (sessionPtsMap[a.user_id] || 0) + (a.points || 0);
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
      .select(`
        title,
        courses (
          id, title, order_index,
          modules (
            id, title, order_index,
            lessons (id, title, order_index, duration, is_published, video_source, video_id, type, exam_type, random_question_count, weight)
          )
        )
      `)
      .eq('id', bootcampId)
      .single(),
    supabaseAdmin
      .from('user_progress')
      .select('lesson_id, is_completed, completed_at, watch_time, last_position')
      .eq('bootcamp_id', bootcampId)
      .eq('user_id', userId),
  ]);

  const progressMap = {};
  progressRows?.forEach((p) => { progressMap[p.lesson_id] = p; });

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
    .select('users!user_roles_user_id_fkey(id, full_name, avatar_url, email), roles!inner(name)')
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
    .select('assigned_at, bootcamps(id, title, slug, description, thumbnail, status, batch_info, start_date, end_date, total_lessons, total_duration, is_featured)')
    .eq('user_id', userId)
    .order('assigned_at', { ascending: false });

  if (error) throw error;

  return (data || [])
    .map((r) => r.bootcamps)
    .filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a summary of the current batch: enrollment stats + completion breakdown + history.
 */
export async function getBatchSummary(bootcampId) {
  await requireAdmin();

  const [{ data: bootcamp }, { data: enrollments }, { data: lessons }, historyResult] = await Promise.all([
    supabaseAdmin.from('bootcamps').select('title, batch_info, start_date, end_date, total_lessons').eq('id', bootcampId).single(),
    supabaseAdmin.from('enrollments').select('status, user_id').eq('bootcamp_id', bootcampId),
    supabaseAdmin.from('user_progress').select('user_id, is_completed').eq('bootcamp_id', bootcampId).eq('is_completed', true),
    supabaseAdmin.from('batch_history').select('*, bootcamps:new_bootcamp_id(id, title, batch_info, status)').eq('source_bootcamp_id', bootcampId).order('archived_at', { ascending: false }).limit(5),
  ]);
  const history = historyResult?.error ? [] : (historyResult?.data || []);

  const total = enrollments?.length ?? 0;
  const active = enrollments?.filter((e) => e.status === 'active').length ?? 0;
  const pending = enrollments?.filter((e) => e.status === 'pending').length ?? 0;
  const completed = enrollments?.filter((e) => e.status === 'completed').length ?? 0;
  const cancelled = enrollments?.filter((e) => e.status === 'cancelled').length ?? 0;

  const totalLessons = bootcamp?.total_lessons ?? 0;
  const lessonsByUser = {};
  lessons?.forEach((p) => { lessonsByUser[p.user_id] = (lessonsByUser[p.user_id] || 0) + 1; });
  const graduatedCount = Object.values(lessonsByUser).filter(
    (n) => totalLessons === 0 || n / totalLessons >= 0.8
  ).length;

  return {
    bootcamp,
    stats: { total, active, pending, completed, cancelled, graduated: graduatedCount },
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
    .select(`
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
    `)
    .eq('id', bootcampId)
    .single();
  if (fetchErr) throw fetchErr;

  // 3. Build new slug (unique)
  const baseSlug = generateSlug(newBatchData.title || source.title);
  let slug = baseSlug;
  const { data: slugConflict } = await supabaseAdmin.from('bootcamps').select('id').eq('slug', slug).single();
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
      price: newBatchData.price !== '' && newBatchData.price != null ? parseFloat(newBatchData.price) : (source.price ?? 0),
      status: 'draft',
      batch_info: newBatchData.batch_info || null,
      start_date: newBatchData.start_date || null,
      end_date: newBatchData.end_date || null,
      max_students: newBatchData.max_students !== '' && newBatchData.max_students != null ? parseInt(newBatchData.max_students) : null,
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
  const sortedCourses = (source.courses || []).sort((a, b) => a.order_index - b.order_index);
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

    const sortedModules = (course.modules || []).sort((a, b) => a.order_index - b.order_index);
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

      const sortedLessons = (mod.lessons || []).sort((a, b) => a.order_index - b.order_index);
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
    .from('enrollments').select('status, user_id').eq('bootcamp_id', bootcampId);
  const { data: archivedProgress } = await supabaseAdmin
    .from('user_progress').select('user_id').eq('bootcamp_id', bootcampId).eq('is_completed', true);
  const { data: archivedBootcamp } = await supabaseAdmin
    .from('bootcamps').select('total_lessons, batch_info, start_date, end_date').eq('id', bootcampId).single();

  const enTotal = archivedEnrollments?.length ?? 0;
  const enActive = archivedEnrollments?.filter((e) => e.status === 'active').length ?? 0;
  const enCompleted = archivedEnrollments?.filter((e) => e.status === 'completed').length ?? 0;
  const enCancelled = archivedEnrollments?.filter((e) => e.status === 'cancelled').length ?? 0;
  const tl = archivedBootcamp?.total_lessons ?? 0;
  const progressByUser = {};
  archivedProgress?.forEach((p) => { progressByUser[p.user_id] = (progressByUser[p.user_id] || 0) + 1; });
  const graduated = Object.values(progressByUser).filter((n) => tl === 0 || n / tl >= 0.8).length;

  // Non-fatal: batch_history table may not exist yet on older deployments
  await supabaseAdmin.from('batch_history').insert({
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
  }).then(() => {}).catch(() => {});

  revalidatePath('/account/admin/bootcamps');
  revalidatePath('/account/executive/bootcamps');
  revalidatePath(`/account/admin/bootcamps/${bootcampId}`);
  revalidatePath(`/account/executive/bootcamps/${bootcampId}`);

  return { success: true, newBootcampId: newBootcamp.id };
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
    .select('id, user_id, status, enrolled_at, users(id, full_name, email, avatar_url, member_profiles(academic_session, student_id, department, semester))')
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
    progress_percent: totalLessons > 0
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
    .select('id, mentee_id, users!mentorships_mentee_id_fkey(id, full_name, avatar_url)')
    .eq('mentor_id', mentorId);

  if (!mentorships?.length) return [];

  const mentorshipIds = mentorships.map((m) => m.id);
  const menteeMap = Object.fromEntries(mentorships.map((m) => [m.id, m['users!mentorships_mentee_id_fkey']]));

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
    .select('user_id, users(id, full_name, email, member_profiles(academic_session, student_id, department, skills))')
    .eq('bootcamp_id', bootcampId);

  const userIds = (enrollments || []).map((e) => e.user_id);
  if (userIds.length === 0) return [];

  // Existing mentorships for this mentor with these enrolled members
  const { data: mentorships } = await supabaseAdmin
    .from('mentorships')
    .select('id, mentee_id, status, focus_area, notes')
    .eq('mentor_id', mentorId)
    .in('mentee_id', userIds);

  const mentorshipByMentee = Object.fromEntries((mentorships || []).map((m) => [m.mentee_id, m]));

  // Collect all mentee IDs (enrolled members, regardless of having a mentorship)
  const menteeIds = userIds;

  const { data: progressRows } = await supabaseAdmin
    .from('member_progress')
    .select('user_id, period, problems_solved, contests_participated, mentor_notes')
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
 * Get tasks scoped to a bootcamp.
 * Requires bootcamp_id column on weekly_tasks table.
 * Migration: ALTER TABLE weekly_tasks ADD COLUMN IF NOT EXISTS bootcamp_id uuid REFERENCES bootcamps(id);
 */
export async function getBootcampTasks(bootcampId) {
  await requireAdminOrBootcampMentor(bootcampId);
  const { data, error } = await supabaseAdmin
    .from('weekly_tasks')
    .select('*')
    .eq('bootcamp_id', bootcampId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function createBootcampTaskAction(formData) {
  'use server';
  try {
    const bootcampId = formData.get('bootcamp_id');
    const mentorId = await requireAdminOrBootcampMentor(bootcampId);
    const title = cleanPlainText(formData.get('title')?.trim(), 300);
    const description = cleanRichText(formData.get('description')?.trim() || '', 20000) || null;
    const difficulty = formData.get('difficulty') || 'medium';
    const deadline = formData.get('deadline');
    const problem_links = (() => {
      try { return JSON.parse(formData.get('problem_links') || '[]'); }
      catch { return []; }
    })();

    if (!title || !deadline) return { error: 'Title and deadline are required' };

    const { data, error } = await supabaseAdmin
      .from('weekly_tasks')
      .insert([{ title, description, difficulty, deadline: new Date(deadline).toISOString(), assigned_by: mentorId, problem_links, bootcamp_id: bootcampId }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    revalidatePath(`/account/mentor/bootcamps/${bootcampId}`);
    return { success: 'Task created', data };
  } catch (err) {
    return { error: err.message };
  }
}

export async function updateBootcampTaskAction(formData) {
  'use server';
  try {
    const bootcampId = formData.get('bootcamp_id');
    const mentorId = await requireAdminOrBootcampMentor(bootcampId);
    const id = formData.get('id');
    const title = cleanPlainText(formData.get('title')?.trim(), 300);
    const description = cleanRichText(formData.get('description')?.trim() || '', 20000) || null;
    const difficulty = formData.get('difficulty') || 'medium';
    const deadline = formData.get('deadline');
    const problem_links = (() => {
      try { return JSON.parse(formData.get('problem_links') || '[]'); }
      catch { return []; }
    })();

    if (!id || !title || !deadline) return { error: 'Missing required fields' };

    const { data: existing } = await supabaseAdmin
      .from('weekly_tasks').select('assigned_by').eq('id', id).single();
    if (existing?.assigned_by !== mentorId) return { error: 'Not authorized' };

    const { error } = await supabaseAdmin
      .from('weekly_tasks')
      .update({ title, description, difficulty, deadline: new Date(deadline).toISOString(), problem_links, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath(`/account/mentor/bootcamps/${bootcampId}`);
    return { success: 'Task updated' };
  } catch (err) {
    return { error: err.message };
  }
}

export async function deleteBootcampTaskAction(formData) {
  'use server';
  try {
    const bootcampId = formData.get('bootcamp_id');
    const mentorId = await requireAdminOrBootcampMentor(bootcampId);
    const id = formData.get('id');

    const { data: existing } = await supabaseAdmin
      .from('weekly_tasks').select('assigned_by').eq('id', id).single();
    if (existing?.assigned_by !== mentorId) return { error: 'Not authorized' };

    const { error } = await supabaseAdmin.from('weekly_tasks').delete().eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath(`/account/mentor/bootcamps/${bootcampId}`);
    return { success: 'Task deleted' };
  } catch (err) {
    return { error: err.message };
  }
}

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
    const notes = cleanRichText(formData.get('notes')?.trim() || '', 20000) || null;

    if (!member_user_id || !topic || !session_date) return { error: 'Member, topic and date are required' };

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
        .insert([{ mentor_id: mentorId, mentee_id: member_user_id, status: 'active', start_date: new Date().toISOString().slice(0, 10) }])
        .select('id')
        .single();
      if (createErr) throw new Error(createErr.message);
      mentorshipId = created.id;
    }

    const { data: session, error } = await supabaseAdmin
      .from('mentorship_sessions')
      .insert([{ mentorship_id: mentorshipId, topic, session_date: new Date(session_date).toISOString(), duration, notes, created_by: mentorId }])
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
    const notes = cleanRichText(formData.get('notes')?.trim() || '', 20000) || null;
    const attended = formData.get('attended') === 'true';

    // Verify mentor owns the mentorship linked to this session
    const { data: session } = await supabaseAdmin
      .from('mentorship_sessions')
      .select('mentorship_id, mentorships(mentor_id)')
      .eq('id', sessionId)
      .single();
    if (session?.mentorships?.mentor_id !== mentorId) return { error: 'Not authorized' };

    const { error } = await supabaseAdmin
      .from('mentorship_sessions').update({ notes, attended }).eq('id', sessionId);

    if (error) throw new Error(error.message);
    revalidatePath(`/account/mentor/bootcamps/${bootcampId}`);
    return { success: 'Session updated' };
  } catch (err) {
    return { error: err.message };
  }
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
        .from('mentorships').update({ notes }).eq('id', existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from('mentorships')
        .insert([{ mentor_id: mentorId, mentee_id: menteeUserId, notes, status: 'active', start_date: new Date().toISOString().slice(0, 10) }]);
      if (error) throw new Error(error.message);
    }

    revalidatePath(`/account/mentor/bootcamps/${bootcampId}`);
    return { success: 'Notes saved' };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Fetch help tickets for a bootcamp.
 * Requires table: bootcamp_help_requests(id, bootcamp_id, user_id, subject, body, status, reply, created_at)
 * Migration: CREATE TABLE IF NOT EXISTS bootcamp_help_requests (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   bootcamp_id uuid REFERENCES bootcamps(id) ON DELETE CASCADE,
 *   user_id uuid REFERENCES users(id) ON DELETE CASCADE,
 *   subject text NOT NULL,
 *   body text,
 *   status text DEFAULT 'open',
 *   reply text,
 *   replied_by uuid REFERENCES users(id),
 *   created_at timestamptz DEFAULT now(),
 *   updated_at timestamptz DEFAULT now()
 * );
 */
export async function getBootcampHelpTickets(bootcampId) {
  await requireAdminOrBootcampMentor(bootcampId);
  const { data, error } = await supabaseAdmin
    .from('bootcamp_help_requests')
    .select('*, users(id, full_name, avatar_url)')
    .eq('bootcamp_id', bootcampId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function replyAndResolveHelpTicketAction(formData) {
  'use server';
  try {
    const bootcampId = formData.get('bootcamp_id');
    const mentorId = await requireAdminOrBootcampMentor(bootcampId);
    const ticketId = formData.get('ticket_id');
    const rawReply = formData.get('reply')?.trim() || null;
    const reply = rawReply ? cleanRichText(rawReply, 20000) : null;
    const status = formData.get('status') || 'resolved';

    const { error } = await supabaseAdmin
      .from('bootcamp_help_requests')
      .update({ reply, status, replied_by: mentorId, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
      .eq('bootcamp_id', bootcampId);

    if (error) throw new Error(error.message);
    revalidatePath(`/account/mentor/bootcamps/${bootcampId}`);
    return { success: 'Ticket updated' };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Member: submit a help request for a bootcamp.
 */
export async function submitHelpTicketAction(formData) {
  'use server';
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { error: 'Not authenticated' };

    const bootcampId = formData.get('bootcamp_id');
    const subject = cleanPlainText(formData.get('subject')?.trim(), 500);
    const body = cleanRichText(formData.get('body')?.trim() || '', 20000);

    if (!bootcampId || !subject) return { error: 'Subject is required' };

    // Only enrolled members can submit help tickets to a bootcamp.
    const { data: enr } = await supabaseAdmin
      .from('enrollments')
      .select('status')
      .eq('user_id', userId)
      .eq('bootcamp_id', bootcampId)
      .single();
    if (!enr || enr.status !== 'active') {
      return { error: 'You must be enrolled to submit a help ticket' };
    }

    const { error } = await supabaseAdmin
      .from('bootcamp_help_requests')
      .insert([{ bootcamp_id: bootcampId, user_id: userId, subject, body, status: 'open' }]);

    if (error) throw new Error(error.message);
    revalidatePath(`/account/member/bootcamps/${bootcampId}`);
    return { success: 'Help request submitted' };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Member: get own help tickets for a bootcamp.
 */
export async function getMemberHelpTickets(bootcampId) {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabaseAdmin
    .from('bootcamp_help_requests')
    .select('id, subject, body, status, reply, created_at')
    .eq('bootcamp_id', bootcampId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

/**
 * Member: get tasks assigned to a bootcamp they are enrolled in.
 */
export async function getMemberBootcampTasks(bootcampId) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  // Verify member is enrolled
  const { data: enr } = await supabaseAdmin
    .from('enrollments')
    .select('id')
    .eq('bootcamp_id', bootcampId)
    .eq('user_id', userId)
    .in('status', ['active', 'completed'])
    .maybeSingle();
  if (!enr) return [];

  const { data, error } = await supabaseAdmin
    .from('weekly_tasks')
    .select('id, title, description, difficulty, deadline, problem_links, task_type, points, created_at')
    .eq('bootcamp_id', bootcampId)
    .order('created_at', { ascending: false });
  if (error) return [];

  const tasks = data || [];
  if (tasks.length === 0) return [];

  // Attach this member's submission (if any) to each task
  const taskIds = tasks.map((t) => t.id);
  const { data: subs } = await supabaseAdmin
    .from('task_submissions')
    .select('id, task_id, submission_url, notes, attachments, status, feedback, points_earned, submitted_at, reviewed_by')
    .eq('user_id', userId)
    .in('task_id', taskIds);

  // Fetch reviewer profiles separately (avoids relying on a specific FK constraint alias)
  const reviewerIds = [...new Set((subs || []).map((s) => s.reviewed_by).filter(Boolean))];
  let reviewerMap = {};
  if (reviewerIds.length > 0) {
    const { data: reviewers } = await supabaseAdmin
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', reviewerIds);
    reviewerMap = Object.fromEntries((reviewers || []).map((u) => [u.id, u]));
  }

  const subMap = Object.fromEntries((subs || []).map((s) => [
    s.task_id,
    { ...s, reviewer: s.reviewed_by ? (reviewerMap[s.reviewed_by] || null) : null },
  ]));
  return tasks.map((t) => ({ ...t, mySubmission: subMap[t.id] || null }));
}

/**
 * Member: submit (or resubmit) a task.
 */
/**
 * Upload a file (image, pdf, doc, archive) as an attachment for a member's
 * task submission. Returns { url, name, size, type } on success.
 */
const MAX_TASK_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25 MB
export async function uploadTaskAttachmentAction(formData) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { error: 'Not authenticated' };

    const file = formData.get('file');
    if (!file || !(file instanceof File) || file.size === 0) {
      return { error: 'No file provided.' };
    }
    if (file.size > MAX_TASK_ATTACHMENT_SIZE) {
      return { error: `File exceeds ${MAX_TASK_ATTACHMENT_SIZE / (1024 * 1024)}MB limit.` };
    }

    const safeName = (file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const ext = safeName.includes('.') ? safeName.split('.').pop() : 'bin';
    const filename = `task_${userId}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { fileId } = await uploadToDrive(
      Buffer.from(arrayBuffer),
      filename,
      file.type || 'application/octet-stream',
      'task-submissions'
    );
    const url = `https://drive.google.com/file/d/${fileId}/view`;
    return { success: true, url, name: file.name || safeName, size: file.size, type: file.type || '' };
  } catch (err) {
    console.error('Task attachment upload error:', err);
    return { error: err.message || 'Failed to upload file.' };
  }
}

export async function submitTaskAction(formData) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { error: 'Not authenticated' };

    const taskId = formData.get('task_id');
    const rawUrl = formData.get('submission_url')?.trim() || null;
    // Submission URLs must be http/https; reject javascript:, data:, etc.
    let submissionUrl = null;
    if (rawUrl) {
      try {
        const u = new URL(rawUrl);
        if (u.protocol === 'http:' || u.protocol === 'https:') submissionUrl = rawUrl;
      } catch {}
    }
    const notes = cleanRichText(formData.get('notes')?.trim() || '', 10000) || null;
    const attachmentsRaw = formData.get('attachments');
    let attachments = null;
    if (attachmentsRaw) {
      try {
        const parsed = JSON.parse(attachmentsRaw);
        if (Array.isArray(parsed) && parsed.length > 0) attachments = cleanAttachments(parsed);
      } catch {}
    }

    if (!taskId) return { error: 'Missing task ID' };
    if (!submissionUrl && !notes && !attachments) return { error: 'Provide content or a file.' };

    // Check if already submitted
    const { data: existing } = await supabaseAdmin
      .from('task_submissions')
      .select('id, status')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Allow resubmit only if redo is required
      if (existing.status !== 'redo action required') {
        return { error: 'Already submitted. Resubmission is only allowed when mentor requests a redo.' };
      }
      const { data, error } = await supabaseAdmin
        .from('task_submissions')
        .update({ submission_url: submissionUrl, notes, attachments, status: 'pending', submitted_at: new Date().toISOString(), feedback: null })
        .eq('id', existing.id)
        .select('id, task_id, submission_url, notes, attachments, status, feedback, points_earned, submitted_at')
        .single();
      if (error) return { error: error.message };
      revalidatePath('/account/member/bootcamps');
      revalidatePath('/account/mentor/tasks');
      return { success: 'Resubmission sent!', data };
    }

    const { data, error } = await supabaseAdmin
      .from('task_submissions')
      .insert({ task_id: taskId, user_id: userId, submission_url: submissionUrl, notes, attachments, status: 'pending', submitted_at: new Date().toISOString() })
      .select('id, task_id, submission_url, notes, attachments, status, feedback, points_earned, submitted_at')
      .single();
    if (error) return { error: error.message };
    revalidatePath('/account/member/bootcamps');
    revalidatePath('/account/mentor/tasks');
    return { success: 'Task submitted!', data };
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

  const COLS = 'id, topic, description, session_date, scheduled_at, duration, attended, notes, status, meet_link, recording_url, target_type, target_student_ids, mentorship_id, bootcamp_id, created_by, attendance_data, location';

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
    if (s.target_type === 'selected-group') return (s.target_student_ids || []).includes(userId);
    if (s.target_type === 'one-on-one') return (s.target_student_ids || []).includes(userId);
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
      .select('id, mentor_id, users!mentorships_mentor_id_fkey(id, full_name, avatar_url)')
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
  const creatorIds = [...new Set(visibleBcSessions.map((s) => s.created_by).filter(Boolean))];
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
  const deduped = all.filter((s) => { if (seen.has(s.id)) return false; seen.add(s.id); return true; });
  deduped.sort((a, b) => new Date(b.session_date) - new Date(a.session_date));
  return deduped;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXAM SUBMISSION & ASSESSMENT ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Submit an exam answer (called by student).
 */
export async function submitExamSubmission(lessonId, _ignoredBootcampId, answers, score, status = 'submitted') {
  // bootcampId from caller is ignored — derived from lesson and verified.
  const { userId, bootcampId } = await requireLessonAccess(lessonId);

  // Sanitize any HTML the student may have pasted into answer fields.
  // Answers are stored as a JSON blob — walk it and clean strings.
  const cleanAnswers = (a) => {
    if (typeof a === 'string') return cleanRichText(a, 20000);
    if (Array.isArray(a)) return a.map(cleanAnswers);
    if (a && typeof a === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(a)) out[k] = cleanAnswers(v);
      return out;
    }
    return a;
  };

  const { data, error } = await supabaseAdmin
    .from('exam_submissions')
    .upsert({
      lesson_id: lessonId,
      user_id: userId,
      bootcamp_id: bootcampId,
      submitted_answers: cleanAnswers(answers),
      score: score,
      status: status,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'lesson_id,user_id'
    })
    .select()
    .single();

  if (error) {
    console.error('Error submitting exam:', error);
    throw error;
  }

  // Also mark the lesson as complete
  await markLessonComplete(lessonId, bootcampId);

  // For auto-graded MCQ exams (status='reviewed'), recalculate enrollment score
  // so that the exam points are immediately reflected in the member's dashboard.
  if (status === 'reviewed') {
    try {
      await supabaseAdmin.rpc('calculate_enrollment_progress', {
        p_user_id: userId,
        p_bootcamp_id: bootcampId,
      });
    } catch (rpcErr) {
      console.error('[submitExamSubmission] calculate_enrollment_progress RPC failed:', rpcErr);
    }
    revalidatePath('/account/member/bootcamps');
    revalidatePath(`/account/member/bootcamps/${bootcampId}`);
    revalidatePath('/account/mentor/tasks');
  } else {
    // CQ / hybrid pending_review — just bust member cache so latest submission shows
    revalidatePath(`/account/member/bootcamps/${bootcampId}`);
    revalidatePath('/account/mentor/tasks');
  }

  return data;
}

/**
 * Get an exam submission (called by student or mentor).
 */
export async function getExamSubmission(lessonId, studentUserId = null) {
  let userId = studentUserId;
  if (!userId) {
    userId = await getCurrentUserId();
  }
  if (!userId) return null;

  const { data, error } = await supabaseAdmin
    .from('exam_submissions')
    .select('*')
    .eq('lesson_id', lessonId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching exam submission:', error);
    return null;
  }
  return data;
}

/**
 * Get all exam submissions for mentor grading.
 * Dual-path: primary by bootcamp_id column, fallback via lesson IDs of the bootcamp.
 */
export async function getExamSubmissionsForMentor(bootcampId) {
  await requireAdminOrBootcampMentor(bootcampId);

  const SELECT_FRAGMENT = `
    *,
    users!user_id (
      id,
      full_name,
      email,
      avatar_url,
      member_profiles!user_id (
        student_id,
        academic_session
      )
    ),
    lessons (
      id,
      title,
      exam_type,
      exam_questions,
      description,
      content
    )
  `;

  // ── Primary path: filter by bootcamp_id ───────────────────────────────────
  const { data: byBootcamp, error: err1 } = await supabaseAdmin
    .from('exam_submissions')
    .select(SELECT_FRAGMENT)
    .eq('bootcamp_id', bootcampId)
    .order('created_at', { ascending: false });

  if (!err1 && Array.isArray(byBootcamp) && byBootcamp.length > 0) {
    console.log(`[getExamSubmissionsForMentor] bootcamp_id path: ${byBootcamp.length} rows for ${bootcampId}`);
    return byBootcamp;
  }

  if (err1) {
    console.warn('[getExamSubmissionsForMentor] bootcamp_id query failed:', err1.message, '— trying lesson-id fallback');
  } else {
    console.log(`[getExamSubmissionsForMentor] bootcamp_id returned 0 rows for ${bootcampId}, trying lesson-id fallback`);
  }

  // ── Fallback path: collect lesson IDs belonging to this bootcamp ──────────
  const { data: lessonRows, error: lessonsErr } = await supabaseAdmin
    .from('lessons')
    .select('id, modules!inner(courses!inner(bootcamp_id))')
    .eq('modules.courses.bootcamp_id', bootcampId);

  if (lessonsErr || !lessonRows?.length) {
    console.warn('[getExamSubmissionsForMentor] lesson fallback found no lessons for bootcamp', bootcampId);
    return [];
  }

  const lessonIds = lessonRows.map(l => l.id);

  const { data: byLesson, error: err2 } = await supabaseAdmin
    .from('exam_submissions')
    .select(SELECT_FRAGMENT)
    .in('lesson_id', lessonIds)
    .order('created_at', { ascending: false });

  if (err2) {
    console.error('[getExamSubmissionsForMentor] lesson-id fallback failed:', err2.message);
    throw new Error(err2.message);
  }

  console.log(`[getExamSubmissionsForMentor] lesson-id path: ${byLesson?.length ?? 0} rows for bootcamp ${bootcampId}`);
  return byLesson ?? [];
}

/**
 * Review/assess a CQ exam submission.
 */
export async function reviewExamSubmission(submissionId, score, feedback, status) {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');

  const { data: mentor } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single();
  if (!mentor) throw new Error('Mentor not found');

  // Verify mentor is authorized for this bootcamp
  // Also fetch submitted_answers (for mcq_score) and exam_type (to detect hybrid)
  const { data: subCheck } = await supabaseAdmin
    .from('exam_submissions')
    .select('bootcamp_id, submitted_answers, lessons!inner(exam_type)')
    .eq('id', submissionId)
    .single();

  if (!subCheck) throw new Error('Submission not found');
  await requireAdminOrBootcampMentor(subCheck.bootcamp_id);

  // For hybrid exams: total score = MCQ auto-grade + CQ mentor score
  // The mentor's input (score) is the CQ portion only
  const isHybrid = subCheck.lessons?.exam_type === 'hybrid';
  const storedMcqScore = subCheck.submitted_answers?.mcq_score || 0;
  const finalScore = isHybrid && storedMcqScore > 0 ? storedMcqScore + score : score;

  const { data, error } = await supabaseAdmin
    .from('exam_submissions')
    .update({
      score: finalScore,
      mentor_feedback: cleanRichText(feedback, 20000),
      status: status,
      graded_by: mentor.id,
      graded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) {
    console.error('Error reviewing exam submission:', error);
    throw error;
  }

  // Trigger recalculation of enrollment progress and score
  try {
    await supabaseAdmin.rpc('calculate_enrollment_progress', {
      p_user_id: data.user_id,
      p_bootcamp_id: subCheck.bootcamp_id,
    });
  } catch (rpcErr) {
    console.error('Error executing calculate_enrollment_progress RPC on grading:', rpcErr);
  }

  // Invalidate member and mentor page caches so the updated score is immediately visible
  revalidatePath('/account/member/bootcamps');
  revalidatePath(`/account/member/bootcamps/${subCheck.bootcamp_id}`);
  revalidatePath('/account/mentor/tasks');
  revalidatePath('/account/admin/bootcamps');

  return data;
}

/**
 * Robust JSON parser for AI outputs.
 * Strategy (in order):
 *   1. Strip markdown code-fence wrappers
 *   2. Extract the outermost [...] via bracket-balanced scan
 *   3. Standard JSON.parse on the extracted slice
 *   4. Sanitise raw control chars inside strings (char-by-char), then retry
 *   5. Bracket-balanced per-object extractor (handles nested arrays e.g. options:[...])
 *   6. Strip trailing commas then retry
 */
function robustJsonParse(raw) {
  // Step 1: strip markdown fences
  let s = raw.trim();
  // Remove leading ```lang and trailing ```
  s = s.replace(/^```[a-zA-Z]*/, '').replace(/```\s*$/, '').trim();

  // Step 2: bracket-balanced outermost [...] extraction
  function extractOutermostArray(text) {
    const start = text.indexOf('[');
    if (start === -1) return null;
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (esc)               { esc = false; continue; }
      if (ch === '\\' && inStr) { esc = true; continue; }
      if (ch === '"')        { inStr = !inStr; continue; }
      if (inStr)             continue;
      if (ch === '[')        depth++;
      else if (ch === ']')   { depth--; if (depth === 0) return text.slice(start, i + 1); }
    }
    return depth > 0 ? text.slice(start) + ']' : null;
  }

  // Step 3: try standard parse
  const arraySlice = extractOutermostArray(s) || s;
  try { return JSON.parse(arraySlice); }
  catch (e) { console.warn('[robustJsonParse] pass-1 failed:', e.message); }

  // Step 4: sanitise raw control chars inside JSON strings using char-by-char walk
  function sanitise(text) {
    let out = '', inStr = false, esc = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (esc)                 { out += ch; esc = false; continue; }
      if (ch === '\\' && inStr) { out += ch; esc = true; continue; }
      if (ch === '"')          { inStr = !inStr; out += ch; continue; }
      if (inStr) {
        if (ch === '\n') { out += '\\n'; continue; }
        if (ch === '\r') { out += '\\r'; continue; }
        if (ch === '\t') { out += '\\t'; continue; }
      }
      out += ch;
    }
    return out;
  }

  try { return JSON.parse(sanitise(arraySlice)); }
  catch (e) { console.warn('[robustJsonParse] pass-2 (sanitised) failed:', e.message); }

  // Step 5: bracket-balanced per-object extraction (correctly handles nested arrays)
  function extractObjects(text) {
    const items = [];
    let i = 0;
    while (i < text.length) {
      if (text[i] !== '{') { i++; continue; }
      let depth = 0, inStr = false, esc = false;
      const start = i;
      for (; i < text.length; i++) {
        const ch = text[i];
        if (esc)                 { esc = false; continue; }
        if (ch === '\\' && inStr) { esc = true; continue; }
        if (ch === '"')          { inStr = !inStr; continue; }
        if (inStr)               continue;
        if (ch === '{')          depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            try {
              const obj = JSON.parse(sanitise(text.slice(start, i + 1)));
              if (obj && typeof obj === 'object') items.push(obj);
            } catch {}
            i++; break;
          }
        }
      }
    }
    return items;
  }

  const objects = extractObjects(arraySlice);
  if (objects.length > 0) {
    console.log('[robustJsonParse] pass-3: extracted ' + objects.length + ' objects via bracket balancing');
    return objects;
  }

  // Step 6: strip trailing commas then retry
  try {
    const fixed = sanitise(arraySlice).replace(/,\s*([\]}])/g, '$1');
    return JSON.parse(fixed);
  } catch (e) { console.warn('[robustJsonParse] pass-4 (trailing-comma) failed:', e.message); }

  throw new Error('AI returned an unparseable response. Try with shorter or simpler input, or rephrase your questions.');
}



/**
 * Shared AI call helper — supports Gemini (POST) and Pollinations (POST fallback).
 * Automatically retries once with a reduced token limit if the first call fails.
 */
async function callAI(systemPrompt, userText, { maxTokens = 8192, temperature = 0.2, jsonMode = true } = {}) {
  const hasGemini = !!process.env.GEMINI_API_KEY;

  async function tryGemini(tokens) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const body = {
      contents: [{ parts: [{ text: `${systemPrompt}\n\n---\nRAW INPUT:\n${userText}` }] }],
      generationConfig: {
        maxOutputTokens: tokens,
        temperature,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Gemini API error ${res.status}: ${errBody.slice(0, 200)}`);
    }
    const data = await res.json();
    // Gemini can return multiple candidates/parts — join all text parts
    return data?.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';
  }

  async function tryPollinations(tokens) {
    // Use POST to avoid 8KB URL limit
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userText },
        ],
        model: 'openai',
        max_tokens: Math.min(tokens, 4000),
        temperature,
        jsonMode: jsonMode,
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Pollinations API error ${res.status}: ${errBody.slice(0, 200)}`);
    }
    const data = await res.json().catch(() => null);
    // Pollinations returns OpenAI-compatible shape
    return data?.choices?.[0]?.message?.content ?? await res.text().catch(() => '');
  }

  const caller = hasGemini ? tryGemini : tryPollinations;

  // First attempt
  try {
    const text = await caller(maxTokens);
    if (text && text.trim().length > 2) return text;
    throw new Error('Empty response from AI');
  } catch (firstErr) {
    console.warn('[callAI] first attempt failed, retrying with smaller token limit:', firstErr.message);
  }

  // Retry with smaller limit
  const text = await caller(Math.min(maxTokens, 4096));
  if (!text || text.trim().length < 2) throw new Error('AI returned empty response on retry');
  return text;
}

/**
 * Pre-processes raw admin input before sending to AI.
 * Normalises whitespace, removes invisible chars, and strips BOM.
 */
function preprocessRawInput(raw) {
  return raw
    .replace(/^\uFEFF/, '')                    // strip BOM
    .replace(/\u00A0/g, ' ')                   // nbsp → space
    .replace(/[\u200B-\u200D\uFEFF]/g, '')     // zero-width chars
    .replace(/\r\n/g, '\n')                    // normalise line endings
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ')                      // tabs → 2 spaces
    .replace(/[ \t]+$/gm, '')                  // trailing whitespace per line
    .replace(/\n{4,}/g, '\n\n\n')              // max 3 consecutive blank lines
    .trim();
}

/**
 * Converts a correct-option value to a 0-based integer index.
 * Handles: 0-3 (number), "0"-"3" (string number), "A"-"D" (letter), "a"-"d".
 */
function normaliseCorrectOption(raw, fallback = 0) {
  if (typeof raw === 'number' && raw >= 0 && raw <= 3) return raw;
  if (typeof raw === 'string') {
    const upper = raw.trim().toUpperCase();
    const letterMap = { A: 0, B: 1, C: 2, D: 3 };
    if (upper in letterMap) return letterMap[upper];
    const n = parseInt(upper, 10);
    if (!isNaN(n) && n >= 0 && n <= 3) return n;
  }
  return fallback;
}

/**
 * Pads or trims an options array to exactly 4 entries.
 */
function normaliseOptions(opts) {
  const labels = ['Option A', 'Option B', 'Option C', 'Option D'];
  if (!Array.isArray(opts)) return labels;
  const trimmed = opts.slice(0, 4).map((o, i) => (typeof o === 'string' && o.trim()) ? o.trim() : labels[i]);
  while (trimmed.length < 4) trimmed.push(labels[trimmed.length]);
  return trimmed;
}

/**
 * AI server action to parse raw unstructured text into structured MCQ questions.
 * Handles: numbered/lettered options, Bengali text, embedded code/math, 2-3 option questions,
 * "Ans: B" answer markers, missing answers (defaults to 0), mixed whitespace, and more.
 */
export async function generateExamQuestionsAction(rawText, guidelines = '', difficulty = 'medium') {
  await requireAdmin();

  if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 5) {
    return { error: 'Please provide some exam text to parse.' };
  }

  const input = preprocessRawInput(rawText);

  const systemPrompt = `You are an expert exam content parser and developer. Convert the raw input into a JSON array of MCQ objects.

ADDITIONAL PARAMETERS:
- Target Difficulty: ${difficulty} (Ensure questions, coding logic, and conceptual depth reflect this level)
- Custom/Formatting Guidelines: ${guidelines || 'None specified'}

RULES:
1. Each object must have exactly these keys:
   - "id": unique string like "q-1", "q-2"
   - "question": A highly clear, professional, and beautiful problem description.
     - You MUST format any programming code inside markdown code blocks (e.g. \`\`\`javascript ... \`\`\`).
     - You MUST format any mathematical formulas or equations beautifully using standard Markdown/LaTeX (e.g., $E = mc^2$ or $$ ... $$).
     - Make descriptions rich, structured, and realistic (with scenarios, input/output structures, logic challenges, etc. where appropriate) instead of a simple single-line.
     - No limit on the length or complexity of the descriptions.
   - "options": array of EXACTLY 4 strings. If the source has fewer, generate plausible distractors. Strip leading "A." / "1." prefixes from option text.
   - "correct_option": integer 0-3 (0=A, 1=B, 2=C, 3=D). Parse "Ans: B", "Answer: C", "*B*", "(B)" etc. Default 0 if not found.
   - "points": integer, default 5

2. If the user input is a brief topic or prompt, dynamically expand it to generate highly detailed, professional, and clear MCQ questions with complete multi-line problem descriptions.
3. Do NOT include any text outside the JSON array.
4. Do NOT wrap in markdown code fences.
5. Escape all newlines inside string values as \\n.
6. If text has multiple questions, return ALL of them as separate objects.
7. If a question has more than 4 options keep the first 4.

OUTPUT FORMAT (return exactly this, no prose):
[{"id":"q-1","question":"...","options":["...","...","...","..."],"correct_option":0,"points":5}]`;

  try {
    const generatedText = await callAI(systemPrompt, input, { maxTokens: 8192, temperature: 0.15, jsonMode: true });
    const parsed = robustJsonParse(generatedText);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('AI did not return a valid array of questions. Check your input format.');
    }

    const normalized = parsed.map((q, idx) => ({
      id: crypto.randomUUID(),
      question: typeof q.question === 'string' && q.question.trim() ? q.question.trim() : 'Untitled Question',
      options: normaliseOptions(q.options),
      correct_option: normaliseCorrectOption(q.correct_option, 0),
      points: typeof q.points === 'number' && q.points > 0 ? Math.round(q.points) : 5,
    }));

    return { success: true, questions: normalized };
  } catch (err) {
    console.error('[generateExamQuestionsAction] error:', err);
    return { error: err.message || 'Failed to parse exam text into MCQ questions.' };
  }
}

/**
 * AI server action to parse raw practice problem data into structured problems.
 * Handles: problem links, editorials, solution code, YouTube links, star ratings, difficulty.
 */
export async function generatePracticeProblemsAction(rawText, guidelines = '', difficulty = 'medium') {
  await requireAdmin();

  if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 5) {
    return { error: 'Please provide some practice problems text to parse.' };
  }

  const input = preprocessRawInput(rawText);

  const systemPrompt = `You are an expert competitive programming content parser and developer. Convert raw input into a JSON array of practice problem objects.

ADDITIONAL PARAMETERS:
- Target Difficulty: ${difficulty} (Ensure the explanation complexity and editorial depth reflect this level)
- Custom/Formatting Guidelines: ${guidelines || 'None specified'}

RULES:
1. Each object must have exactly these keys:
   - "id": unique string like "p-1", "p-2"
   - "name": problem name (e.g. "Watermelon", "Two Sum", "A+B Problem")
   - "source": platform name (e.g. "Codeforces", "LeetCode", "VJudge", "AtCoder", "HackerRank")
   - "url": direct problem URL (http/https). Empty string if not found.
   - "video_url": YouTube/solution video URL. Empty string if not found.
   - "editorial": A highly clear, professional, and beautiful explanation in markdown. Ensure any formulas are in LaTeX/Markdown and formatting is completely clean. Use \\n for newlines.
   - "solution_code": clean and beautifully structured solution code (C++/Python/Java). Use \\n for newlines inside code. Empty string if not found.

2. Detect platform from URL patterns:
   - codeforces.com → "Codeforces"
   - leetcode.com → "LeetCode"
   - vjudge.net → "VJudge"
   - atcoder.jp → "AtCoder"
   - spoj.com → "SPOJ"
   - youtube.com / youtu.be → put in video_url, NOT url

3. Do NOT include any text outside the JSON array.
4. Do NOT wrap in markdown code fences.
5. Escape all newlines inside string values as \\n.
6. Parse ALL problems from the input — do not skip any.

OUTPUT FORMAT (return exactly this, no prose):
[{"id":"p-1","name":"Watermelon","source":"Codeforces","url":"https://...","video_url":"","editorial":"","solution_code":""}]`;

  try {
    const generatedText = await callAI(systemPrompt, input, { maxTokens: 8192, temperature: 0.15, jsonMode: true });
    const parsed = robustJsonParse(generatedText);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('AI did not return a valid array of problems. Check your input format.');
    }

    const normalized = parsed.map((p) => ({
      id: crypto.randomUUID(),
      name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : 'Untitled Problem',
      source: typeof p.source === 'string' && p.source.trim() ? p.source.trim() : 'Unknown',
      url: typeof p.url === 'string' ? p.url.trim() : '',
      video_url: typeof p.video_url === 'string' ? p.video_url.trim() : '',
      editorial: typeof p.editorial === 'string' ? p.editorial : '',
      solution_code: typeof p.solution_code === 'string' ? p.solution_code : '',
    }));

    return { success: true, problems: normalized };
  } catch (err) {
    console.error('[generatePracticeProblemsAction] error:', err);
    return { error: err.message || 'Failed to parse practice problems text.' };
  }
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
    .select(`
      user_id,
      score,
      progress_percent,
      enrolled_at,
      users (id, full_name, avatar_url)
    `)
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
export async function getBootcampsLeaderboardAction({ bootcampId = 'all', timeframe = 'all' } = {}) {
  try {
    await requireAnyRole(['member', 'mentor', 'admin', 'executive']);

    // 1. Fetch active or completed enrollments
    let query = supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        user_id,
        bootcamp_id,
        score,
        progress_percent,
        enrolled_at,
        users:user_id (id, full_name, avatar_url),
        bootcamps:bootcamp_id (id, title, status)
      `)
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
    const bootcampIds = [...new Set(activeEnrollments.map((e) => e.bootcamp_id))];

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
      .select(`
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
      `)
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
      .select('user_id, bootcamp_id, lesson_id, is_completed, watch_time, solved_problems, completed_at')
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
      .select(`
        user_id,
        points_earned,
        submitted_at,
        weekly_tasks!inner (bootcamp_id)
      `)
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
      sessionsQuery = sessionsQuery.gte('session_date', startDate.toISOString());
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;
    if (sessionsError) throw sessionsError;

    // 6. Aggregate data per user
    const statsMap = {};

    userIds.forEach((uid) => {
      const userEnrollments = activeEnrollments.filter((e) => e.user_id === uid);
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
        allTimeScore: userEnrollments.reduce((sum, e) => sum + (e.score || 0), 0),
        allTimeProgressPercent: Math.round(
          userEnrollments.reduce((sum, e) => sum + (e.progress_percent || 0), 0) / userEnrollments.length
        ),
      };
    });

    // Aggregate user progress (lessons completed, solved problems, watch time)
    progressList?.forEach((p) => {
      const stats = statsMap[p.user_id];
      if (!stats) return;

      const isCompleted = p.is_completed;
      const isCompletedInTimeframe = !startDate || (p.completed_at && new Date(p.completed_at) >= startDate);

      if (isCompleted && isCompletedInTimeframe) {
        stats.lessonsCompleted += 1;
      }

      stats.watchTime += p.watch_time || 0;

      if (Array.isArray(p.solved_problems)) {
        if (!startDate || (p.completed_at && new Date(p.completed_at) >= startDate)) {
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
              stats.score += Math.floor((solvedPracticePts / totalPracticePts) * lessonInfo.points);
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
    return { success: false, error: error.message || 'Failed to fetch leaderboard' };
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
  const [curriculumResult, progressResult, taskSubsResult, examSubsResult, sessionsResult] = await Promise.all([
    supabaseAdmin
      .from('bootcamps')
      .select(`
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
      `)
      .eq('id', bootcampId)
      .single(),

    supabaseAdmin
      .from('user_progress')
      .select('lesson_id, is_completed, completed_at, watch_time, last_position, solved_problems')
      .eq('bootcamp_id', bootcampId)
      .eq('user_id', userId),

    supabaseAdmin
      .from('task_submissions')
      .select(`
        id, status, points_earned, submitted_at, feedback,
        weekly_tasks!inner (id, title, bootcamp_id, deadline)
      `)
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
  progressRows.forEach((p) => { progressMap[p.lesson_id] = p; });

  // 3. Build exam submission map by lesson_id
  const examMap = {};
  examSubs.forEach((e) => { examMap[e.lesson_id] = e; });

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
                let totalPts = 0, solvedPts = 0;
                problems.forEach((prob, idx) => {
                  const p = Number(prob?.points) || 5;
                  totalPts += p;
                  if (solved.includes(idx)) solvedPts += p;
                });
                if (totalPts > 0) lessonScore += Math.floor((solvedPts / totalPts) * pts);
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
  const allLessons = curriculum?.courses?.flatMap((c) =>
    c.modules?.flatMap((m) => m.lessons || []) || []
  ) || [];
  const lessonsCompleted = allLessons.filter((l) => l.progress?.is_completed).length;
  const totalWatchTime = progressRows.reduce((sum, p) => sum + (p.watch_time || 0), 0);
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

/**
 * Get aggregated bootcamp analytics and performance overview for the Faculty Advisor.
 * Access: advisor, admin, or executive.
 */
export async function getAdvisorBootcampAnalytics() {
  await requireAnyRole(['admin', 'executive', 'advisor']);

  // Fetch all bootcamps with basic creator info
  const { data: bootcamps, error: bootcampsError } = await supabaseAdmin
    .from('bootcamps')
    .select(`
      id, title, slug, status, price, batch_info, category, difficulty, start_date, end_date, total_lessons, is_featured, created_at,
      users:created_by (id, full_name, avatar_url)
    `)
    .order('created_at', { ascending: false });

  if (bootcampsError) {
    throw new Error(bootcampsError.message || 'Failed to fetch bootcamps for advisor');
  }

  const bootcampIds = bootcamps?.map((b) => b.id) || [];
  
  let enrollments = [];
  let userProgress = [];
  let mentors = [];
  let sessionsByMentor = {};
  let menteesByMentor = {};

  if (bootcampIds.length > 0) {
    const [enrollmentsRes, progressRes, mentorsRes, mentorshipsRes] = await Promise.all([
      supabaseAdmin
        .from('enrollments')
        .select('id, user_id, bootcamp_id, status, enrolled_at, users:user_id (id, full_name, avatar_url)')
        .in('bootcamp_id', bootcampIds),
      supabaseAdmin
        .from('user_progress')
        .select('user_id, bootcamp_id, is_completed')
        .in('bootcamp_id', bootcampIds)
        .eq('is_completed', true),
      supabaseAdmin
        .from('bootcamp_mentors')
        .select('bootcamp_id, assigned_at, users:user_id (id, full_name, avatar_url, email)')
        .in('bootcamp_id', bootcampIds),
      // fetch mentorship session counts per mentor
      supabaseAdmin
        .from('mentorships')
        .select('id, mentor_id, mentee_id'),
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
    const completed = bEnrollments.filter((e) => e.status === 'completed').length;
    const pending = bEnrollments.filter((e) => e.status === 'pending').length;
    const cancelled = bEnrollments.filter((e) => e.status === 'cancelled').length;

    const revenue = (active + completed) * (b.price || 0);
    totalRevenue += revenue;
    totalActiveCompletedEnrollments += (active + completed);

    const bProgress = progressByBootcampAndUser[b.id] || {};
    const totalLessons = b.total_lessons || 0;
    
    let graduatedCount = 0;
    let totalProgressSum = 0;
    const enrolledUsers = bEnrollments.filter((e) => e.status === 'active' || e.status === 'completed');
    
    enrolledUsers.forEach((e) => {
      const completedCount = bProgress[e.user_id] || 0;
      const progressPercent = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;
      totalProgressSum += progressPercent;
      if (totalLessons > 0 && completedCount / totalLessons >= 0.8) {
        graduatedCount += 1;
      }
    });

    totalGraduatesSum += graduatedCount;

    const avgProgress = enrolledUsers.length > 0 ? totalProgressSum / enrolledUsers.length : 0;
    const completionRate = enrolledUsers.length > 0 ? (graduatedCount / enrolledUsers.length) * 100 : 0;

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
  const archivedTracks = bootcamps.filter((b) => b.status === 'archived').length;
  const totalEnrolled = enrollments.filter((e) => e.status === 'active' || e.status === 'completed').length;

  const avgCompletionRate = totalActiveCompletedEnrollments > 0 
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
    .select(`
      id, status, enrolled_at,
      users:user_id (id, full_name, email, avatar_url)
    `)
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
    const progressPercent = totalLessons > 0 ? (lessonsCompleted / totalLessons) * 100 : 0;

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
  students.sort((a, b) => b.progressPercent - a.progressPercent || a.fullName.localeCompare(b.fullName));

  return students;
}
