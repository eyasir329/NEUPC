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
  gcal: 'Calendar',
};

function feedItemToTask(item) {
  const start = new Date(item.start);
  const dueDate = start.toISOString().split('T')[0];
  const time = start.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

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
    dueDate,
    priority: item.category === 'task' ? 1 : 2,
    projectId: undefined,
    labels: [CATEGORY_LABEL[item.category] || 'Activity'],
    subtasks: [],
    comments: [],
    isArchived: false,
    readOnly: true,
    feedCategory: item.category,
    bootcampTitle: item.bootcampTitle || null,
    time: item.allDay ? null : time,
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
