/**
 * @file Mentor dashboard — landing page for mentors showing assigned
 *   mentees, upcoming sessions, active tasks, and quick links to
 *   mentorship management features. Data is fetched server-side from
 *   the DB and delegated to the client shell.
 *
 * @module MentorDashboardPage
 * @access mentor
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { getMentorDashboardData } from '@/app/_lib/services/data-service';
import MentorDashboardClient from './_components/MentorDashboardClient';

export const metadata = { title: 'Dashboard | Mentor | NEUPC' };

export default async function MentorDashboardPage() {
  const { user } = await requireRole('mentor');

  const data = await getMentorDashboardData(user.id).catch(() => ({
    stats: {
      activeMentees: 0,
      upcomingSessions: 0,
      completedSessions: 0,
      pendingReviews: 0,
      activeTasks: 0,
      bootcamps: 0,
    },
    todaySessions: [],
    upcomingSessions: [],
    menteeOverview: [],
    recentActivity: [],
    pendingSubmissions: [],
    bootcamps: [],
  }));

  return (
    <MentorDashboardClient
      firstName={user.full_name?.split(' ')[0] || 'Mentor'}
      data={data}
    />
  );
}
