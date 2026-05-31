/**
 * @file Member daily activity — personal to-do list and a monthly calendar
 *   overlaying the member's tasks with real published events and upcoming
 *   contests. All task data is persisted per-user in Supabase.
 *
 * @module MemberDailyActivityPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getMemberTodoData,
  getDailyActivityFeed,
  getGoogleCalendarStatus,
} from '@/app/_lib/services/data/member-todos';
import DailyActivityClient from './_components/DailyActivityClient';

export const metadata = { title: 'Daily Activity | Member | NEUPC' };

export default async function MemberDailyActivityPage() {
  const { user } = await requireRole('member');

  const [data, feed, googleCalendar] = await Promise.all([
    getMemberTodoData(user.id).catch(() => ({
      lists: [],
      todos: [],
      completions: {},
    })),
    getDailyActivityFeed(user.id).catch(() => []),
    getGoogleCalendarStatus(user.id).catch(() => ({
      connected: false,
      email: null,
      syncEnabled: false,
    })),
  ]);

  return (
    <DailyActivityClient
      initialLists={data.lists}
      initialTodos={data.todos}
      initialCompletions={data.completions}
      feed={feed}
      userId={user.id}
      googleCalendar={googleCalendar}
    />
  );
}