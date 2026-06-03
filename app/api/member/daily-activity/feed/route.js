/**
 * @file Read-only activity feed for Daily Activity — published events, internal
 *   & external contests, bootcamp sessions, assignment deadlines, and the
 *   member's Google Calendar, all mapped to the Todoist task-like shape the UI
 *   consumes. These items are never editable.
 * @module api/member/daily-activity/feed
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/_lib/auth/auth';
import { getUserByEmail } from '@/app/_lib/services/data-service';
import { getDailyActivityFeed } from '@/app/_lib/services/data/member-todos';

const CATEGORY_LABEL = {
  event: 'Events',
  contest: 'Contests',
  session: 'Sessions',
  task: 'Deadlines',
  personal: 'Personal',
};

function feedItemToTask(item) {
  const start = new Date(item.start);

  const DHAKA_TZ = 'Asia/Dhaka';
  const dhakaFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: DHAKA_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

  // Extract Dhaka-timezone YYYY-MM-DD from any ISO string.
  function isoToLocalDate(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d)) return iso.split('T')[0];
    const parts = Object.fromEntries(dhakaFmt.formatToParts(d).map(({ type, value }) => [type, value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  // Extract Dhaka-timezone HH:MM from any ISO string.
  function isoToHHMM(iso) {
    if (!iso) return null;
    // Bare "HH:MM" or "HH:MM:SS" string (no date part) — return as-is.
    if (!iso.includes('T') && !iso.includes('Z') && !iso.includes('+')) {
      return iso.slice(0, 5);
    }
    const d = new Date(iso);
    if (isNaN(d)) return null;
    const parts = Object.fromEntries(dhakaFmt.formatToParts(d).map(({ type, value }) => [type, value]));
    const hh = parts.hour === '24' ? '00' : parts.hour;
    return `${hh}:${parts.minute}`;
  }

  // dueDate: for tasks always the deadline date; for others the start date.
  const dueDate = item.category === 'task' && item.endTime
    ? isoToLocalDate(item.endTime)
    : isoToLocalDate(item.start) ?? item.start.split('T')[0];

  const time = item.allDay ? null : isoToHHMM(item.start);
  const endTime24 = item.endTime ? isoToHHMM(item.endTime) : null;

  const isContest = item.category === 'contest';
  const description =
    item.description ||
    item.bootcampTitle ||
    item.location ||
    `${CATEGORY_LABEL[item.category] || 'Activity'} item`;

  return {
    id: item.id,
    title: item.title,
    description,
    completed: false,
    createdAt: item.start,
    // availableFrom: local date of created_at / start_time for display and calendar span.
    availableFrom: item.category === 'task' ? isoToLocalDate(item.availableISO || item.start) : null,
    // startTime: local HH:MM of the available-from time.
    startTime: item.category === 'task' ? isoToHHMM(item.availableISO || item.start) : null,
    dueDate,
    priority: item.category === 'task' ? 1 : 2,
    projectId: undefined,
    labels: [CATEGORY_LABEL[item.category] || 'Activity'],
    subtasks: [],
    comments: [],
    isArchived: false,
    // Personal events are editable — not read-only.
    readOnly: item.category !== 'personal',
    feedCategory: item.category,
    personalEventId: item.personalEventId || null,
    location: item.location || null,
    url: item.url || null,
    endDate: item.endDate || null,
    recurrence: item.recurrence || null,
    colorId: item.colorId || null,
    status: item.status || null,
    visibility: item.visibility || null,
    guestsCanSeeOtherGuests: item.guestsCanSeeOtherGuests ?? true,
    reminders: item.reminders || [],
    attendees: item.attendees || [],
    conferenceLink: item.conferenceLink || null,
    bootcampTitle: item.bootcampTitle || null,
    // Bootcamp task deadlines have no single "scheduled time" — their start/end
    // are already surfaced via availableFrom/startTime and endTime. Setting time
    // to null prevents the calendar and task chips from showing a misleading
    // available-from time as if it were the event's clock time on the deadline day.
    time: (item.allDay || item.category === 'task') ? null : time,
    endTime: endTime24,
    durationMin: typeof item.durationMin === 'number' ? item.durationMin : null,
    // Session-specific
    recordingUrl: item.recordingUrl || null,
    // Task/deadline-specific
    taskType: item.taskType || null,
    difficulty: item.difficulty || null,
    points: item.points ?? null,
    pointsEarned: item.pointsEarned ?? null,
    submissionStatus: item.submissionStatus || null,
    // Event-specific
    eventCategory: item.eventCategory || null,
    contestUrl: item.url || null,
    ...(isContest
      ? {
          isContest: true,
          contestPlatform: (item.location || 'other').toLowerCase(),
          contestDuration:
            typeof item.durationMin === 'number' ? `${item.durationMin}m` : null,
          contestTime: time,
        }
      : {}),
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await getUserByEmail(session.user.email);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const feed = await getDailyActivityFeed(user.id);
    const tasks = (feed || [])
      .filter((item) => item.start)
      .map(feedItemToTask);

    return NextResponse.json(tasks);
  } catch (err) {
    console.error('[feed GET]', err);
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
  }
}
