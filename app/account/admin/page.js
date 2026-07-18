/**
 * @file Admin dashboard page (server component).
 * Fetches live platform data (stats, pending applications, activity,
 * notices) server-side and delegates rendering to the client shell.
 *
 * @module AdminDashboardPage
 * @access admin
 */

import {
  getPlatformStatistics,
  getDashboardMetrics,
  getUserStats,
  getRolesWithStats,
  getPendingJoinRequests,
  getActivityLogs,
  getActiveNotices,
} from '@/app/_lib/services/data-service';
import AdminDashboardClient from './_components/AdminDashboardClient';

export const metadata = { title: 'Dashboard | Admin | NEUPC' };
export const revalidate = 0;

/** Relative "x ago" label for a timestamp. */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** Map an activity log row to a dashboard timeline item. */
function toActivityItem(log) {
  const action = (log.action || '').toLowerCase();
  const entity = (log.entity_type || '').toLowerCase();
  const actor = log.users?.full_name || 'System';
  const label = (log.action || 'activity').replace(/_/g, ' ');

  let type = 'system';
  let iconName = 'Database';
  if (entity.includes('user') || action.includes('login')) {
    type = 'user';
    iconName = 'UserCheck';
  } else if (entity.includes('event')) {
    type = 'event';
    iconName = 'CheckCircle2';
  } else if (action.includes('role') || entity.includes('role')) {
    type = 'role';
    iconName = 'Shield';
  }

  return {
    action: `${actor}: ${label}`,
    time: timeAgo(log.created_at),
    type,
    iconName,
  };
}

export default async function AdminDashboardPage() {
  const [
    platformStats,
    metrics,
    userStats,
    rolesData,
    pendingRequests,
    activityLogs,
    allNotices,
  ] = await Promise.all([
    getPlatformStatistics().catch(() => ({})),
    getDashboardMetrics().catch(() => ({})),
    getUserStats().catch(() => ({})),
    getRolesWithStats().catch(() => ({ roles: [] })),
    getPendingJoinRequests().catch(() => []),
    getActivityLogs(12).catch(() => []),
    getActiveNotices().catch(() => []),
  ]);

  const roles = rolesData?.roles || [];
  const mentorCount =
    roles.find((r) => (r.name || '').toLowerCase() === 'mentor')?.userCount ??
    0;

  const totalUsers = platformStats.totalUsers ?? userStats.total ?? 0;
  const activeUsers = userStats.active ?? 0;
  const pendingApprovals = metrics.pendingJoinRequests ?? 0;

  // Health = share of recent activity that isn't an error/failure.
  const errorish = activityLogs.filter((l) =>
    /fail|error|denied/i.test(l.action || '')
  ).length;
  const systemHealth = activityLogs.length
    ? Math.round(100 - (errorish / activityLogs.length) * 100)
    : 100;

  const stats = {
    totalUsers,
    activeMembers: platformStats.approvedMembers ?? 0,
    mentors: mentorCount,
    upcomingEvents: metrics.upcomingEvents ?? 0,
    pendingApprovals,
    systemHealth,
  };

  const activeRate = totalUsers
    ? Math.round((activeUsers / totalUsers) * 100)
    : 0;
  const memberRate = totalUsers
    ? Math.round(((platformStats.approvedMembers ?? 0) / totalUsers) * 100)
    : 0;

  const systemStats = [
    {
      label: 'Active Accounts',
      value: `${activeRate}%`,
      trend: activeRate >= 50 ? 'up' : 'down',
      color: 'green',
    },
    {
      label: 'Member Conversion',
      value: `${memberRate}%`,
      trend: memberRate >= 50 ? 'up' : 'stable',
      color: 'blue',
    },
    {
      label: 'Unread Contacts',
      value: `${metrics.unreadContacts ?? 0}`,
      trend: (metrics.unreadContacts ?? 0) > 0 ? 'down' : 'stable',
      color: 'purple',
    },
    {
      label: 'Total Contests',
      value: `${platformStats.totalContests ?? 0}`,
      trend: 'stable',
      color: 'cyan',
    },
  ];

  const approvals = pendingRequests.slice(0, 4).map((r) => ({
    id: r.id,
    type: 'Member Application',
    user: r.full_name || r.email,
    date: new Date(r.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  const recentActivities = activityLogs.map(toActivityItem);

  const notices = allNotices
    .filter(
      (n) =>
        !n.target_audience ||
        n.target_audience.includes('all') ||
        n.target_audience.includes('admin')
    )
    .slice(0, 3)
    .map((n) => ({
      id: n.id,
      title: n.title,
      body: `${n.users?.full_name || 'System'} · ${timeAgo(n.created_at)}`,
      tone:
        n.priority === 'urgent' || n.priority === 'high'
          ? 'amber'
          : n.is_pinned
            ? 'cyan'
            : 'emerald',
    }));

  return (
    <AdminDashboardClient
      stats={stats}
      systemStats={systemStats}
      pendingApprovals={approvals}
      recentActivities={recentActivities}
      notices={notices}
    />
  );
}
