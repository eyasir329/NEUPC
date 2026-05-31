/**
 * @file member daily-activity (to-do) data-access — personal lists, tasks,
 *   per-occurrence completions, plus the real events/contests calendar feed.
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { getPublishedEvents } from './events';
import { getUpcomingContests } from './contests';

/**
 * Load a member's lists, tasks, and completions, shaped to match the
 * DailyActivityClient's internal model (groupId / startKey / time).
 *
 * @param {string} userId
 * @returns {Promise<{ lists: object[], todos: object[], completions: object }>}
 */
export async function getMemberTodoData(userId) {
  const [listsRes, todosRes, compRes] = await Promise.all([
    supabaseAdmin
      .from('todo_lists')
      .select('id, name, tone')
      .eq('user_id', userId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('todos')
      .select(
        'id, list_id, title, notes, priority, start_date, due_time, recurrence, exclusions'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('todo_completions')
      .select('todo_id, occurrence_date')
      .eq('user_id', userId),
  ]);

  if (listsRes.error) throw new Error(listsRes.error.message);
  if (todosRes.error) throw new Error(todosRes.error.message);
  if (compRes.error) throw new Error(compRes.error.message);

  const lists = (listsRes.data || []).map((l) => ({
    id: l.id,
    name: l.name,
    tone: l.tone,
  }));

  const todos = (todosRes.data || []).map((t) => ({
    id: t.id,
    groupId: t.list_id,
    title: t.title,
    notes: t.notes || '',
    priority: t.priority,
    startKey: t.start_date, // date → 'YYYY-MM-DD'
    time: t.due_time || '',
    recurrence: t.recurrence || null,
    exclusions: t.exclusions || [], // date[] → ['YYYY-MM-DD', ...]
  }));

  const completions = {};
  (compRes.data || []).forEach((c) => {
    if (!completions[c.todo_id]) completions[c.todo_id] = {};
    completions[c.todo_id][c.occurrence_date] = true;
  });

  return { lists, todos, completions };
}

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
  const [events, contests, bootcamps] = await Promise.all([
    getPublishedEvents().catch(() => []),
    getUpcomingContests(100).catch(() => []),
    getEnrolledBootcamps(userId).catch(() => []),
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
        location: e.location || null,
        start: start.toISOString(),
        durationMin,
      };
    });

  const contestItems = (contests || [])
    .filter((c) => c.start_time)
    .map((c) => ({
      id: `contest-${c.id}`,
      category: 'contest',
      title: c.title,
      location: c.platform || null,
      start: new Date(c.start_time).toISOString(),
      durationMin: typeof c.duration === 'number' ? c.duration : null,
    }));

  // Sessions + assignment deadlines for the member's enrolled bootcamps.
  const bootcampIds = (bootcamps || []).map((b) => b.id);
  const titleMap = Object.fromEntries(
    (bootcamps || []).map((b) => [b.id, b.title])
  );
  const [sessionItems, taskItems] = await Promise.all([
    getBootcampSessionItems(userId, bootcampIds, titleMap).catch(() => []),
    getBootcampTaskItems(userId, bootcampIds, titleMap).catch(() => []),
  ]);

  return [...eventItems, ...contestItems, ...sessionItems, ...taskItems];
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
    .map((s) => ({
      id: `session-${s.id}`,
      category: 'session',
      title: s.topic || 'Bootcamp session',
      location: s.location || null,
      start: new Date(s.scheduled_at || s.session_date).toISOString(),
      durationMin: typeof s.duration === 'number' ? s.duration : null,
      description: plainSnippet(s.description),
      meetLink: s.meet_link || null,
      recordingUrl: s.recording_url || null,
      status: s.status || null,
      bootcampTitle: titleMap[s.bootcamp_id] || null,
    }));
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
      'id, title, description, difficulty, deadline, points, task_type, bootcamp_id'
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
    return {
      id: `task-${t.id}`,
      category: 'task',
      title: t.title,
      location: null,
      start: new Date(t.deadline).toISOString(),
      durationMin: null,
      isDeadline: true,
      description: plainSnippet(t.description),
      bootcampTitle: titleMap[t.bootcamp_id] || null,
      taskType: t.task_type || null,
      difficulty: t.difficulty || null,
      points: typeof t.points === 'number' ? t.points : null,
      pointsEarned:
        typeof sub?.points_earned === 'number' ? sub.points_earned : null,
      status: sub?.status || 'pending',
    };
  });
}
