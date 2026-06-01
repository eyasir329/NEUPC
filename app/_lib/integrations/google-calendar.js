/**
 * @file Per-member Google Calendar integration for the Daily Activity page.
 * @module google-calendar
 *
 * Opt-in, two-way: a member connects their Google account (separate OAuth flow,
 * reusing the AUTH_GOOGLE_* client), we store their refresh token, then we can
 *   • read  — list their calendar events to overlay on the activity calendar, and
 *   • write — mirror their NEUPC tasks back as Google Calendar events.
 *
 * Required env vars (the OAuth client is shared with NextAuth sign-in):
 *   AUTH_GOOGLE_ID            – OAuth2 client ID
 *   AUTH_GOOGLE_SECRET        – OAuth2 client secret
 *   NEXTAUTH_URL              – app origin; the callback redirect URI is derived
 *                              from it (must be registered on the OAuth client)
 *   GOOGLE_CALENDAR_TIMEZONE  – IANA tz for timed task events (default Asia/Dhaka)
 *
 * Google Cloud setup (one-time):
 *   1. Enable the Google Calendar API.
 *   2. Add `${NEXTAUTH_URL}/api/integrations/google-calendar/callback` as an
 *      Authorised redirect URI on the OAuth client.
 *   3. Add the calendar.events + userinfo.email scopes on the consent screen.
 */

import { google } from 'googleapis';
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';

export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
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
const DEFAULT_EVENT_MINUTES = 60;
const TIMEZONE = process.env.GOOGLE_CALENDAR_TIMEZONE || 'Asia/Dhaka';

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
async function getCalendarClient(userId) {
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
    const { data } = await client.calendar.events.list({
      calendarId: client.calendarId,
      timeMin: timeMinISO,
      timeMax: timeMaxISO,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    });

    return (data.items || [])
      .filter((ev) => ev.status !== 'cancelled')
      .filter(
        (ev) =>
          !ev.extendedProperties?.private?.[TODO_MARKER] &&
          !ev.extendedProperties?.private?.[FEED_MARKER]
      )
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
    start: start.toISOString(),
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

// ── Export: NEUPC task → Google Calendar event ─────────────────────────────────

/** Add `minutes` to a YYYY-MM-DD + HH:MM wall-clock pair (handles day rollover). */
function addMinutesToWallClock(dateKey, time, minutes) {
  const [y, mo, d] = dateKey.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d, h, mi));
  dt.setUTCMinutes(dt.getUTCMinutes() + minutes);
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`,
    time: `${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}`,
  };
}

function addOneDay(dateKey) {
  const [y, mo, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d + 1));
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** Translate our recurrence model into an iCalendar RRULE string array. */
function buildRecurrence(rec, allDay) {
  if (!rec) return undefined;
  const FREQ = { daily: 'DAILY', weekly: 'WEEKLY', monthly: 'MONTHLY' }[rec.freq];
  if (!FREQ) return undefined;

  const parts = [`FREQ=${FREQ}`];
  const interval = Math.max(1, rec.interval || 1);
  if (interval > 1) parts.push(`INTERVAL=${interval}`);
  if (rec.freq === 'weekly' && Array.isArray(rec.byWeekday) && rec.byWeekday.length) {
    const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    parts.push(`BYDAY=${rec.byWeekday.map((n) => DAYS[n]).join(',')}`);
  }
  if (rec.end?.type === 'count' && rec.end.count) {
    parts.push(`COUNT=${rec.end.count}`);
  } else if (rec.end?.type === 'until' && rec.end.untilKey) {
    const ymd = rec.end.untilKey.replace(/-/g, '');
    parts.push(allDay ? `UNTIL=${ymd}` : `UNTIL=${ymd}T235959Z`);
  }
  return [`RRULE:${parts.join(';')}`];
}

/** Build the Google event body from a task row (UI-shaped: startKey/time/...). */
function todoToEvent(todo) {
  if (!todo.startKey) return null;
  const allDay = !todo.time;

  let start;
  let end;
  if (allDay) {
    start = { date: todo.startKey };
    end = { date: addOneDay(todo.startKey) };
  } else {
    const endWall = addMinutesToWallClock(
      todo.startKey,
      todo.time,
      DEFAULT_EVENT_MINUTES
    );
    start = { dateTime: `${todo.startKey}T${todo.time}:00`, timeZone: TIMEZONE };
    end = {
      dateTime: `${endWall.date}T${endWall.time}:00`,
      timeZone: TIMEZONE,
    };
  }

  const body = {
    summary: todo.title,
    description: todo.notes || undefined,
    start,
    end,
    extendedProperties: { private: { [TODO_MARKER]: String(todo.id) } },
  };
  const recurrence = buildRecurrence(todo.recurrence, allDay);
  if (recurrence) body.recurrence = recurrence;
  return body;
}

/**
 * Mirror a task to the member's calendar. Inserts a new event (returning its id)
 * or updates the existing one when `todo.gcalEventId` is set. Returns the event
 * id to persist, or null when sync is off / not connected / on error.
 *
 * @param {string} userId
 * @param {object} todo  - UI-shaped task incl. optional `gcalEventId`.
 * @param {object} [opts]
 * @param {boolean} [opts.force=false]  - Push even when the auto-mirror toggle
 *   is off (used by the on-demand "Sync this month" action).
 * @returns {Promise<string|null>}
 */
export async function pushTodo(userId, todo, { force = false } = {}) {
  const client = await getCalendarClient(userId);
  if (!client) return null;
  if (!force && !client.syncEnabled) return null;

  const body = todoToEvent(todo);
  if (!body) return null;

  try {
    if (todo.gcalEventId) {
      const { data } = await client.calendar.events.update({
        calendarId: client.calendarId,
        eventId: todo.gcalEventId,
        requestBody: body,
      });
      return data.id || todo.gcalEventId;
    }
    const { data } = await client.calendar.events.insert({
      calendarId: client.calendarId,
      requestBody: body,
    });
    return data.id || null;
  } catch (err) {
    // A stale id (event deleted in Google) → recreate it once.
    if ((err?.code === 404 || err?.code === 410) && todo.gcalEventId) {
      return pushTodo(userId, { ...todo, gcalEventId: null });
    }
    if (isRevoked(err)) {
      await deleteConnection(userId).catch(() => {});
      return null;
    }
    console.error('pushTodo:', err?.message);
    return null;
  }
}

// ── Export: NEUPC feed item → Google Calendar event ────────────────────────────

/** Build a Google event body from a Daily Activity feed item (real instant). */
function feedItemToEvent(item) {
  const start = new Date(item.start);
  if (Number.isNaN(start.getTime())) return null;
  const minutes = typeof item.durationMin === 'number' ? item.durationMin : 30;
  const end = new Date(start.getTime() + Math.max(1, minutes) * 60000);

  const PREFIX = {
    contest: 'Contest: ',
    session: 'Session: ',
    event: 'Event: ',
    task: 'Due: ',
  };
  const descParts = [];
  if (item.description) descParts.push(item.description);
  if (item.bootcampTitle) descParts.push(item.bootcampTitle);

  return {
    summary: `${PREFIX[item.category] || ''}${item.title}`,
    description: descParts.join(' — ') || undefined,
    location: item.location || undefined,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    source: item.url ? { title: 'NEUPC', url: item.url } : undefined,
    extendedProperties: { private: { [FEED_MARKER]: String(item.id) } },
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

  const body = feedItemToEvent(item);
  if (!body) return false;

  try {
    const { data: existing } = await client.calendar.events.list({
      calendarId: client.calendarId,
      privateExtendedProperty: `${FEED_MARKER}=${item.id}`,
      maxResults: 1,
      showDeleted: false,
    });
    const found = existing.items?.[0];

    if (found?.id) {
      await client.calendar.events.update({
        calendarId: client.calendarId,
        eventId: found.id,
        requestBody: body,
      });
    } else {
      await client.calendar.events.insert({
        calendarId: client.calendarId,
        requestBody: body,
      });
    }
    return true;
  } catch (err) {
    if (isRevoked(err)) {
      await deleteConnection(userId).catch(() => {});
      return false;
    }
    console.error('pushFeedItem:', err?.message);
    return false;
  }
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

/**
 * Mirror a NEUPC todo to the member's Google Tasks list (the checkbox to-dos in
 * the Calendar "Tasks" panel / Google Tasks app). Inserts a new task or updates
 * the linked one when `todo.gtaskId` is set. A recurring todo maps to a single
 * task due on `todo.startKey` (caller passes the next occurrence). `completed`
 * sets the done state. Returns the task id to persist, or null.
 *
 * @param {string} userId
 * @param {object} todo  - { id, title, notes, startKey, gtaskId, completed }
 * @param {object} [opts]
 * @param {boolean} [opts.force=false]  - Push even when auto-mirror is off.
 * @returns {Promise<string|null>}
 */
export async function pushTodoTask(userId, todo, { force = false } = {}) {
  const client = await getCalendarClient(userId);
  if (!client) return null;
  if (!force && !client.syncEnabled) return null;

  const body = {
    title: todo.title || '(untitled)',
    notes: todo.notes || undefined,
    due: taskDue(todo.startKey),
    status: todo.completed ? 'completed' : 'needsAction',
  };
  // Clearing completion requires explicitly nulling `completed`.
  if (!todo.completed) body.completed = null;

  try {
    if (todo.gtaskId) {
      const { data } = await client.tasks.tasks.update({
        tasklist: '@default',
        task: todo.gtaskId,
        requestBody: { id: todo.gtaskId, ...body },
      });
      return data.id || todo.gtaskId;
    }
    const { data } = await client.tasks.tasks.insert({
      tasklist: '@default',
      requestBody: body,
    });
    return data.id || null;
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
