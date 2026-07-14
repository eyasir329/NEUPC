/**
 * @file Executive dashboard — landing page for the executive committee.
 *   Provides an overview of club operations, pending tasks, and quick
 *   links to management features. Data is fetched server-side and
 *   delegated to the client shell.
 *
 * @module ExecutiveDashboardPage
 * @access executive | admin
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getEventsWithStats,
  getPlatformStatistics,
  getDashboardMetrics,
  getBlogsWithStats,
  getNoticesAdmin,
  getAllUsers,
} from '@/app/_lib/services/data-service';
import ExecutiveDashboardClient from './_components/ExecutiveDashboardClient';

export const metadata = { title: 'Dashboard | Executive | NEUPC' };

export default async function ExecutiveDashboardPage() {
  const { user } = await requireRole(['executive', 'admin']);

  const [eventsData, platformStats, metrics, blogsData, noticesData, users] =
    await Promise.all([
      getEventsWithStats().catch(() => ({ events: [], stats: {} })),
      getPlatformStatistics().catch(() => ({})),
      getDashboardMetrics().catch(() => ({})),
      getBlogsWithStats().catch(() => ({ posts: [], stats: {} })),
      getNoticesAdmin().catch(() => ({ notices: [], stats: {} })),
      getAllUsers().catch(() => []),
    ]);

  const events = eventsData?.events || [];
  const eventStats = eventsData?.stats || {};

  // Registrations that are still awaiting confirmation/attendance.
  const pendingRegistrations = events.reduce(
    (sum, e) =>
      sum +
      Math.max(
        0,
        (e.registrationCount || 0) -
          (e.confirmedCount || 0) -
          (e.attendedCount || 0)
      ),
    0
  );

  return (
    <ExecutiveDashboardClient
      firstName={user.full_name?.split(' ')[0] || 'Executive'}
      fullName={user.full_name || 'Executive'}
      stats={{
        totalEvents: eventStats.total ?? 0,
        activeMembers: platformStats.approvedMembers ?? 0,
        pendingRegistrations,
        totalParticipation: eventStats.totalRegistrations ?? 0,
        activeNotices: noticesData?.stats?.active ?? 0,
        pendingApplications: metrics.pendingJoinRequests ?? 0,
      }}
      pendingActions={[
        {
          id: 'registrations',
          count: pendingRegistrations,
          label: 'Pending Registrations',
          color: 'red',
          icon: 'UserCheck',
          href: '/account/executive/registrations',
        },
        {
          id: 'applications',
          count: metrics.pendingJoinRequests ?? 0,
          label: 'Membership Applications',
          color: 'amber',
          icon: 'UserPlus',
          href: '/account/executive/applications',
        },
        {
          id: 'blogs',
          count: blogsData?.stats?.draft ?? 0,
          label: 'Draft Blogs',
          color: 'blue',
          icon: 'FileText',
          href: '/account/executive/blogs',
        },
        {
          id: 'events',
          count: eventStats.draft ?? 0,
          label: 'Draft Events',
          color: 'orange',
          icon: 'Calendar',
          href: '/account/executive/events',
        },
      ]}
      upcomingEvents={events
        .filter((e) => e.status === 'upcoming' || e.status === 'ongoing')
        .slice(0, 4)
        .map((e) => ({
          id: e.id,
          name: e.title,
          date: e.start_date,
          registrations: e.registrationCount || 0,
          status: e.status,
        }))}
      recentMembers={users.slice(0, 4).map((u) => ({
        id: u.id,
        name: u.name || u.email,
        joined: u.joined,
        role: u.role,
        status: u.status,
      }))}
      latestNotices={(noticesData?.notices || []).slice(0, 3).map((n) => ({
        id: n.id,
        title: n.title,
        date: n.created_at,
        active: !n.expires_at || new Date(n.expires_at) > new Date(),
      }))}
    />
  );
}
