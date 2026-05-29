/**
 * @file Google Drive API client and upload helper.
 * @module gdrive
 *
 * Required env vars:
 *   GDRIVE_CLIENT_ID      – OAuth2 client ID (same as AUTH_GOOGLE_ID)
 *   GDRIVE_CLIENT_SECRET  – OAuth2 client secret (same as AUTH_GOOGLE_SECRET)
 *   GDRIVE_REFRESH_TOKEN  – OAuth2 refresh token (run scripts/get-drive-token.mjs once)
 *   GDRIVE_FOLDER_ID      – target folder ID from a personal Drive folder URL
 *
 * Setup:
 *   1. Enable the Google Drive API at console.cloud.google.com
 *   2. Add http://localhost:3001/callback as an Authorised Redirect URI for the OAuth2 client
 *   3. Run: node scripts/get-drive-token.mjs
 *   4. Set GDRIVE_REFRESH_TOKEN in .env.local with the printed token
 *   5. Create a folder in your personal Google Drive and copy the folder ID from the URL
 */

import { google } from 'googleapis';
import { Readable } from 'stream';

let _driveClient = null;

function getDriveClient() {
  if (_driveClient) return _driveClient;

  const clientId = process.env.GDRIVE_CLIENT_ID;
  const clientSecret = process.env.GDRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GDRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing Google Drive credentials. Set GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, and GDRIVE_REFRESH_TOKEN in env.'
    );
  }

  const auth = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3001/callback'
  );
  auth.setCredentials({ refresh_token: refreshToken });

  _driveClient = google.drive({ version: 'v3', auth });
  return _driveClient;
}

// Cache for subfolder IDs so we don't re-create them every upload
const _subfolderCache = new Map();

/**
 * Find or create a subfolder inside the root GDRIVE_FOLDER_ID.
 * Results are cached in memory for the lifetime of the process.
 */
async function getOrCreateSubfolder(drive, parentId, folderName) {
  const cacheKey = `${parentId}/${folderName}`;
  if (_subfolderCache.has(cacheKey)) return _subfolderCache.get(cacheKey);

  // Check if subfolder already exists
  const { data: existing } = await drive.files.list({
    q: `'${parentId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
    pageSize: 1,
  });

  if (existing.files?.length > 0) {
    const id = existing.files[0].id;
    _subfolderCache.set(cacheKey, id);
    return id;
  }

  // Create the subfolder
  const { data: folder } = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });

  _subfolderCache.set(cacheKey, folder.id);
  return folder.id;
}

/**
 * Upload a buffer to Google Drive and return the public image URL.
 *
 * The file is placed in GDRIVE_FOLDER_ID (or a subfolder if specified),
 * made publicly readable, and the URL uses Google's CDN:
 * https://lh3.googleusercontent.com/d/{fileId}
 *
 * @param {Buffer}  buffer      - File contents
 * @param {string}  filename    - Desired filename (e.g. "event_123.jpg")
 * @param {string}  contentType - MIME type (e.g. "image/jpeg")
 * @param {string}  [subfolder] - Optional subfolder name (e.g. "event-images")
 * @returns {Promise<{url: string, fileId: string}>}
 */
export async function uploadToDrive(buffer, filename, contentType, subfolder) {
  const rootFolderId = process.env.GDRIVE_FOLDER_ID;
  if (!rootFolderId) throw new Error('GDRIVE_FOLDER_ID env var is not set.');

  try {
    const drive = getDriveClient();

    // Resolve target folder (create subfolder if specified)
    const targetFolderId = subfolder
      ? await getOrCreateSubfolder(drive, rootFolderId, subfolder)
      : rootFolderId;

    // Convert Buffer to a readable stream for the multipart upload
    const stream = Readable.from(buffer);

    // 1. Upload the file
    const { data: file } = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [targetFolderId],
      },
      media: {
        mimeType: contentType,
        body: stream,
      },
      fields: 'id, name',
    });

    const fileId = file.id;

    // 2. Make the file publicly readable (anyone with the link can view)
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // 3. Return our image proxy URL (avoids CSP/CORS issues with external domains)
    const url = `/api/image/${fileId}`;
    return { url, fileId };
  } catch (err) {
    // Handle "invalid_grant" error - refresh token has expired
    if (err.message?.includes('invalid_grant')) {
      const helpText =
        'Google Drive refresh token expired. Run this command to regenerate it:\n' +
        '  GDRIVE_CLIENT_ID=$GDRIVE_CLIENT_ID GDRIVE_CLIENT_SECRET=$GDRIVE_CLIENT_SECRET node scripts/get-drive-token.mjs\n' +
        'Then update GDRIVE_REFRESH_TOKEN in your .env.local';
      const error = new Error(helpText);
      error.originalError = err;
      throw error;
    }
    throw err;
  }
}

/**
 * Upload a session recording (video) to Google Drive.
 * Returns a public shareable viewer link (drive.google.com/file/d/{id}/view).
 *
 * @param {Buffer}  buffer      - Video file contents
 * @param {string}  filename    - e.g. "2026-05-21_session.mp4"
 * @param {string}  contentType - MIME type e.g. "video/mp4"
 * @returns {Promise<{driveUrl: string, fileId: string}>}
 */
export async function uploadRecordingToDrive(buffer, filename, contentType) {
  const rootFolderId = process.env.GDRIVE_FOLDER_ID;
  if (!rootFolderId) throw new Error('GDRIVE_FOLDER_ID env var is not set.');

  const drive = getDriveClient();
  const folderId = await getOrCreateSubfolder(
    drive,
    rootFolderId,
    'session-recordings'
  );
  const stream = Readable.from(buffer);

  const { data: file } = await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media: { mimeType: contentType || 'video/mp4', body: stream },
    fields: 'id',
  });

  await drive.permissions.create({
    fileId: file.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  const driveUrl = `https://drive.google.com/file/d/${file.id}/view`;
  return { driveUrl, fileId: file.id };
}

/**
 * Returns the ID of the "Meet Recordings" folder in the organizer's Drive.
 * Meet always saves recordings here — this is the folder we watch.
 * Creates it if it doesn't exist yet.
 */
export async function getMeetRecordingsFolderId() {
  const drive = getDriveClient();

  // Meet creates this folder at the root of My Drive
  const { data } = await drive.files.list({
    q: `name = 'Meet Recordings' and mimeType = 'application/vnd.google-apps.folder' and trashed = false and 'root' in parents`,
    fields: 'files(id)',
    pageSize: 1,
  });

  if (data.files?.length > 0) return data.files[0].id;

  // Create it if Meet hasn't made it yet
  const { data: folder } = await drive.files.create({
    requestBody: {
      name: 'Meet Recordings',
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });
  return folder.id;
}

/**
 * Register a single global Drive push-notification watch on "Meet Recordings".
 * Drive POSTs to /api/webhooks/drive-recording on any change in that folder.
 * Use a fixed channelId of 'meet-recordings-global' so there's only ever one watch.
 */
export async function watchMeetRecordingsFolder() {
  const appUrl = (process.env.NEXTAUTH_URL || '').replace(/\/$/, '');
  if (!appUrl) throw new Error('NEXTAUTH_URL env var is not set');

  // Drive cannot reach localhost — skip watch registration in local dev
  if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
    console.log('Drive watch skipped in local dev (Drive needs a public URL)');
    return {
      channelId: null,
      resourceId: null,
      folderId: null,
      expiration: null,
    };
  }

  const webhookSecret = process.env.DRIVE_WEBHOOK_SECRET;
  if (!webhookSecret)
    throw new Error('DRIVE_WEBHOOK_SECRET env var is not set');

  const folderId = await getMeetRecordingsFolderId();
  const drive = getDriveClient();

  const { data } = await drive.files.watch({
    fileId: folderId,
    requestBody: {
      id: 'meet-recordings-global',
      type: 'web_hook',
      address: `${appUrl}/api/webhooks/drive-recording`,
      token: webhookSecret,
      expiration: String(Date.now() + 6 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    channelId: data.id,
    resourceId: data.resourceId,
    folderId,
    expiration: new Date(parseInt(data.expiration)).toISOString(),
  };
}

/**
 * @deprecated Use watchMeetRecordingsFolder instead.
 * Kept for the per-session watch renewal action — will be cleaned up.
 */
export async function watchRecordingsFolder(folderId, channelId) {
  return watchMeetRecordingsFolder();
}

/**
 * Returns the ID of the "session-recordings" subfolder, creating it if needed.
 */
export async function getOrCreateRecordingsFolderId() {
  const rootFolderId = process.env.GDRIVE_FOLDER_ID;
  if (!rootFolderId) throw new Error('GDRIVE_FOLDER_ID env var is not set.');
  const drive = getDriveClient();
  return getOrCreateSubfolder(drive, rootFolderId, 'session-recordings');
}

/**
 * Stop an active Drive watch channel.
 * Call this when cancelling a session or after successfully linking a recording.
 */
export async function stopDriveWatch(channelId, resourceId) {
  if (!channelId || !resourceId) return;
  try {
    const drive = getDriveClient();
    await drive.channels.stop({ requestBody: { id: channelId, resourceId } });
  } catch (err) {
    // Ignore "not found" — channel may have already expired
    if (!err?.message?.includes('404') && !err?.message?.includes('notFound')) {
      console.error('Drive stopWatch error:', err?.message);
    }
  }
}

/**
 * List the most recently modified video files in a Drive folder.
 * Used by the webhook handler to find the new recording.
 */
export async function listRecentVideosInFolder(folderId, sinceIso) {
  const drive = getDriveClient();
  const since =
    sinceIso || new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data } = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'video/' and trashed = false and createdTime > '${since}'`,
    fields: 'files(id, name, mimeType, createdTime, size)',
    orderBy: 'createdTime desc',
    pageSize: 10,
  });

  return data.files || [];
}

/**
 * Make an existing Drive file publicly readable and return its viewer URL.
 */
export async function makeFilePublic(fileId) {
  const drive = getDriveClient();
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  });
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Delete a file from Google Drive by its file ID or public URL.
 *
 * @param {string} fileIdOrUrl - Drive file ID, lh3 URL, /api/image/{id} URL, or drive.google.com URL
 */
export async function deleteFromDrive(fileIdOrUrl) {
  if (!fileIdOrUrl) return;

  let fileId = fileIdOrUrl;

  // Extract file ID from /api/image/{fileId} proxy URL
  const proxyMatch = fileIdOrUrl.match(/\/api\/image\/([^/?&]+)/);
  if (proxyMatch) {
    fileId = proxyMatch[1];
  }

  // Extract file ID from a lh3.googleusercontent.com/d/{fileId} URL
  const lh3Match = fileIdOrUrl.match(
    /lh3\.googleusercontent\.com\/d\/([^/?&]+)/
  );
  if (lh3Match) {
    fileId = lh3Match[1];
  }

  // Extract file ID from a drive.google.com URL (uc?id= or /file/d/)
  const driveMatch =
    fileIdOrUrl.match(/[?&]id=([^&]+)/) ||
    fileIdOrUrl.match(/\/file\/d\/([^/]+)/);
  if (driveMatch) {
    fileId = driveMatch[1];
  }

  try {
    const drive = getDriveClient();
    await drive.files.delete({ fileId });
  } catch (err) {
    // Ignore "not found" errors
    if (err?.code !== 404 && err?.status !== 404) {
      console.error('Google Drive delete error:', err?.message ?? err);
    }
  }
}
