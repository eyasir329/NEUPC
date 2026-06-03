/**
 * @file member daily-activity data-access — the read-only activity feed
 *   (published events, internal/external contests, bootcamp sessions &
 *   deadlines, and the member's personal events) plus Google Calendar
 *   connection status. Editable to-do CRUD lives in the REST routes under
 *   app/api/member/daily-activity/*, not here.
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { getPublishedEvents } from './events';
import { getUpcomingContests } from './contests';
import { getUpcomingExternalContests } from './external-contests';
import { getConnection } from '@/app/_lib/integrations/google-calendar';

/**
 * Real calendar feed mapped to the `{ id, category, title, location, start,
 * durationMin, ... }` shape the UI consumes. `start` is serializable (string);
 * the client converts it to a Date. Published events + upcoming contests are
 * global; bootcamp sessions and task deadlines are scoped to the member's
 * enrolled bootcamps, so this needs the user id.
 *
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function getDailyActivityFeed(userId) {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const [events, contests, externalContests, bootcamps, personalRows] =
    await Promise.all([
      getPublishedEvents().catch(() => []),
      getUpcomingContests(100).catch(() => []),
      getUpcomingExternalContests(100).catch(() => []),
      getEnrolledBootcamps(userId).catch(() => []),
      supabaseAdmin
        .from('personal_events')
        .select('*')
        .eq('user_id', userId)
        .then(({ data }) => data || [])
        .catch(() => []),
    ]);

  const eventItems = (events || [])
    .filter((e) => e.start_date)
    .map((e) => {
      const start = new Date(e.start_date);
      const end = e.end_date ? new Date(e.end_date) : null;
      const durationMin = end
        ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
        : null;
      return {
        id: `event-${e.id}`,
        category: 'event',
        title: e.title,
        description: plainSnippet(e.description),
        location: e.location || null,
        url: e.url || null,
        start: start.toISOString(),
        endDate: e.end_date ? new Date(e.end_date).toISOString().split('T')[0] : null,
        endTime: end ? end.toISOString() : null,
        durationMin,
        eventCategory: e.category || null,
        status: e.status || null,
      };
    });

  const contestItems = (contests || [])
    .filter((c) => c.start_time)
    .map((c) => {
      const start = new Date(c.start_time);
      const durationMin = typeof c.duration === 'number' ? c.duration : null;
      const endTime = durationMin ? new Date(start.getTime() + durationMin * 60000).toISOString() : null;
      return {
        id: `contest-${c.id}`,
        category: 'contest',
        title: c.title,
        description: plainSnippet(c.description),
        location: c.platform || null,
        url: c.url || null,
        start: start.toISOString(),
        endTime,
        durationMin,
      };
    });

  const externalContestItems = (externalContests || [])
    .filter((c) => c.start_time)
    .map((c) => {
      const start = new Date(c.start_time);
      const durationMin = typeof c.duration_seconds === 'number' ? Math.round(c.duration_seconds / 60) : null;
      const endTime = durationMin ? new Date(start.getTime() + durationMin * 60000).toISOString() : null;
      return {
        id: `ext-contest-${c.id}`,
        category: 'contest',
        title: c.name,
        location: c.platform || null,
        url: c.url || null,
        start: start.toISOString(),
        endTime,
        durationMin,
      };
    });

  // Sessions + assignment deadlines for the member's enrolled bootcamps.
  const bootcampIds = (bootcamps || []).map((b) => b.id);
  const titleMap = Object.fromEntries(
    (bootcamps || []).map((b) => [b.id, b.title])
  );
  const [sessionItems, taskItems] = await Promise.all([
    getBootcampSessionItems(userId, bootcampIds, titleMap).catch(() => []),
    getBootcampTaskItems(userId, bootcampIds, titleMap).catch(() => []),
  ]);

  const personalItems = (personalRows || []).map((r) => {
    // start_time / end_time are bare HH:MM Dhaka wall-clock (see personal_events
    // schema). Anchor the start instant to the Dhaka offset (+06:00) so the feed
    // route's isoToHHMM() returns that same wall-clock regardless of server TZ —
    // otherwise a UTC server shifts the start by +6h while the bare end_time
    // stays put, mis-positioning the block in the day/week time grids.
    const startStr = r.start_time
      ? `${r.event_date}T${r.start_time}:00+06:00`
      : `${r.event_date}T00:00:00+06:00`;
    return {
      id: `personal-${r.id}`,
      category: 'personal',
      title: r.title,
      description: r.description || null,
      location: r.location || null,
      url: r.url || null,
      start: startStr,
      endDate: r.end_date || null,
      endTime: r.end_time || null,
      allDay: !r.start_time,
      durationMin: (r.start_time && r.end_time)
        ? (() => {
            const [sh, sm] = r.start_time.split(':').map(Number);
            const [eh, em] = r.end_time.split(':').map(Number);
            return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
          })()
        : null,
      recurrence: r.recurrence || null,
      colorId: r.color_id || null,
      status: r.status || 'confirmed',
      visibility: r.visibility || 'default',
      guestsCanSeeOtherGuests: r.guests_can_see_other_guests ?? true,
      reminders: r.reminders || [],
      attendees: r.attendees || [],
      conferenceLink: r.conference_link || null,
      personalEventId: r.id,
    };
  });

  return [
    ...eventItems,
    ...contestItems,
    ...externalContestItems,
    ...sessionItems,
    ...taskItems,
    ...personalItems,
  ];
}

/**
 * Connection state for the member's Google Calendar, for the page to seed the
 * connect/disconnect UI. Safe to call when not connected (returns disconnected).
 *
 * @param {string} userId
 * @returns {Promise<{ connected: boolean, email: string|null, syncEnabled: boolean }>}
 */
export async function getGoogleCalendarStatus(userId) {
  const conn = await getConnection(userId).catch(() => null);
  return {
    connected: !!conn,
    email: conn?.google_email || null,
    syncEnabled: conn ? conn.sync_enabled !== false : false,
  };
}

/** Ids + titles of the member's active bootcamp enrollments. */
async function getEnrolledBootcamps(userId) {
  if (!userId) return [];
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .select('bootcamp:bootcamps(id, title)')
    .eq('user_id', userId)
    .eq('status', 'active');
  if (error) throw new Error(error.message);
  return (data || []).map((e) => e.bootcamp).filter(Boolean);
}

/**
 * Mentorship/live sessions tied to the member's enrolled bootcamps, with the
 * detail the calendar surfaces (topic, time, duration, venue/meet link,
 * recording). Applies the same audience rules as the bootcamp session list:
 * `all-bootcamp` (or unset) → everyone; `selected-group`/`one-on-one` → only
 * when the member is in `target_student_ids`. Cancelled sessions are skipped.
 */
async function getBootcampSessionItems(userId, bootcampIds, titleMap) {
  if (!userId || !bootcampIds || bootcampIds.length === 0) return [];
  const { data, error } = await supabaseAdmin
    .from('mentorship_sessions')
    .select(
      'id, topic, description, session_date, scheduled_at, duration, status, meet_link, recording_url, location, target_type, target_student_ids, bootcamp_id'
    )
    .in('bootcamp_id', bootcampIds)
    .neq('status', 'cancelled');
  if (error) throw new Error(error.message);

  return (data || [])
    .filter((s) => {
      if (s.target_type === 'selected-group' || s.target_type === 'one-on-one')
        return (s.target_student_ids || []).includes(userId);
      return true; // all-bootcamp or unset
    })
    .filter((s) => s.scheduled_at || s.session_date)
    .map((s) => {
      const start = new Date(s.scheduled_at || s.session_date);
      const durationMin = typeof s.duration === 'number' ? s.duration : null;
      const endTime = durationMin ? new Date(start.getTime() + durationMin * 60000).toISOString() : null;
      return {
        id: `session-${s.id}`,
        category: 'session',
        title: s.topic || 'Bootcamp session',
        description: plainSnippet(s.description),
        location: s.location || null,
        url: s.meet_link || null,
        recordingUrl: s.recording_url || null,
        start: start.toISOString(),
        endTime,
        durationMin,
        status: s.status || null,
        bootcampTitle: titleMap[s.bootcamp_id] || null,
      };
    });
}

/**
 * Turn a stored description into a short plain-text snippet. Task/session
 * descriptions are saved by the multi-block editor as a JSON array of blocks
 * (`[{ id, type, content }]`, where `content` is HTML); plain strings are also
 * supported. Mirrors the mentor view's `descriptionPreview`.
 */
function plainSnippet(raw, max = 160) {
  if (!raw) return null;
  let text = String(raw);
  try {
    const blocks = JSON.parse(raw);
    if (Array.isArray(blocks)) {
      text = blocks.map((b) => b?.content || '').join(' ');
    }
  } catch {
    // Not JSON — treat as a raw HTML/plain string.
  }
  text = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/**
 * Weekly assignment deadlines for the member's enrolled bootcamps, each tagged
 * with the member's own submission status. Tasks are bootcamp-wide (scoped by
 * `bootcamp_id`), so no per-student targeting is needed. A task with no
 * submission row is reported as `pending`.
 */
async function getBootcampTaskItems(userId, bootcampIds, titleMap) {
  if (!userId || !bootcampIds || bootcampIds.length === 0) return [];
  const { data: tasks, error } = await supabaseAdmin
    .from('weekly_tasks')
    .select(
      'id, title, description, difficulty, deadline, start_time, created_at, points, task_type, bootcamp_id'
    )
    .in('bootcamp_id', bootcampIds)
    .not('deadline', 'is', null);
  if (error) throw new Error(error.message);
  if (!tasks || tasks.length === 0) return [];

  const { data: subs } = await supabaseAdmin
    .from('task_submissions')
    .select('task_id, status, points_earned')
    .eq('user_id', userId)
    .in(
      'task_id',
      tasks.map((t) => t.id)
    );
  const subByTask = Object.fromEntries((subs || []).map((s) => [s.task_id, s]));

  return tasks.map((t) => {
    const sub = subByTask[t.id];
    const deadlineISO = new Date(t.deadline).toISOString();
    // Available-from = explicit start_time if mentor set one, else task created_at.
    const availableRaw = t.start_time || t.created_at;
    const availableISO = availableRaw ? new Date(availableRaw).toISOString() : deadlineISO;
    return {
      id: `task-${t.id}`,
      category: 'task',
      title: t.title,
      description: plainSnippet(t.description),
      location: null,
      url: null,
      start: availableISO,
      endTime: deadlineISO,
      availableISO,
      durationMin: null,
      isDeadline: true,
      bootcampTitle: titleMap[t.bootcamp_id] || null,
      taskType: t.task_type || null,
      difficulty: t.difficulty || null,
      points: typeof t.points === 'number' ? t.points : null,
      pointsEarned: typeof sub?.points_earned === 'number' ? sub.points_earned : null,
      submissionStatus: sub?.status || 'pending',
    };
  });
}
