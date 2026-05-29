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
import { auth } from '@/app/_lib/auth/auth';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { streamVideo } from '@/app/_lib/services/bootcamp-video';
import { getYouTubeEmbedUrl, extractDriveFileId } from '@/app/_lib/utils/utils';

// Allowlist of hostnames the redirect responses may target.
// YouTube stream URLs land on googlevideo.com; uploaded videos live on Drive
// (served back through /api/image/...) or, in dev, on the local origin.
const YOUTUBE_STREAM_HOSTS = ['googlevideo.com'];
const UPLOAD_VIDEO_HOSTS = [
  'drive.google.com',
  'lh3.googleusercontent.com',
  'storage.googleapis.com',
];

function isAllowedRedirectHost(url, allowedSuffixes) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    return allowedSuffixes.some(
      (h) => u.hostname === h || u.hostname.endsWith(`.${h}`)
    );
  } catch {
    return false;
  }
}

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
      : data.video_id || data.video_url
        ? [
            {
              video_source: data.video_source,
              video_id: data.video_id,
              video_url: data.video_url,
            },
          ]
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
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      lessonId
    );

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

  // Local-dev bypass for easy testing. Guard with two checks so a misconfigured
  // NODE_ENV in a real deploy can't silently disable enrollment enforcement.
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.VERCEL_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production'
  ) {
    return { allowed: true, lesson: lesson || {}, isAdmin: true };
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
    return {
      allowed: false,
      reason: 'Authentication required',
      isAdmin: false,
    };
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
    return {
      allowed: false,
      reason: 'Not enrolled in this bootcamp',
      isAdmin: false,
    };
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
    const requestedFileId = fileId
      ? extractDriveFileId(fileId) || fileId
      : null;
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

    if (
      !targetVideoId &&
      videoSource !== 'youtube' &&
      videoSource !== 'upload'
    ) {
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
        const videoId = extractYouTubeId(
          targetVideoId || lesson.video_id || lesson.video_url
        );
        if (!videoId) {
          return NextResponse.json(
            { error: 'Invalid YouTube video ID' },
            { status: 400 }
          );
        }

        const directUrl = await resolveYouTubeStreamUrl(videoId);
        if (
          directUrl &&
          isAllowedRedirectHost(directUrl, YOUTUBE_STREAM_HOSTS)
        ) {
          return NextResponse.redirect(directUrl);
        }

        return NextResponse.json(
          { error: 'Failed to resolve direct YouTube stream URL' },
          { status: 400 }
        );
      }

      case 'upload': {
        // For uploaded videos, redirect to the stored URL
        if (!lesson.video_url) {
          return NextResponse.json(
            { error: 'No video configured' },
            { status: 404 }
          );
        }
        if (!isAllowedRedirectHost(lesson.video_url, UPLOAD_VIDEO_HOSTS)) {
          return NextResponse.json(
            { error: 'Invalid video URL' },
            { status: 400 }
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
    const requestedFileId = fileId
      ? extractDriveFileId(fileId) || fileId
      : null;
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
      const { getFileMetadata } =
        await import('@/app/_lib/services/bootcamp-video');
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

/**
 * Extracts YouTube video ID from various YouTube URL formats.
 */
function extractYouTubeId(urlOrId) {
  if (!urlOrId) return '';
  const cleanId = String(urlOrId).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanId)) {
    return cleanId;
  }
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
  const match = cleanId.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  return cleanId;
}

/**
 * Dynamically resolves YouTube stream URL by calling the player API.
 */
async function resolveYouTubeStreamUrl(videoId) {
  if (!videoId) return null;

  const clients = [
    {
      clientName: 'ANDROID_TESTSUITE',
      clientVersion: '1.9',
    },
    {
      clientName: 'ANDROID',
      clientVersion: '19.00.00',
    },
    {
      clientName: 'TVHTML5',
      clientVersion: '7.20250101',
    },
  ];

  for (const client of clients) {
    try {
      const response = await fetch(
        'https://www.youtube.com/youtubei/v1/player',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
          },
          body: JSON.stringify({
            videoId: videoId,
            context: {
              client: {
                clientName: client.clientName,
                clientVersion: client.clientVersion,
                hl: 'en',
                gl: 'US',
                utcOffsetMinutes: 0,
              },
            },
          }),
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const streamingData = data.streamingData || {};

      const formats = streamingData.formats || [];
      const adaptiveFormats = streamingData.adaptiveFormats || [];

      // Find the highest quality muxed stream (mp4 with video and audio)
      const muxedStream = formats
        .filter((f) => f.url && f.mimeType?.includes('video/mp4'))
        .sort((a, b) => (b.width || 0) - (a.width || 0))[0];

      if (muxedStream?.url) {
        return muxedStream.url;
      }

      // Check adaptive formats as fallback (find any with video and audio or just any with a url)
      const anyStream = [...formats, ...adaptiveFormats].find((f) => f.url);
      if (anyStream?.url) {
        return anyStream.url;
      }
    } catch (err) {
      console.error(
        `Failed resolving YouTube stream with client ${client.clientName}:`,
        err
      );
    }
  }
  return null;
}
