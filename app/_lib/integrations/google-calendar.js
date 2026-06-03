/**
 * @file Per-member Google Calendar integration for the Daily Activity page.
 * @module google-calendar
 *
 * Opt-in, two-way: a member connects their Google account (separate OAuth flow,
 * reusing the AUTH_GOOGLE_* client), we store their refresh token, then:
 *   • read  — list their calendar events to overlay on the activity calendar,
 *             and read back the done-state of mirrored Google Tasks (pull).
 *   • write — mirror NEUPC to-dos to Google **Tasks** (title, due date,
 *             rich notes, completion, and real child sub-tasks), and read-only
 *             feed items (events/sessions/contests/deadlines) to Calendar.
 *
 * To-dos are deliberately mirrored to Google Tasks only — never a Calendar
 * event — so a to-do is never duplicated and no time-of-day event is created.
 *
 * Required env vars (the OAuth client is shared with NextAuth sign-in):
 *   AUTH_GOOGLE_ID            – OAuth2 client ID
 *   AUTH_GOOGLE_SECRET        – OAuth2 client secret
 *   NEXTAUTH_URL              – app origin; the callback redirect URI is derived
 *                              from it (must be registered on the OAuth client)
 *
 * Google Cloud setup (one-time):
 *   1. Enable the Google Calendar API and the Google Tasks API.
 *   2. Add `${NEXTAUTH_URL}/api/integrations/google-calendar/callback` as an
 *      Authorised redirect URI on the OAuth client.
 *   3. Add the calendar.events + tasks + userinfo.email scopes on the consent
 *      screen.
 */

import { randomUUID } from 'node:crypto';
import { google } from 'googleapis';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { GCAL_COLOR_MAP, LAYER_DEFAULTS } from '@/app/account/member/daily-activity/_components/utils';

export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',   // read + write all calendars
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/userinfo.email',
];

// Tasks we push carry this marker so the import step can skip them (otherwise a
// mirrored task would show up twice — once as a todo, once as a Google event).
const TODO_MARKER = 'neupcTodoId';
// Feed items (events/sessions/contests/deadlines) we push carry their NEUPC feed
// id under this marker. They live in read-only tables with no place to store a
// Google event id, so re-sync upserts by searching for this marker instead.
const FEED_MARKER = 'neupcFeedId';
// Personal calendar events carry their NEUPC personal_event id under this marker.
const PERSONAL_MARKER = 'neupcPersonalId';

// ── Expand-mode colour parity ──────────────────────────────────────────────────
// The expand-mode calendar (ExpandedCalendarModal) colours items by their layer
// default (LAYER_DEFAULTS), per-item colorId, or project colour. Google Calendar
// supports only its 11 fixed colorIds, so we map a hex colour to the nearest one.

// Expand-mode default colour per feed category, mirroring LAYER_DEFAULTS.
const CATEGORY_COLOR = {
  contest:  LAYER_DEFAULTS.contests,
  event:    LAYER_DEFAULTS.events,
  session:  LAYER_DEFAULTS.sessions,
  task:     LAYER_DEFAULTS.tasks,
  personal: LAYER_DEFAULTS.personal,
  todo:     LAYER_DEFAULTS.todo,
};

// ── Dhaka-local date/time helpers (UTC+6, no DST) ──────────────────────────────
const DHAKA_PARTS = (iso) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).formatToParts(new Date(iso)).map(({ type, value }) => [type, value])
  );

/** Dhaka-local YYYY-MM-DD from an ISO string. */
function dhakaDate(iso) {
  if (!iso) return null;
  if (Number.isNaN(new Date(iso).getTime())) return typeof iso === 'string' ? iso.split('T')[0] : null;
  const p = DHAKA_PARTS(iso);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Dhaka-local HH:MM:SS from an ISO string. */
function dhakaTime(iso) {
  const p = DHAKA_PARTS(iso);
  const hh = p.hour === '24' ? '00' : p.hour;
  return `${hh}:${p.minute}:${p.second}`;
}

/** Next calendar day (YYYY-MM-DD) in Dhaka. */
function nextDhakaDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00+06:00`);
  d.setUTCDate(d.getUTCDate() + 1);
  return dhakaDate(d.toISOString());
}

/** Previous calendar day (YYYY-MM-DD) in Dhaka. */
function prevDhakaDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00+06:00`);
  d.setUTCDate(d.getUTCDate() - 1);
  return dhakaDate(d.toISOString());
}

/**
 * Split a timed range [startISO, endISO] into one sub-event per Dhaka calendar
 * day, each strictly within a single day (start time → 23:59:59, full middle
 * days, 00:00:00 → end time). Google only draws events shorter than a day in the
 * time grid; multi-day events get parked in the all-day strip — so slicing makes
 * a multi-day task/event appear *in the timeline* exactly like the expand day
 * view. Same-day ranges return a single slice (unchanged).
 */
function sliceTimedRange(startISO, endISO) {
  const startDate = dhakaDate(startISO);
  const endDate   = dhakaDate(endISO);
  if (!startDate || !endDate || startDate === endDate) {
    return [{ start: { dateTime: startISO }, end: { dateTime: endISO } }];
  }
  const slices = [];
  let cur = startDate;
  let guard = 0;
  while (cur <= endDate && guard < 120) {
    const s = cur === startDate ? dhakaTime(startISO) : '00:00:00';
    const e = cur === endDate   ? dhakaTime(endISO)   : '23:59:59';
    if (`${cur}T${s}` < `${cur}T${e}`) {
      slices.push({ start: { dateTime: `${cur}T${s}+06:00` }, end: { dateTime: `${cur}T${e}+06:00` } });
    }
    cur = nextDhakaDate(cur);
    guard++;
  }
  return slices.length ? slices : [{ start: { dateTime: startISO }, end: { dateTime: endISO } }];
}

/**
 * Expand a single timed event body into per-day slices (see sliceTimedRange).
 * All-day or single-day bodies pass through unchanged.
 */
function explodeToSlices(body) {
  if (!body) return [];
  const startISO = body.start?.dateTime;
  const endISO   = body.end?.dateTime;
  if (!startISO || !endISO) return [body];
  const slices = sliceTimedRange(startISO, endISO);
  return slices.length <= 1 ? [body] : slices.map((s) => ({ ...body, ...s }));
}

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Nearest Google Calendar colorId (string) to a hex colour, or undefined. */
function hexToColorId(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return undefined;
  let best, bestDist = Infinity;
  for (const [id, h] of Object.entries(GCAL_COLOR_MAP)) {
    const c = hexToRgb(h);
    if (!c) continue;
    const d = (rgb[0] - c[0]) ** 2 + (rgb[1] - c[1]) ** 2 + (rgb[2] - c[2]) ** 2;
    if (d < bestDist) { bestDist = d; best = id; }
  }
  return best;
}

// ── OAuth client ──────────────────────────────────────────────────────────────

/** Callback URL the OAuth flow returns to (must be registered on the client). */
export function getRedirectUri() {
  const origin = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  );
  return `${origin}/api/integrations/google-calendar/callback`;
}

function createOAuthClient() {
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Missing AUTH_GOOGLE_ID or AUTH_GOOGLE_SECRET');
  }
  return new google.auth.OAuth2(clientId, clientSecret, getRedirectUri());
}

/** Consent URL. `state` is an opaque CSRF nonce the callback verifies. */
export function getAuthUrl(state) {
  return createOAuthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // force a refresh_token even on re-connect
    scope: CALENDAR_SCOPES,
    state,
    include_granted_scopes: true,
  });
}

/**
 * Exchange an authorization code for tokens and the connected Google email.
 * @returns {Promise<{ tokens: object, email: string|null }>}
 */
export async function exchangeCode(code) {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  let email = null;
  try {
    const { data } = await google.oauth2({ version: 'v2', auth: client }).userinfo.get();
    email = data.email || null;
  } catch {
    // Non-fatal — we just won't display which account is connected.
  }
  return { tokens, email };
}

// ── Connection storage ────────────────────────────────────────────────────────

/** Load a member's stored connection row, or null if not connected. */
export async function getConnection(userId) {
  if (!userId) return null;
  const { data, error } = await supabaseAdmin
    .from('google_calendar_connections')
    .select(
      'user_id, google_email, calendar_id, access_token, refresh_token, token_expiry, scope, sync_enabled'
    )
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('getConnection:', error.message);
    return null;
  }
  return data || null;
}

/** Upsert the connection after a successful OAuth exchange. */
export async function saveConnection(userId, { tokens, email }) {
  const row = {
    user_id: userId,
    google_email: email || null,
    access_token: tokens.access_token || null,
    token_expiry: tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : null,
    scope: tokens.scope || CALENDAR_SCOPES.join(' '),
    updated_at: new Date().toISOString(),
  };
  // Google only returns a refresh_token on the first consent; keep the existing
  // one if this re-connect didn't include a fresh one.
  if (tokens.refresh_token) row.refresh_token = tokens.refresh_token;

  if (!row.refresh_token) {
    const existing = await getConnection(userId);
    if (!existing?.refresh_token) {
      throw new Error(
        'Google did not return a refresh token. Disconnect and reconnect with consent.'
      );
    }
  }

  const { error } = await supabaseAdmin
    .from('google_calendar_connections')
    .upsert(row, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);
}

/** Remove the connection and detach any mirrored event/task ids from the todos. */
export async function deleteConnection(userId) {
  await supabaseAdmin
    .from('google_calendar_connections')
    .delete()
    .eq('user_id', userId);
  await supabaseAdmin
    .from('todos')
    .update({ gcal_event_id: null, gtask_id: null })
    .eq('user_id', userId)
    .or('gcal_event_id.not.is.null,gtask_id.not.is.null');
  // Clear feed event mappings so re-connecting pushes fresh events.
  await supabaseAdmin.from('feed_gcal_events').delete().eq('user_id', userId);
}

export async function setSyncEnabled(userId, enabled) {
  const { error } = await supabaseAdmin
    .from('google_calendar_connections')
    .update({ sync_enabled: !!enabled, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

/**
 * Authorized Calendar client for a member, or null if not connected.
 * Persists a rotated access token when googleapis refreshes it. A revoked
 * grant (`invalid_grant`) clears the connection and returns null.
 */
export async function getCalendarClient(userId) {
  const conn = await getConnection(userId);
  if (!conn?.refresh_token) return null;

  const auth = createOAuthClient();
  auth.setCredentials({
    refresh_token: conn.refresh_token,
    access_token: conn.access_token || undefined,
    expiry_date: conn.token_expiry
      ? new Date(conn.token_expiry).getTime()
      : undefined,
  });
  auth.on('tokens', (tokens) => {
    if (!tokens.access_token) return;
    supabaseAdmin
      .from('google_calendar_connections')
      .update({
        access_token: tokens.access_token,
        token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .then(undefined, (e) => console.error('token persist:', e?.message));
  });

  return {
    calendar: google.calendar({ version: 'v3', auth }),
    tasks: google.tasks({ version: 'v1', auth }),
    calendarId: conn.calendar_id || 'primary',
    syncEnabled: conn.sync_enabled !== false,
  };
}

/** True when an `invalid_grant` (user revoked access) caused the failure. */
function isRevoked(err) {
  const msg = err?.message || err?.response?.data?.error || '';
  return String(msg).includes('invalid_grant');
}

// ── Import: Google Calendar → activity feed ────────────────────────────────────

/**
 * The member's Google Calendar events in [timeMinISO, timeMaxISO], mapped to the
 * Daily Activity feed shape (category `gcal`). Recurring events are expanded to
 * single instances. Tasks we mirrored back are skipped to avoid duplicates.
 *
 * @returns {Promise<object[]>}
 */
export async function listCalendarEvents(userId, timeMinISO, timeMaxISO) {
  const client = await getCalendarClient(userId);
  if (!client) return [];

  try {
    // Only fetch from calendars the user owns — skip shared/other-people's calendars.
    const { data: calList } = await client.calendar.calendarList.list({ minAccessRole: 'owner' });
    const ownedIds = (calList.items || []).map((c) => c.id);
    // Always include primary even if calendarList doesn't list it explicitly.
    if (!ownedIds.includes('primary')) ownedIds.unshift('primary');

    const seen = new Set();
    const allItems = [];
    for (const calId of ownedIds) {
      try {
        const { data } = await client.calendar.events.list({
          calendarId: calId,
          timeMin: timeMinISO,
          timeMax: timeMaxISO,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 250,
        });
        for (const ev of data.items || []) {
          if (!seen.has(ev.id)) {
            seen.add(ev.id);
            allItems.push(ev);
          }
        }
      } catch {
        // skip inaccessible calendars
      }
    }

    return allItems
      .filter((ev) => ev.status !== 'cancelled')
      // Skip NEUPC feed items and personal events we pushed — they're already in the DB.
      .filter((ev) => !ev.extendedProperties?.private?.[FEED_MARKER] && !ev.extendedProperties?.private?.[PERSONAL_MARKER] && !ev.extendedProperties?.private?.[TODO_CAL_MARKER])
      .map(mapEventToFeedItem)
      .filter(Boolean);
  } catch (err) {
    if (isRevoked(err)) {
      await deleteConnection(userId).catch(() => {});
      return [];
    }
    console.error('listCalendarEvents:', err?.message);
    return [];
  }
}

function mapEventToFeedItem(ev) {
  const startRaw = ev.start?.dateTime || ev.start?.date;
  if (!startRaw) return null;
  const allDay = !ev.start?.dateTime;
  const start = allDay ? new Date(`${ev.start.date}T00:00:00`) : new Date(startRaw);

  let durationMin = null;
  const endRaw = ev.end?.dateTime || ev.end?.date;
  if (!allDay && endRaw) {
    durationMin = Math.max(
      0,
      Math.round((new Date(endRaw).getTime() - start.getTime()) / 60000)
    );
  }

  return {
    id: `gcal-${ev.id}`,
    category: 'gcal',
    title: ev.summary || '(no title)',
    location: ev.location || null,
    // For all-day events keep the bare date string so timezone conversion in
    // feedItemToTask doesn't shift the date when the server is not UTC+0.
    start: allDay ? `${ev.start.date}T00:00:00` : start.toISOString(),
    durationMin,
    description: snippet(ev.description),
    url: ev.htmlLink || null,
    allDay,
  };
}

function snippet(raw, max = 160) {
  if (!raw) return null;
  const text = String(raw)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/**
 * The member's Google Tasks (the checkbox to-do lists), excluding any tasks
 * we mirrored from NEUPC (identified by their notes containing the TODO_MARKER).
 * Only tasks with a due date are returned so they can be placed on the calendar.
 *
 * @returns {Promise<object[]>}  Feed-shaped items with category `gcal`.
 */
export async function listGoogleTasks(userId) {
  const client = await getCalendarClient(userId);
  if (!client) return [];

  try {
    // Build the set of all Google Task IDs we mirrored from NEUPC (parent tasks
    // + child subtasks) so neither shows up twice on the calendar.
    const { data: mirroredRows } = await supabaseAdmin
      .from('todos')
      .select('gtask_id, gtask_subtask_ids')
      .eq('user_id', userId)
      .not('gtask_id', 'is', null);
    const mirroredIds = new Set();
    for (const r of mirroredRows || []) {
      if (r.gtask_id) mirroredIds.add(r.gtask_id);
      for (const childId of Object.values(r.gtask_subtask_ids || {})) {
        mirroredIds.add(childId);
      }
    }

    const { data: listsData } = await client.tasks.tasklists.list({ maxResults: 20 });
    const taskLists = listsData.items || [];

    const results = [];
    for (const list of taskLists) {
      try {
        const { data } = await client.tasks.tasks.list({
          tasklist: list.id,
          showCompleted: true,
          showDeleted: false,
          showHidden: true, // include completed/hidden so subtask done-state is captured
          maxResults: 100,
        });
        const items = data.items || [];

        // Google subtasks are separate tasks linked via `parent`. Group them so a
        // parent task imports with its children as real NEUPC subtasks.
        const childrenByParent = {};
        for (const t of items) {
          if (t.parent) (childrenByParent[t.parent] ||= []).push(t);
        }

        for (const t of items) {
          if (t.parent) continue;              // a subtask → imported with its parent
          if (t.status === 'completed') continue;
          if (mirroredIds.has(t.id)) continue; // already shown as a NEUPC todo
          // Also skip tasks we own that have our ID_TAG in notes (covers the case
          // where mirroredIds is stale — gtask_id not yet written back to DB).
          if (t.notes?.includes('neupcId:')) continue;
          if (!t.due) continue; // no date → can't place on calendar

          const dateStr = t.due.split('T')[0];
          // Build NEUPC subtasks + a { neupcSubId: googleChildId } map so a later
          // push updates these same Google children instead of duplicating them.
          const subtasks = [];
          const gtaskSubtaskIds = {};
          const kids = (childrenByParent[t.id] || [])
            .sort((a, b) => String(a.position || '').localeCompare(String(b.position || '')));
          for (const c of kids) {
            const sid = randomUUID();
            subtasks.push({ id: sid, title: c.title || '(subtask)', completed: c.status === 'completed', details: c.notes || '' });
            gtaskSubtaskIds[sid] = c.id;
          }

          results.push({
            id: `gtask-${t.id}`,
            category: 'gtask',
            title: t.title || '(no title)',
            start: `${dateStr}T00:00:00`,
            durationMin: null,
            description: t.notes ? t.notes.trim() : null,
            url: null,
            allDay: true,
            subtasks,
            gtaskSubtaskIds,
          });
        }
      } catch {
        // skip individual list failures
      }
    }
    return results;
  } catch (err) {
    if (isRevoked(err)) {
      await deleteConnection(userId).catch(() => {});
      return [];
    }
    console.error('listGoogleTasks:', err?.message);
    return [];
  }
}

// ── Export: NEUPC feed item → Google Calendar event ────────────────────────────

function fmtDuration(min) {
  if (!min || min <= 0) return null;
  const h = Math.floor(min / 60), m = min % 60;
  return `${h > 0 ? `${h}h` : ''}${h > 0 && m > 0 ? ' ' : ''}${m > 0 ? `${m}m` : ''}`;
}

/** Build a Google Calendar event body from a raw Daily Activity feed item. */
function feedItemToEvent(item) {
  const start = new Date(item.start);
  if (Number.isNaN(start.getTime())) return null;

  // Colour to match expand mode: a colour resolved client-side from the
  // expand-modal settings wins, then a per-item colorId, then the category
  // layer default — all mapped to the nearest Google colorId.
  const colorId = item.overrideColor
    ? hexToColorId(item.overrideColor)
    : item.colorId
      ? hexToColorId(GCAL_COLOR_MAP[item.colorId]) || item.colorId
      : hexToColorId(CATEGORY_COLOR[item.category]);
  const marker = { [FEED_MARKER]: String(item.id) };

  // Helper: end ISO — use explicit endTime if valid, else start + fallbackMin.
  function endISO(fallbackMin) {
    if (item.endTime) {
      const e = new Date(item.endTime);
      if (!Number.isNaN(e.getTime()) && e > start) return e.toISOString();
    }
    return new Date(start.getTime() + fallbackMin * 60000).toISOString();
  }

  // ── Session: timed event occupying the full scheduled duration ──
  if (item.category === 'session') {
    const desc = [
      item.description,
      item.bootcampTitle && `Bootcamp: ${item.bootcampTitle}`,
      fmtDuration(item.durationMin) && `Duration: ${fmtDuration(item.durationMin)}`,
      item.url && `Join: ${item.url}`,
      item.recordingUrl && `Recording: ${item.recordingUrl}`,
      item.status && item.status !== 'scheduled' && `Status: ${item.status}`,
    ].filter(Boolean).join('\n');

    return {
      summary: item.title,
      description: desc || undefined,
      location: item.url || item.location || undefined,
      start: { dateTime: start.toISOString() },
      end:   { dateTime: endISO(60) },
      source: item.url ? { title: 'Join Session', url: item.url } : undefined,
      colorId,
      extendedProperties: { private: marker },
    };
  }

  // ── NEUPC Event: always timed (start_date is timestamptz) ──
  if (item.category === 'event') {
    const desc = [
      item.description,
      item.eventCategory && `Category: ${item.eventCategory}`,
      fmtDuration(item.durationMin) && `Duration: ${fmtDuration(item.durationMin)}`,
      item.location && `Location: ${item.location}`,
      item.url && `Info: ${item.url}`,
      item.status && `Status: ${item.status}`,
    ].filter(Boolean).join('\n');

    // Always a timed event. A multi-day event is pushed as a multi-day *timed*
    // event so Google slices it per day in day/week view exactly like the expand
    // calendar (available time → midnight, full middle days, midnight → end time)
    // instead of showing a flat all-day banner.
    return {
      summary: item.title,
      description: desc || undefined,
      location: item.location || undefined,
      start: { dateTime: start.toISOString() },
      end:   { dateTime: endISO(60) },
      source: item.url ? { title: 'NEUPC Event', url: item.url } : undefined,
      colorId,
      extendedProperties: { private: marker },
    };
  }

  // ── Contest: timed event occupying the contest window ──
  if (item.category === 'contest') {
    const desc = [
      item.description,
      item.location && `Platform: ${item.location}`,
      fmtDuration(item.durationMin) && `Duration: ${fmtDuration(item.durationMin)}`,
      item.url && `Link: ${item.url}`,
    ].filter(Boolean).join('\n');

    return {
      summary: item.title,
      description: desc || undefined,
      location: item.location || undefined,
      start: { dateTime: start.toISOString() },
      end:   { dateTime: endISO(60) },
      source: item.url ? { title: 'Contest Link', url: item.url } : undefined,
      colorId,
      extendedProperties: { private: marker },
    };
  }

  // ── Bootcamp task: timed event spanning available → deadline, like expand ──
  // The expand calendar draws a task as a timed block from its available time to
  // its deadline time; in day view a multi-day task is sliced per day (available
  // time → midnight, full middle days, midnight → deadline time). Pushing a
  // multi-day *timed* event makes Google slice it the same way — so we never use
  // an all-day banner here.
  if (item.category === 'task') {
    const desc = [
      item.description,
      item.bootcampTitle && `Bootcamp: ${item.bootcampTitle}`,
      item.taskType && `Type: ${item.taskType}`,
      item.difficulty && `Difficulty: ${item.difficulty}`,
      typeof item.points === 'number' && `Points: ${item.points}`,
      item.submissionStatus && item.submissionStatus !== 'pending' && `Status: ${item.submissionStatus}`,
    ].filter(Boolean).join('\n');

    return {
      summary: item.title,
      description: desc || undefined,
      start: { dateTime: start.toISOString() },
      end:   { dateTime: endISO(60) },
      colorId,
      transparency: 'transparent',
      extendedProperties: { private: marker },
    };
  }

  // ── Fallback ──
  return {
    summary: item.title,
    description: item.description || undefined,
    location: item.location || undefined,
    start: { dateTime: start.toISOString() },
    end:   { dateTime: endISO(30) },
    source: item.url ? { title: 'NEUPC', url: item.url } : undefined,
    colorId,
    extendedProperties: { private: marker },
  };
}

/**
 * Mirror a read-only feed item (event/session/contest/deadline) to the member's
 * calendar. These have no stored event id, so this upserts by searching for the
 * `FEED_MARKER` carrying the item's NEUPC id: update the match, else insert.
 * Best-effort — returns true on success, false otherwise.
 *
 * @param {string} userId
 * @param {object} item  - Daily Activity feed item (incl. `id`, `start`).
 * @returns {Promise<boolean>}
 */
export async function pushFeedItem(userId, item) {
  const client = await getCalendarClient(userId);
  if (!client) return false;

  // A multi-day task/event is split into one timed sub-event per day so Google
  // draws each in the time grid (it parks multi-day events in the all-day strip).
  // Only `task`/`event` span days in the expand calendar; contests & sessions are
  // single-block (never sliced), even if they cross midnight — matching expand.
  // Dedup is marker-based: clear this feed item's prior events, then insert the
  // fresh slice set — idempotent, never duplicates.
  const body = feedItemToEvent(item);
  if (!body) return false;
  const bodies = (item.category === 'task' || item.category === 'event')
    ? explodeToSlices(body)
    : [body];

  try {
    await deleteEventsByMarker(client, item.id).catch(() => {});
    await supabaseAdmin.from('feed_gcal_events').delete().eq('user_id', userId).eq('feed_id', item.id);
    for (const slice of bodies) {
      await client.calendar.events.insert({ calendarId: client.calendarId, requestBody: slice });
    }
    return true;
  } catch (err) {
    if (isRevoked(err)) { await deleteConnection(userId).catch(() => {}); return false; }
    console.error('pushFeedItem:', err?.message);
    return false;
  }
}

/**
 * Delete every event on the calendar carrying `FEED_MARKER=markerId`.
 * Paginates so all of a task's gap-events are removed. Best-effort.
 */
async function deleteEventsByMarker(client, markerId) {
  let pageToken;
  do {
    const { data } = await client.calendar.events.list({
      calendarId: client.calendarId,
      privateExtendedProperty: `${FEED_MARKER}=${markerId}`,
      maxResults: 250,
      showDeleted: false,
      pageToken,
    });
    for (const ev of data.items || []) {
      await client.calendar.events.delete({ calendarId: client.calendarId, eventId: ev.id }).catch(() => {});
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
}

/** Delete every event carrying `PERSONAL_MARKER=personalId` (incl. all slices). */
async function deletePersonalMarkerEvents(client, personalId) {
  let pageToken;
  do {
    const { data } = await client.calendar.events.list({
      calendarId: client.calendarId,
      privateExtendedProperty: `${PERSONAL_MARKER}=${personalId}`,
      maxResults: 250,
      showDeleted: false,
      pageToken,
    });
    for (const ev of data.items || []) {
      await client.calendar.events.delete({ calendarId: client.calendarId, eventId: ev.id }).catch(() => {});
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
}

/** Delete a mirrored event. Best-effort; missing events are ignored. */
export async function deleteTodoEvent(userId, gcalEventId) {
  if (!gcalEventId) return;
  const client = await getCalendarClient(userId);
  if (!client) return;
  try {
    await client.calendar.events.delete({
      calendarId: client.calendarId,
      eventId: gcalEventId,
    });
  } catch (err) {
    if (err?.code === 404 || err?.code === 410) return; // already gone
    if (isRevoked(err)) {
      await deleteConnection(userId).catch(() => {});
      return;
    }
    console.error('deleteTodoEvent:', err?.message);
  }
}

// ── Export: NEUPC task → Google Tasks (the checkbox to-do list) ─────────────────

/**
 * Google Tasks `due` is an RFC 3339 timestamp but Google only keeps the date
 * part (tasks are all-day). Emit midnight UTC for the task's date.
 */
function taskDue(dateKey) {
  if (!dateKey) return undefined;
  return `${dateKey}T00:00:00.000Z`;
}

// Priority: DB stores numeric 1-4 OR string 'high'/'medium'/'low'.
// Normalise to a display label and to a Google Calendar colorId.
function normalisePriority(priority) {
  if (priority === 1 || priority === 'high')   return { label: 'High',   colorId: '1'  }; // Tomato (red)
  if (priority === 2 || priority === 'medium') return { label: 'Medium', colorId: '5'  }; // Banana (yellow)
  if (priority === 3 || priority === 'low')    return { label: 'Low',    colorId: '7'  }; // Peacock (blue)
  // 4 / anything else → no priority label, default Google color
  return { label: null, colorId: null };
}

/**
 * Build the Google Task `notes` body from a todo's rich fields. Google Tasks
 * has only a free-text notes field (no time, priority, or labels of its own),
 * so we fold the extra info into it under a stable, re-generatable layout:
 *
 *   <description>
 *
 *   Priority: High   ·   Labels: @study, @dsa   ·   Time: 14:00
 *
 * Subtasks are NOT folded in here — they are mirrored as real Google child-tasks
 * (see syncChildSubtasks), so listing them in notes would duplicate them.
 */
function buildTaskNotes(todo) {
  const lines = [];

  const desc = (todo.notes || todo.description || '').trim();
  if (desc) lines.push(desc);

  const meta = [];
  const { label: priorityLabel } = normalisePriority(todo.priority);
  if (priorityLabel) meta.push(`Priority: ${priorityLabel}`);
  if (todo.time) meta.push(`Time: ${todo.time}`);
  if (Array.isArray(todo.labels) && todo.labels.length) {
    meta.push(`Labels: ${todo.labels.map((l) => `@${l}`).join(', ')}`);
  }
  if (todo.recurrence?.freq) {
    meta.push(`Repeats: ${{ daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }[todo.recurrence.freq] || todo.recurrence.freq}`);
  }
  if (meta.length) {
    if (lines.length) lines.push('');
    lines.push(meta.join(' · '));
  }

  // Subtasks are mirrored as real Google child-tasks (see syncChildSubtasks), so
  // we deliberately do NOT also list them here — that would duplicate them.

  return lines.join('\n').trim() || undefined;
}

// Marker stored on todo calendar events so pull never re-imports them as personal events.
const TODO_CAL_MARKER = 'neupcTodoCalId';

/**
 * Push a NEUPC todo to Google Calendar as an all-day event with priority colour,
 * in addition to the Google Tasks push. This is what makes todos appear visually
 * on the Google Calendar grid with the right colour. Upserts by `gcal_event_id`.
 *
 * @param {string} userId
 * @param {object} todo  - { id, title, notes|description, priority, labels, time, startKey, gcalEventId, completed }
 * @param {object} [opts]
 * @param {boolean} [opts.force=false]
 * @returns {Promise<string|null>}  The Google Calendar event id to persist, or null.
 */
export async function pushTodoCalendarEvent(userId, todo, { force = false } = {}) {
  const client = await getCalendarClient(userId);
  if (!client) return null;
  if (!force && !client.syncEnabled) return null;
  if (!todo.startKey) return null;

  // Colour to match expand mode: a colour resolved client-side from the
  // expand-modal settings wins, then a per-item colorId, then the project
  // colour, then the todo layer default — mapped to the nearest Google colorId.
  const colorId = todo.overrideColor
    ? hexToColorId(todo.overrideColor)
    : todo.colorId
      ? hexToColorId(GCAL_COLOR_MAP[todo.colorId]) || todo.colorId
      : hexToColorId(todo.projectColor || CATEGORY_COLOR.todo);

  const descLines = [];
  const { label: priorityLabel } = normalisePriority(todo.priority);
  if (priorityLabel) descLines.push(`Priority: ${priorityLabel}`);
  if (todo.time) descLines.push(`Time: ${todo.time}`);
  if (Array.isArray(todo.labels) && todo.labels.length) {
    descLines.push(`Labels: ${todo.labels.map((l) => `@${l}`).join(', ')}`);
  }
  if (todo.notes || todo.description) descLines.push((todo.notes || todo.description).trim());
  if (Array.isArray(todo.subtasks) && todo.subtasks.length) {
    descLines.push('Subtasks:');
    for (const s of todo.subtasks) {
      descLines.push(`  ${s.completed ? '☑' : '☐'} ${s.title || ''}`);
    }
  }

  const startDate = todo.startKey; // YYYY-MM-DD
  let startObj, endObj;

  // Parse todo.time which may be:
  //   "HH:MM"             — start only, 1h default duration
  //   "HH:MM - HH:MM"     — explicit start–end range (stored by TaskDetailPane)
  //   "HH:MM:SS"          — postgres time with seconds, trim to HH:MM
  //   "H:MM AM/PM"        — legacy 12h
  function parseHHMM(raw) {
    if (!raw) return null;
    const t = String(raw).trim();
    const ampm = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
    if (ampm) {
      let h = parseInt(ampm[1], 10);
      const m = ampm[2];
      const ap = ampm[3].toUpperCase();
      if (ap === 'PM' && h !== 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${m}`;
    }
    const hm = t.match(/^(\d{1,2}:\d{2})/);
    return hm ? hm[1].padStart(5, '0') : null;
  }

  if (todo.time) {
    const raw = String(todo.time).trim();
    let startHHMM, endHHMM;

    if (raw.includes(' - ')) {
      const [a, b] = raw.split(' - ');
      startHHMM = parseHHMM(a);
      endHHMM   = parseHHMM(b);
    } else {
      startHHMM = parseHHMM(raw);
    }

    if (startHHMM) {
      // Stored todo times are Dhaka wall-clock; pin the offset so Google accepts
      // the datetime and places it at the correct local time (a floating, offset-
      // less datetime is parsed in the server's tz and may be rejected).
      const startISO = `${startDate}T${startHHMM}:00+06:00`;
      const startMs  = new Date(startISO).getTime();
      if (!Number.isNaN(startMs)) {
        startObj = { dateTime: startISO };
        if (endHHMM) {
          const endISO = `${startDate}T${endHHMM}:00+06:00`;
          const endMs  = new Date(endISO).getTime();
          // End must be after start; if not (e.g. crosses midnight) add 1 day.
          endObj = { dateTime: endMs > startMs ? endISO : new Date(startMs + 60 * 60000).toISOString() };
        } else {
          endObj = { dateTime: new Date(startMs + 60 * 60000).toISOString() };
        }
      }
    }
  }

  if (!startObj) {
    // No valid time — expand mode draws an untimed todo as an 8 AM–10 PM block
    // in the time grid, so push a matching timed event (not an all-day one).
    startObj = { dateTime: `${startDate}T08:00:00+06:00` };
    endObj   = { dateTime: `${startDate}T22:00:00+06:00` };
  }

  const body = {
    summary: todo.title || '(untitled)',
    description: descLines.join('\n').trim() || undefined,
    start: startObj,
    end: endObj,
    colorId: colorId || undefined,
    transparency: 'transparent', // "free" — doesn't block time
    extendedProperties: { private: { [TODO_CAL_MARKER]: String(todo.id) } },
  };

  try {
    let eventData;
    if (todo.gcalEventId) {
      try {
        const { data } = await client.calendar.events.update({
          calendarId: client.calendarId,
          eventId: todo.gcalEventId,
          requestBody: { ...body, id: todo.gcalEventId },
        });
        eventData = data;
      } catch (err) {
        if (err?.code !== 404 && err?.code !== 410) throw err;
        const { data } = await client.calendar.events.insert({ calendarId: client.calendarId, requestBody: body });
        eventData = data;
      }
    } else {
      // No stored event id — search by TODO_CAL_MARKER to avoid duplicating when
      // a previous push succeeded but the gcal_event_id write-back to DB failed.
      let existingId = null;
      try {
        const { data: found } = await client.calendar.events.list({
          calendarId: client.calendarId,
          privateExtendedProperty: `${TODO_CAL_MARKER}=${todo.id}`,
          maxResults: 10,
          showDeleted: false,
        });
        const matches = found.items || [];
        if (matches.length > 0) {
          existingId = matches[0].id;
          for (const dup of matches.slice(1)) {
            await client.calendar.events.delete({ calendarId: client.calendarId, eventId: dup.id }).catch(() => {});
          }
        }
      } catch { /* search not critical */ }

      if (existingId) {
        const { data } = await client.calendar.events.update({
          calendarId: client.calendarId,
          eventId: existingId,
          requestBody: { ...body, id: existingId },
        });
        eventData = data;
      } else {
        const { data } = await client.calendar.events.insert({ calendarId: client.calendarId, requestBody: body });
        eventData = data;
      }
    }
    return eventData?.id || null;
  } catch (err) {
    if (isRevoked(err)) { await deleteConnection(userId).catch(() => {}); return null; }
    console.error('pushTodoCalendarEvent:', err?.message);
    return null;
  }
}

/**
 * Mirror a NEUPC todo to the member's Google Tasks list (the checkbox to-dos in
 * the Google Tasks app / Calendar side panel). Inserts a new task or updates the
 * linked one when `todo.gtaskId` is set. A recurring todo maps to a single task
 * due on `todo.startKey` (caller passes the next occurrence). Rich fields
 * (description, priority, labels, time, subtask checklist) are folded into the
 * task notes via {@link buildTaskNotes}. `completed` sets the done state.
 *
 * Note: todos are intentionally pushed to Google **Tasks only** (never a
 * Calendar event), so a to-do is never duplicated and no time-of-day event is
 * created — matching the product decision that todos have no calendar time.
 *
 * @param {string} userId
 * @param {object} todo  - { id, title, notes|description, priority, labels,
 *                           time, subtasks, startKey, gtaskId, completed }
 * @param {object} [opts]
 * @param {boolean} [opts.force=false]  - Push even when auto-mirror is off.
 * @returns {Promise<string|null>}  The parent task id to persist, or null.
 */
export async function pushTodoTask(userId, todo, { force = false } = {}) {
  const client = await getCalendarClient(userId);
  if (!client) return null;
  if (!force && !client.syncEnabled) return null;

  const body = {
    title: todo.title || '(untitled)',
    notes: buildTaskNotes(todo),
    due: taskDue(todo.startKey),
    status: todo.completed ? 'completed' : 'needsAction',
  };
  // Clearing completion requires explicitly nulling `completed`.
  if (!todo.completed) body.completed = null;

  // A stable marker we embed in the notes field to identify NEUPC-owned tasks.
  // Format: "neupcId:<uuid>" on its own line at the very end.
  const ID_TAG = `neupcId:${todo.id}`;
  const notesWithTag = body.notes ? `${body.notes}\n${ID_TAG}` : ID_TAG;
  body.notes = notesWithTag;

  try {
    let parentId;
    if (todo.gtaskId) {
      const { data } = await client.tasks.tasks.update({
        tasklist: '@default',
        task: todo.gtaskId,
        requestBody: { id: todo.gtaskId, ...body },
      });
      parentId = data.id || todo.gtaskId;
    } else {
      // No stored task id — scan @default tasklist for a task whose notes contain
      // our ID_TAG to avoid duplicating when a previous push's write-back failed.
      let existingTaskId = null;
      try {
        const { data: listData } = await client.tasks.tasks.list({
          tasklist: '@default',
          showCompleted: true,
          showDeleted: false,
          showHidden: true,
          maxResults: 100,
        });
        for (const t of listData.items || []) {
          if (t.notes?.includes(ID_TAG)) {
            existingTaskId = t.id;
            break;
          }
        }
      } catch { /* scan not critical */ }

      if (existingTaskId) {
        const { data } = await client.tasks.tasks.update({
          tasklist: '@default',
          task: existingTaskId,
          requestBody: { id: existingTaskId, ...body },
        });
        parentId = data.id || existingTaskId;
      } else {
        const { data } = await client.tasks.tasks.insert({
          tasklist: '@default',
          requestBody: body,
        });
        parentId = data.id || null;
      }
    }
    return parentId;
  } catch (err) {
    // Stale id (task deleted in Google) → recreate once.
    if ((err?.code === 404 || err?.code === 410) && todo.gtaskId) {
      return pushTodoTask(userId, { ...todo, gtaskId: null }, { force });
    }
    if (isRevoked(err)) {
      await deleteConnection(userId).catch(() => {});
      return null;
    }
    console.error('pushTodoTask:', err?.message);
    return null;
  }
}

/**
 * Create/update/delete real Google child-tasks for a todo's subtasks, nested
 * under the parent task. Keeps a `{ neupcSubtaskId: googleTaskId }` map so the
 * same child is reused across syncs (no duplicates) and removed subtasks are
 * deleted from Google. Best-effort; returns the updated id map to persist.
 *
 * @param {string} userId
 * @param {string} parentTaskId  - The parent Google Task id.
 * @param {{id:string,title:string,completed:boolean}[]} subtasks
 * @param {Record<string,string>} [existingMap]  - Prior id map.
 * @returns {Promise<Record<string,string>>}
 */
export async function syncChildSubtasks(userId, parentTaskId, subtasks = [], existingMap = {}) {
  const client = await getCalendarClient(userId);
  if (!client || !parentTaskId) return existingMap;

  const map = { ...(existingMap || {}) };
  const liveIds = new Set();

  try {
    // Process in order, threading each child after the previous sibling so the
    // Google order matches NEUPC. (Google inserts a parentless/`previous`-less
    // child at the TOP of the list, which would otherwise reverse the order.)
    let prevGid = null;
    for (const s of subtasks) {
      if (!s || !s.id) continue;
      liveIds.add(s.id);
      const childBody = {
        title: s.title || '(subtask)',
        notes: s.details || '',
        status: s.completed ? 'completed' : 'needsAction',
      };
      if (!s.completed) childBody.completed = null;

      let gid = map[s.id] || null;
      if (gid) {
        try {
          await client.tasks.tasks.update({
            tasklist: '@default',
            task: gid,
            requestBody: { id: gid, ...childBody },
          });
        } catch (err) {
          if (err?.code !== 404 && err?.code !== 410) throw err;
          gid = null; // task gone in Google → recreate below
          delete map[s.id];
        }
      }

      if (gid) {
        // Keep it nested under the (possibly recreated) parent and in order.
        try {
          await client.tasks.tasks.move({
            tasklist: '@default',
            task: gid,
            parent: parentTaskId,
            previous: prevGid || undefined,
          });
        } catch (err) {
          if (err?.code !== 404 && err?.code !== 410) {
            console.error('syncChildSubtasks (move):', err?.message);
          }
        }
      } else {
        const { data } = await client.tasks.tasks.insert({
          tasklist: '@default',
          parent: parentTaskId,
          previous: prevGid || undefined,
          requestBody: childBody,
        });
        gid = data?.id || null;
        if (gid) map[s.id] = gid;
      }

      if (gid) prevGid = gid;
    }

    // Remove children whose NEUPC subtask no longer exists.
    for (const [subId, gid] of Object.entries(map)) {
      if (!liveIds.has(subId)) {
        try {
          await client.tasks.tasks.delete({ tasklist: '@default', task: gid });
        } catch (err) {
          if (err?.code !== 404 && err?.code !== 410) {
            console.error('syncChildSubtasks (delete):', err?.message);
          }
        }
        delete map[subId];
      }
    }
  } catch (err) {
    if (isRevoked(err)) {
      await deleteConnection(userId).catch(() => {});
      return existingMap;
    }
    console.error('syncChildSubtasks:', err?.message);
  }
  return map;
}

/**
 * Map of every `@default` Google Task id → done-state (boolean), including
 * completed/hidden tasks and child subtasks. One paged list call, used by the
 * two-way pull to read both parent and subtask completion at once.
 *
 * @returns {Promise<Map<string,boolean>|null>}  null on failure/not-connected.
 */
export async function readDefaultTaskStatuses(userId) {
  const client = await getCalendarClient(userId);
  if (!client) return null;
  try {
    const map = new Map();
    let pageToken;
    do {
      const { data } = await client.tasks.tasks.list({
        tasklist: '@default',
        showCompleted: true,
        showHidden: true,
        showDeleted: false,
        maxResults: 100,
        pageToken,
      });
      for (const t of data.items || []) map.set(t.id, t.status === 'completed');
      pageToken = data.nextPageToken;
    } while (pageToken);
    return map;
  } catch (err) {
    if (isRevoked(err)) { await deleteConnection(userId).catch(() => {}); return null; }
    console.error('readDefaultTaskStatuses:', err?.message);
    return null;
  }
}

/**
 * Flip the done state of an already-mirrored Google Task. Best-effort no-op when
 * the todo was never pushed (no `gtaskId`) or sync isn't available.
 *
 * @param {string} userId
 * @param {string} gtaskId
 * @param {boolean} completed
 */
export async function setTodoTaskCompleted(userId, gtaskId, completed) {
  if (!gtaskId) return;
  const client = await getCalendarClient(userId);
  if (!client) return;
  try {
    await client.tasks.tasks.patch({
      tasklist: '@default',
      task: gtaskId,
      requestBody: completed
        ? { status: 'completed' }
        : { status: 'needsAction', completed: null },
    });
  } catch (err) {
    if (err?.code === 404 || err?.code === 410) return; // already gone
    if (isRevoked(err)) {
      await deleteConnection(userId).catch(() => {});
      return;
    }
    console.error('setTodoTaskCompleted:', err?.message);
  }
}

/** Delete a mirrored Google Task. Best-effort; missing tasks are ignored. */
export async function deleteTodoTask(userId, gtaskId) {
  if (!gtaskId) return;
  const client = await getCalendarClient(userId);
  if (!client) return;
  try {
    await client.tasks.tasks.delete({ tasklist: '@default', task: gtaskId });
  } catch (err) {
    if (err?.code === 404 || err?.code === 410) return; // already gone
    if (isRevoked(err)) {
      await deleteConnection(userId).catch(() => {});
      return;
    }
    console.error('deleteTodoTask:', err?.message);
  }
}

// ── Personal Calendar Events ──────────────────────────────────────────────────

/**
 * Upsert a personal_event to the member's Google Calendar. If `row.gcal_event_id`
 * is set, update; otherwise insert. Returns the Google event id to persist.
 *
 * @param {string} userId
 * @param {object} row  - personal_events row.
 * @returns {Promise<string|null>}
 */
export async function pushPersonalEvent(userId, row, { overrideColor = null } = {}) {
  const client = await getCalendarClient(userId);
  if (!client) return null;

  const allDay = !row.start_time;

  // End date: for multi-day all-day events Google expects end = day after last day.
  const endDateStr = row.end_date || row.event_date;

  let startObj, endObj;
  if (allDay) {
    // Google all-day end is exclusive — add 1 day.
    const endExclusive = new Date(endDateStr + 'T00:00:00');
    endExclusive.setDate(endExclusive.getDate() + 1);
    const pad = (n) => String(n).padStart(2, '0');
    const endStr = `${endExclusive.getFullYear()}-${pad(endExclusive.getMonth() + 1)}-${pad(endExclusive.getDate())}`;
    startObj = { date: row.event_date };
    endObj = { date: endStr };
  } else {
    const endDate = row.end_date || row.event_date;
    // start_time/end_time are Dhaka wall-clock — pin the offset so Google accepts
    // and places the event correctly (a floating datetime can be rejected).
    const startISO = `${row.event_date}T${row.start_time}:00+06:00`;
    let endISO;
    if (row.end_time) {
      endISO = `${endDate}T${row.end_time}:00+06:00`;
    } else {
      // No end time set — default to start + 1 hour so it occupies the timetable.
      endISO = new Date(new Date(startISO).getTime() + 60 * 60000).toISOString();
    }
    startObj = { dateTime: startISO };
    endObj   = { dateTime: endISO };
  }

  // Build reminders
  const remindersArr = Array.isArray(row.reminders) && row.reminders.length
    ? { useDefault: false, overrides: row.reminders.map((r) => ({ method: r.method, minutes: r.minutes })) }
    : { useDefault: true };

  // Build attendees
  const attendeesArr = Array.isArray(row.attendees)
    ? row.attendees.map((a) => ({ email: a.email, displayName: a.name || undefined, optional: a.optional || false }))
    : [];

  const body = {
    summary: row.title,
    description: row.description || undefined,
    location: row.location || undefined,
    source: row.url ? { title: row.title, url: row.url } : undefined,
    start: startObj,
    end: endObj,
    colorId: overrideColor ? hexToColorId(overrideColor) : (row.color_id || hexToColorId(CATEGORY_COLOR.personal)),
    status: row.status || 'confirmed',
    visibility: row.visibility !== 'default' ? row.visibility : undefined,
    guestsCanSeeOtherGuests: row.guests_can_see_other_guests ?? true,
    reminders: remindersArr,
    attendees: attendeesArr.length ? attendeesArr : undefined,
    recurrence: row.recurrence ? [`RRULE:${row.recurrence}`] : undefined,
    extendedProperties: { private: { [PERSONAL_MARKER]: row.id } },
  };

  // A multi-day *timed* event is sliced into one sub-event per day so Google
  // draws each in the time grid like the expand day view (it banners multi-day
  // events otherwise). All-day, single-day, and recurring events stay one event.
  const multiDayTimed = !allDay && !row.recurrence
    && dhakaDate(startObj.dateTime) !== dhakaDate(endObj.dateTime);

  try {
    // ── Multi-day timed → per-day slices via full replace ──
    // Several Google events, so we can't keep a single id: clear the prior mirror
    // (marked slices) and the stored event id, then insert the fresh slice set.
    if (multiDayTimed) {
      await deletePersonalMarkerEvents(client, row.id).catch(() => {});
      if (row.gcal_event_id) {
        await client.calendar.events.delete({ calendarId: client.calendarId, eventId: row.gcal_event_id }).catch(() => {});
      }
      const slices = sliceTimedRange(startObj.dateTime, endObj.dateTime).map((s) => ({ ...body, ...s }));
      let firstId = null;
      for (const b of slices) {
        const { data } = await client.calendar.events.insert({ calendarId: client.calendarId, requestBody: b });
        if (!firstId) firstId = data.id;
      }
      return { eventId: firstId, conferenceLink: null };
    }

    // ── Single event → update in place ──
    // Updating preserves an imported Google event's identity (no duplicate) and
    // tags it with our marker so future pulls skip it. Falls back to a marker
    // search (recovers from a failed write-back), else inserts.
    let keptId = row.gcal_event_id || null;
    let eventData;
    if (keptId) {
      try {
        const { data } = await client.calendar.events.update({ calendarId: client.calendarId, eventId: keptId, requestBody: { ...body, id: keptId } });
        eventData = data;
      } catch (err) {
        if (err?.code !== 404 && err?.code !== 410) throw err;
        keptId = null;
      }
    }
    if (!eventData) {
      let existingId = null;
      try {
        const { data: found } = await client.calendar.events.list({
          calendarId: client.calendarId,
          privateExtendedProperty: `${PERSONAL_MARKER}=${row.id}`,
          maxResults: 25, showDeleted: false,
        });
        existingId = (found.items || [])[0]?.id || null;
      } catch { /* search not critical */ }
      if (existingId) {
        const { data } = await client.calendar.events.update({ calendarId: client.calendarId, eventId: existingId, requestBody: { ...body, id: existingId } });
        eventData = data; keptId = existingId;
      } else {
        const { data } = await client.calendar.events.insert({ calendarId: client.calendarId, requestBody: body });
        eventData = data; keptId = data.id;
      }
    }

    // Remove leftover marker events other than the one we kept — covers a
    // multi-day(sliced) → single-day transition that would otherwise orphan slices.
    try {
      const { data: found } = await client.calendar.events.list({
        calendarId: client.calendarId,
        privateExtendedProperty: `${PERSONAL_MARKER}=${row.id}`,
        maxResults: 50, showDeleted: false,
      });
      for (const ev of found.items || []) {
        if (ev.id !== keptId) await client.calendar.events.delete({ calendarId: client.calendarId, eventId: ev.id }).catch(() => {});
      }
    } catch { /* cleanup best-effort */ }

    return {
      eventId: eventData.id || null,
      conferenceLink: eventData.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri || null,
    };
  } catch (err) {
    if (isRevoked(err)) { await deleteConnection(userId).catch(() => {}); return null; }
    console.error('pushPersonalEvent:', err?.message);
    return null;
  }
}

/**
 * Delete a personal event's Google mirror. Best-effort. When `personalId` is
 * given, removes *every* slice carrying its marker (multi-day events are sliced
 * into several Google events); otherwise deletes the single stored event id.
 */
export async function deletePersonalEvent(userId, gcalEventId, { personalId = null } = {}) {
  const client = await getCalendarClient(userId);
  if (!client) return;
  try {
    if (personalId) {
      await deletePersonalMarkerEvents(client, personalId);
      return;
    }
    if (!gcalEventId) return;
    await client.calendar.events.delete({ calendarId: client.calendarId, eventId: gcalEventId });
  } catch (err) {
    if (err?.code === 404 || err?.code === 410) return;
    if (isRevoked(err)) { await deleteConnection(userId).catch(() => {}); return; }
    console.error('deletePersonalEvent:', err?.message);
  }
}

/**
 * Fetch Google Calendar events owned by the user that don't have a NEUPC marker
 * (i.e. created directly in Google, not pushed from NEUPC) within the given range.
 * Returns raw event objects for the caller to import.
 *
 * @returns {Promise<object[]>}
 */
export async function pullPersonalEventsFromGoogle(userId, timeMinISO, timeMaxISO) {
  const client = await getCalendarClient(userId);
  if (!client) return [];

  try {
    const { data: calList } = await client.calendar.calendarList.list({ minAccessRole: 'owner' });
    const ownedIds = (calList.items || []).map((c) => c.id);
    if (!ownedIds.includes('primary')) ownedIds.unshift('primary');

    const seen = new Set();
    const results = [];
    for (const calId of ownedIds) {
      try {
        const { data } = await client.calendar.events.list({
          calendarId: calId,
          timeMin: timeMinISO,
          timeMax: timeMaxISO,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 250,
        });
        for (const ev of data.items || []) {
          if (seen.has(ev.id)) continue;
          seen.add(ev.id);
          if (ev.status === 'cancelled') continue;
          // Skip anything NEUPC already owns.
          const priv = ev.extendedProperties?.private || {};
          if (priv[FEED_MARKER] || priv[PERSONAL_MARKER] || priv[TODO_MARKER] || priv[TODO_CAL_MARKER]) continue;

          // Normalise to Dhaka-local fields so imported times/dates match what the
          // member sees (Google returns dateTime in the calendar's own tz/offset).
          const allDay = !ev.start?.dateTime;
          let eventDate, endDate = null, startTime = null, endTime = null;
          if (allDay) {
            if (!ev.start?.date) continue;
            eventDate = ev.start.date;
            // Google all-day end is exclusive → last day = end.date − 1.
            const lastDay = ev.end?.date ? prevDhakaDate(ev.end.date) : eventDate;
            endDate = lastDay > eventDate ? lastDay : null;
          } else {
            eventDate = dhakaDate(ev.start.dateTime);
            startTime = dhakaTime(ev.start.dateTime).slice(0, 5);
            if (ev.end?.dateTime) {
              endTime = dhakaTime(ev.end.dateTime).slice(0, 5);
              const ed = dhakaDate(ev.end.dateTime);
              endDate = ed && ed > eventDate ? ed : null;
            }
          }
          if (!eventDate) continue;

          results.push({
            id: ev.id,
            title: ev.summary || '(no title)',
            description: ev.description ? ev.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || null : null,
            location: ev.location || null,
            allDay,
            eventDate,
            endDate,
            startTime,
            endTime,
          });
        }
      } catch { /* skip */ }
    }
    return results;
  } catch (err) {
    if (isRevoked(err)) { await deleteConnection(userId).catch(() => {}); return []; }
    console.error('pullPersonalEventsFromGoogle:', err?.message);
    return [];
  }
}
