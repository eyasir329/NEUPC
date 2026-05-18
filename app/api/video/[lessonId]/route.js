/**
 * @file Video streaming API route for bootcamp lessons.
 * @module api/video/[lessonId]
 *
 * Securely streams videos from Google Drive through our server.
 * Supports HTTP Range requests for seeking and partial content.
 *
 * Security:
 * - Validates user enrollment before streaming
 * - Never exposes direct Google Drive URLs
 * - Free preview lessons are accessible without enrollment
 *
 * TODO: Consider adding rate limiting for production
 * (e.g., using Upstash rate limit or similar)
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/_lib/auth';
import { supabaseAdmin } from '@/app/_lib/supabase';
import { streamVideo } from '@/app/_lib/bootcamp-video';
import { getYouTubeEmbedUrl, extractDriveFileId } from '@/app/_lib/utils';

/**
 * Collect every Drive fileId embedded in a lesson's content blocks.
 * Lessons can hold videos either in the legacy single video_id column
 * or as one or more video blocks inside content JSON. Members reference
 * these via ?fileId=... — authorize against this allowlist.
 */
function collectLessonDriveIds(lesson) {
  const ids = new Set();
  const add = (v) => {
    const id = extractDriveFileId(v) || (typeof v === 'string' ? v : null);
    if (id) ids.add(id);
  };
  if (lesson?.video_source === 'drive') {
    add(lesson.video_id);
    add(lesson.video_url);
  }
  const content = lesson?.content;
  const blocks = Array.isArray(content)
    ? content
    : Array.isArray(content?.blocks)
      ? content.blocks
      : [];
  for (const block of blocks) {
    if (block?.type !== 'video') continue;
    const data = block.data || {};
    const videos = Array.isArray(data.videos)
      ? data.videos
      : (data.video_id || data.video_url)
        ? [{ video_source: data.video_source, video_id: data.video_id, video_url: data.video_url }]
        : [];
    for (const v of videos) {
      if ((v.video_source || 'drive') !== 'drive') continue;
      add(v.video_id);
      add(v.video_url);
    }
  }
  return ids;
}

/**
 * Check if user has access to the lesson.
 */
/**
 * Check if user has access to the lesson.
 */
async function canAccessLesson(lessonId, userEmail) {
  let isAdmin = false;
  let isMember = false;
  let user = null;

  if (userEmail) {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();
    
    user = data;

    if (user) {
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id);
      isAdmin = roles?.some((r) => r.roles?.name === 'admin');
      isMember = roles?.some((r) => r.roles?.name === 'member');
    }
  }

  // Determine if lessonId is a valid UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId);

  let lesson = null;
  if (isUuid) {
    const { data } = await supabaseAdmin
      .from('lessons')
      .select(
        `
        id,
        video_source,
        video_id,
        video_url,
        content,
        is_free_preview,
        is_published,
        modules (
          is_published,
          courses (
            is_published,
            bootcamps (
              id,
              status
            )
          )
        )
      `
      )
      .eq('id', lessonId)
      .single();
    
    lesson = data;
  }

  // Admins bypass all checks (enrollment, published status, even existence if previewing)
  if (isAdmin) {
    return { allowed: true, lesson: lesson || {}, isAdmin: true };
  }

  if (!lesson) {
    return { allowed: false, reason: 'Lesson not found', isAdmin: false };
  }

  // Check if lesson/module/course/bootcamp are published
  if (!lesson.is_published) {
    return { allowed: false, reason: 'Lesson not published', isAdmin: false };
  }

  const mod = lesson.modules;
  const course = mod?.courses;
  const bootcamp = course?.bootcamps;

  if (!mod?.is_published || !course?.is_published) {
    return { allowed: false, reason: 'Content not published', isAdmin: false };
  }

  if (bootcamp?.status !== 'published') {
    return { allowed: false, reason: 'Bootcamp not published', isAdmin: false };
  }

  // Free preview lessons are accessible to everyone
  if (lesson.is_free_preview) {
    return { allowed: true, lesson, isAdmin: false };
  }

  // Check user authentication
  if (!user) {
    return { allowed: false, reason: 'Authentication required', isAdmin: false };
  }

  // Check member role
  if (!isMember) {
    return { allowed: false, reason: 'Member role required', isAdmin: false };
  }

  // Check enrollment
  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('bootcamp_id', bootcamp.id)
    .single();

  if (!enrollment || enrollment.status !== 'active') {
    return { allowed: false, reason: 'Not enrolled in this bootcamp', isAdmin: false };
  }

  return { allowed: true, lesson, isAdmin: false };
}

/**
 * GET /api/video/[lessonId]
 *
 * Stream video content for a lesson.
 * Supports Range requests for video seeking.
 */
export async function GET(request, { params }) {
  try {
    const { lessonId } = await params;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    // Get user session
    const session = await auth();
    const userEmail = session?.user?.email || null;

    // Check access
    const access = await canAccessLesson(lessonId, userEmail);

    if (!access.allowed) {
      return NextResponse.json(
        { error: access.reason },
        { status: access.reason === 'Authentication required' ? 401 : 403 }
      );
    }

    const lesson = access.lesson;

    // Determine target video ID.
    // Admins: any fileId (preview mode).
    // Members: fileId must match a video embedded in lesson (legacy column or content blocks).
    const allowedDriveIds = collectLessonDriveIds(lesson);
    const requestedFileId = fileId ? extractDriveFileId(fileId) || fileId : null;
    let targetVideoId;
    let videoSource;
    if (access.isAdmin && requestedFileId) {
      targetVideoId = requestedFileId;
      videoSource = 'drive';
    } else if (requestedFileId && allowedDriveIds.has(requestedFileId)) {
      targetVideoId = requestedFileId;
      videoSource = 'drive';
    } else {
      targetVideoId = lesson.video_id;
      videoSource = lesson.video_source || 'none';
    }

    if (!targetVideoId && videoSource !== 'youtube' && videoSource !== 'upload') {
      return NextResponse.json(
        { error: 'No video configured' },
        { status: 404 }
      );
    }

    switch (videoSource) {
      case 'drive': {
        // Get Range header for partial content
        const rangeHeader = request.headers.get('range');

        try {
          const { stream, headers, status } = await streamVideo(
            targetVideoId,
            rangeHeader
          );

          // Create response with stream
          const response = new NextResponse(stream, { status });

          // Set headers
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, String(value));
          });

          // Security headers to prevent video download/embedding elsewhere
          response.headers.set('X-Content-Type-Options', 'nosniff');
          response.headers.set(
            'Content-Disposition',
            'inline; filename="video"'
          );

          return response;
        } catch (err) {
          console.error('Video streaming error:', err);
          return NextResponse.json(
            { error: 'Failed to stream video' },
            { status: 500 }
          );
        }
      }

      case 'youtube': {
        // For YouTube, return the embed URL (client handles embedding)
        const embedUrl = getYouTubeEmbedUrl(
          lesson.video_id || lesson.video_url
        );
        if (!embedUrl) {
          return NextResponse.json(
            { error: 'Invalid YouTube video' },
            { status: 400 }
          );
        }
        return NextResponse.json({ type: 'youtube', embedUrl });
      }

      case 'upload': {
        // For uploaded videos, redirect to the stored URL
        if (!lesson.video_url) {
          return NextResponse.json(
            { error: 'No video configured' },
            { status: 404 }
          );
        }
        return NextResponse.redirect(lesson.video_url);
      }

      case 'none':
      default:
        return NextResponse.json(
          { error: 'This lesson has no video content' },
          { status: 404 }
        );
    }
  } catch (err) {
    console.error('Video API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/video/[lessonId]
 *
 * Return video metadata without streaming content.
 * Used by video players to determine file size and support.
 */
export async function HEAD(request, { params }) {
  try {
    const { lessonId } = await params;

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    const session = await auth();
    const userEmail = session?.user?.email || null;

    const access = await canAccessLesson(lessonId, userEmail);

    if (!access.allowed) {
      return new NextResponse(null, { status: 403 });
    }

    const lesson = access.lesson;
    const allowedDriveIds = collectLessonDriveIds(lesson);
    const requestedFileId = fileId ? extractDriveFileId(fileId) || fileId : null;
    let targetVideoId;
    let videoSource;
    if (access.isAdmin && requestedFileId) {
      targetVideoId = requestedFileId;
      videoSource = 'drive';
    } else if (requestedFileId && allowedDriveIds.has(requestedFileId)) {
      targetVideoId = requestedFileId;
      videoSource = 'drive';
    } else {
      targetVideoId = lesson.video_id;
      videoSource = lesson.video_source || 'none';
    }

    if (videoSource === 'drive' && targetVideoId) {
      const { getFileMetadata } = await import('@/app/_lib/bootcamp-video');
      const metadata = await getFileMetadata(targetVideoId);

      return new NextResponse(null, {
        status: 200,
        headers: {
          'Content-Type': metadata.mimeType || 'video/mp4',
          'Content-Length': String(metadata.size),
          'Accept-Ranges': 'bytes',
        },
      });
    }

    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}

