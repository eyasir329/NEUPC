/**
 * @file Server-side avatar upload helper.
 * NOT a server action — deliberately lives outside any 'use server'
 * module so it is never exposed as a client-callable endpoint
 * (it fetches arbitrary URLs and writes to any userId).
 *
 * @module avatar-upload
 */

import { uploadToDrive } from '@/app/_lib/integrations/gdrive';

/**
 * Upload an avatar from a URL (used internally during sign-in).
 *
 * @param {string} imageUrl – external image URL (e.g. Google profile pic)
 * @param {string} userId   – database user ID
 * @returns {Promise<string|null>} proxy URL or null on failure
 */
export async function uploadAvatarFromUrl(imageUrl, userId) {
  try {
    const res = await fetch(imageUrl, {
      headers: {
        Accept: 'image/*',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      redirect: 'follow',
    });

    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0) return null;

    const ext = contentType.includes('png')
      ? 'png'
      : contentType.includes('webp')
        ? 'webp'
        : 'jpg';
    const filename = `avatar_${userId}_${Date.now()}.${ext}`;

    const { url } = await uploadToDrive(
      buffer,
      filename,
      contentType,
      'avatars'
    );
    return url;
  } catch (err) {
    console.error('uploadAvatarFromUrl error:', err);
    return null;
  }
}
