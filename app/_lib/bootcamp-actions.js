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

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if current user is admin.
 */
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single();

  if (!user) throw new Error('User not found');

  const { data: roles } = await supabaseAdmin
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);

  const isAdmin = roles?.some((r) => r.roles?.name === 'admin');
  if (!isAdmin) throw new Error('Admin access required');

  return user.id;
}

/**
 * Check if current user is admin or any mentor.
 */
async function requireAdminOrMentor() {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');
  const { data: user } = await supabaseAdmin.from('users').select('id').eq('email', session.user.email).single();
  if (!user) throw new Error('User not found');
  const { data: roles } = await supabaseAdmin.from('user_roles').select('roles(name)').eq('user_id', user.id);
  const hasAccess = roles?.some((r) => r.roles?.name === 'admin' || r.roles?.name === 'mentor');
  if (!hasAccess) throw new Error('Access denied');
  return user.id;
}

/**
 * Check if current user is admin or a mentor assigned to this specific bootcamp.
 */
async function requireAdminOrBootcampMentor(bootcampId) {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');
  const { data: user } = await supabaseAdmin.from('users').select('id').eq('email', session.user.email).single();
  if (!user) throw new Error('User not found');
  const { data: roles } = await supabaseAdmin.from('user_roles').select('roles(name)').eq('user_id', user.id);
  if (roles?.some((r) => r.roles?.name === 'admin')) return user.id;
  if (bootcampId) {
    const { data: mentorRow } = await supabaseAdmin.from('bootcamp_mentors').select('id').eq('bootcamp_id', bootcampId).eq('user_id', user.id).single();
    if (mentorRow) return user.id;
  }
  throw new Error('Access denied');
}

/**
 * Get current user ID.
 */
async function getCurrentUserId() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single();

  return user?.id || null;
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
            is_free_preview, is_published, is_locked
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
      const isAdmin = roles?.some((r) => r.roles?.name === 'admin');
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
            is_free_preview, is_published, is_locked
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
      isAdmin = roles?.some((r) => r.roles?.name === 'admin');
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
    title,
    slug,
    description: formData.get('description') || null,
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
    } else if (field === 'description' || field === 'batch_info' || field === 'thumbnail' || field === 'subtitle' || field === 'category' || field === 'difficulty') {
      updates[field] = value === '' ? null : value;
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
  revalidatePath(`/account/admin/bootcamps/${id}`);
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
      title: data.title?.trim() || 'Untitled Course',
      description: data.description || null,
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
      title: data.title?.trim(),
      description: data.description,
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
      title: data.title?.trim() || 'Untitled Module',
      description: data.description || null,
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
      title: data.title?.trim(),
      description: data.description,
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
      title: data.title?.trim() || 'Untitled Lesson',
      description: data.description || null,
      content: data.content || null,
      video_source: data.video_source || 'none',
      video_id: videoId,
      video_url: data.video_url || null,
      duration: parseInt(duration) || 0,
      order_index: orderIndex,
      is_free_preview: data.is_free_preview === true,
      is_published: data.is_published !== false,
      is_locked: data.is_locked === true,
      attachments: data.attachments || [],
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
    title: data.title?.trim(),
    description: data.description,
    content: data.content,
    video_source: data.video_source,
    video_id: 'video_id' in data ? videoId : undefined,
    video_url: data.video_url,
    duration: duration !== undefined ? parseInt(duration) || 0 : undefined,
    is_free_preview: data.is_free_preview,
    is_published: data.is_published,
    is_locked: data.is_locked,
    attachments: data.attachments,
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
      'id, title, description, video_source, video_id, video_url, duration, content, attachments, is_published, order_index'
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
    .select('id, content, attachments, video_url')
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
    .in('status', ['active', 'completed'])
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
    .select('id, status, progress_percent')
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
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  // Get bootcamp_id from lesson
  const { data: lesson } = await supabaseAdmin
    .from('lessons')
    .select('module_id, modules(course_id, courses(bootcamp_id))')
    .eq('id', lessonId)
    .single();

  if (!lesson?.modules?.courses?.bootcamp_id) {
    throw new Error('Lesson not found');
  }

  const bootcampId = lesson.modules.courses.bootcamp_id;

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
export async function touchLessonAccess(lessonId, bootcampId) {
  const userId = await getCurrentUserId();
  if (!userId) return null;

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

  // First time opening this lesson — create a stub row
  if (!bootcampId) {
    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('module_id, modules(course_id, courses(bootcamp_id))')
      .eq('id', lessonId)
      .single();
    bootcampId = lesson?.modules?.courses?.bootcamp_id;
  }
  if (!bootcampId) return null;

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
export async function updateWatchTimeDelta(lessonId, deltaSeconds, lastPosition, bootcampId) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const delta = Math.max(0, Math.floor(Number(deltaSeconds) || 0));
  const posKnown = lastPosition != null && Number.isFinite(Number(lastPosition));
  const pos = posKnown ? Math.max(0, Math.floor(Number(lastPosition))) : null;
  if (delta === 0 && !posKnown) return null;

  // Resolve bootcampId from DB only if not provided by caller
  if (!bootcampId) {
    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('module_id, modules(course_id, courses(bootcamp_id))')
      .eq('id', lessonId)
      .single();
    if (!lesson?.modules?.courses?.bootcamp_id) throw new Error('Lesson not found');
    bootcampId = lesson.modules.courses.bootcamp_id;
  }

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
export async function markLessonComplete(lessonId, bootcampId) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  if (!bootcampId) {
    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('module_id, modules(course_id, courses(bootcamp_id))')
      .eq('id', lessonId)
      .single();
    if (!lesson?.modules?.courses?.bootcamp_id) throw new Error('Lesson not found');
    bootcampId = lesson.modules.courses.bootcamp_id;
  }

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
export async function markLessonIncomplete(lessonId, bootcampId) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  if (!bootcampId) {
    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('module_id, modules(course_id, courses(bootcamp_id))')
      .eq('id', lessonId)
      .single();
    if (!lesson?.modules?.courses?.bootcamp_id) throw new Error('Lesson not found');
    bootcampId = lesson.modules.courses.bootcamp_id;
  }

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
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  // Get bootcamp_id
  const { data: lesson } = await supabaseAdmin
    .from('lessons')
    .select('module_id, modules(course_id, courses(bootcamp_id))')
    .eq('id', lessonId)
    .single();

  if (!lesson?.modules?.courses?.bootcamp_id) {
    throw new Error('Lesson not found');
  }

  const { data, error } = await supabaseAdmin
    .from('user_progress')
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        bootcamp_id: lesson.modules.courses.bootcamp_id,
        notes,
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
  await requireAdmin();

  // Get bootcamp total lessons count
  const { data: bootcamp } = await supabaseAdmin
    .from('bootcamps')
    .select('total_lessons')
    .eq('id', bootcampId)
    .single();

  const totalLessons = bootcamp?.total_lessons || 0;

  // Get enrollments
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

  // Get progress counts for each user
  const userIds = enrollments.map((e) => e.user_id);

  if (userIds.length === 0) {
    return { enrollments: [], totalLessons };
  }

  // Get completed lessons per user
  const { data: progressData } = await supabaseAdmin
    .from('user_progress')
    .select('user_id, is_completed')
    .eq('bootcamp_id', bootcampId)
    .eq('is_completed', true)
    .in('user_id', userIds);

  // Count completed lessons per user
  const completedMap = {};
  progressData?.forEach((p) => {
    completedMap[p.user_id] = (completedMap[p.user_id] || 0) + 1;
  });

  // Merge progress into enrollments
  const enrichedEnrollments = enrollments.map((enrollment) => ({
    ...enrollment,
    completed_lessons: completedMap[enrollment.user_id] || 0,
    progress_percent:
      totalLessons > 0
        ? Math.round(
            ((completedMap[enrollment.user_id] || 0) / totalLessons) * 100
          )
        : 0,
  }));

  return { enrollments: enrichedEnrollments, totalLessons };
}

/**
 * Get a specific student's lesson-level progress for a bootcamp (admin).
 */
export async function adminGetStudentProgress(bootcampId, userId) {
  await requireAdmin();

  const [{ data: curriculum }, { data: progressRows }] = await Promise.all([
    supabaseAdmin
      .from('bootcamps')
      .select(`
        title,
        courses (
          id, title, order_index,
          modules (
            id, title, order_index,
            lessons (id, title, order_index, duration, is_published, video_source, video_id)
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
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single();
  if (!user) throw new Error('User not found');

  const { data, error } = await supabaseAdmin
    .from('bootcamp_mentors')
    .select('assigned_at, bootcamps(id, title, slug, description, thumbnail, status, batch_info, start_date, end_date, total_lessons, total_duration, is_featured)')
    .eq('user_id', user.id)
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
            duration, order_index, is_free_preview, is_published, is_locked, attachments
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
  revalidatePath(`/account/admin/bootcamps/${bootcampId}`);

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
    const title = formData.get('title')?.trim();
    const description = formData.get('description')?.trim() || null;
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
    const title = formData.get('title')?.trim();
    const description = formData.get('description')?.trim() || null;
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
    const topic = formData.get('topic')?.trim();
    const session_date = formData.get('session_date');
    const duration = parseInt(formData.get('duration') || '60') || null;
    const notes = formData.get('notes')?.trim() || null;

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
    const notes = formData.get('notes')?.trim() || null;
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
    const notes = formData.get('notes')?.trim() || '';

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
    const reply = formData.get('reply')?.trim() || null;
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
    const subject = formData.get('subject')?.trim();
    const body = formData.get('body')?.trim();

    if (!bootcampId || !subject) return { error: 'Subject is required' };

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
    .select('id, title, description, difficulty, deadline, problem_links, created_at')
    .eq('bootcamp_id', bootcampId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
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

  const COLS = 'id, topic, description, session_date, scheduled_at, duration, attended, notes, status, meet_link, recording_url, target_type, target_student_ids, mentorship_id, bootcamp_id, created_by';

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
