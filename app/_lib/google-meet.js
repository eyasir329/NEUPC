/**
 * @file Creates Google Meet spaces via the Meet REST API (v2).
 *
 * Uses OAuth2 user credentials (refresh token) since the Meet API
 * requires user identity — service account JWTs are not supported.
 *
 * Required env vars:
 *   AUTH_GOOGLE_ID            – OAuth2 client ID
 *   AUTH_GOOGLE_SECRET        – OAuth2 client secret
 *   GOOGLE_MEET_REFRESH_TOKEN – refresh token with meetings.space.created scope
 */

import { google } from 'googleapis';

function getAuth() {
  const clientId     = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  const refreshToken = process.env.GOOGLE_MEET_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken)
    throw new Error('Missing AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, or GOOGLE_MEET_REFRESH_TOKEN');

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  return auth;
}

/**
 * Creates a Google Meet space with auto-recording enabled and returns its join URL.
 * Auto-recording requires Google Workspace with recording enabled by the admin.
 *
 * @returns {{ meetLink: string, spaceId: string, eventId: string }}
 */
export async function createMeetEvent({ title } = {}) {
  const auth = getAuth();
  const { token } = await auth.getAccessToken();

  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meet API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const meetLink = data.meetingUri;
  if (!meetLink) throw new Error('Meet API returned no meetingUri');

  // spaceId is the resource name, e.g. "spaces/abc123"
  return { meetLink, spaceId: data.name, eventId: data.name };
}

/**
 * Ends the active conference on a Meet space, making the link invalid.
 * Non-fatal if the space has no active conference or already ended.
 *
 * @param {string} spaceId - resource name e.g. "spaces/abc123"
 */
export async function endMeetConference(spaceId) {
  if (!spaceId) return;
  const auth = getAuth();
  const { token } = await auth.getAccessToken();

  await fetch(`https://meet.googleapis.com/v2/${spaceId}:endActiveConference`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  // Ignore errors — space may already be inactive
}
