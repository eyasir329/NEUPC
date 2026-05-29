'use server';

/**
 * @file Bootcamp uploads server actions (split from bootcamp-actions).
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
  requireAdmin,
  requireAdminOrMentor,
} from './_helpers';

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
