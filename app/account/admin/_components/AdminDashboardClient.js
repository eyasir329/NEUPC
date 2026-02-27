'use client';

import RoleSync from '../../_components/RoleSync';
import AdminHeader from './AdminHeader';
import StatsGrid from './StatsGrid';
import SystemMetrics from './SystemMetrics';
import PendingApprovals from './PendingApprovals';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';
import SystemNotifications from './SystemNotifications';
import ManagementLinks from './ManagementLinks';

export default function AdminDashboardClient({ session }) {
  // Mock stats - replace with real data
  const stats = {
    totalUsers: 1248,
    activeMembers: 856,
    mentors: 32,
    upcomingEvents: 8,
    pendingApprovals: 12,
    systemHealth: 98,
  };

  // Mock recent activities (use icon names as strings for serialization)
  const recentActivities = [
    {
      action: 'New user registration: Aisha Rahman',
      time: '5 min ago',
      type: 'user',
      iconName: 'UserCheck',
    },
    {
      action: 'Event approved: Web3 Workshop',
      time: '15 min ago',
      type: 'event',
      iconName: 'CheckCircle',
    },
    {
      action: 'Role updated: John Doe → Mentor',
      time: '1 hour ago',
      type: 'role',
      iconName: 'Shield',
    },
    {
      action: 'System backup completed',
      time: '2 hours ago',
      type: 'system',
      iconName: 'Database',
    },
  ];

  // Mock pending approvals
  const pendingApprovals = [
    { id: 1, type: 'Member Application', user: 'Sarah Ahmed', date: 'Feb 15' },
    { id: 2, type: 'Event Request', user: 'John Doe', date: 'Feb 15' },
    { id: 3, type: 'Mentor Application', user: 'Mike Chen', date: 'Feb 14' },
  ];

  // Mock system stats
  const systemStats = [
    { label: 'User Growth', value: '+12.5%', trend: 'up', color: 'green' },
    { label: 'Event Participation', value: '87%', trend: 'up', color: 'blue' },
    {
      label: 'Mentor Response Rate',
      value: '94%',
      trend: 'up',
      color: 'purple',
    },
    { label: 'System Uptime', value: '99.9%', trend: 'stable', color: 'cyan' },
  ];

  // Admin quick actions (use icon names as strings for serialization)
  const quickActions = [
    {
      title: 'Users',
      iconName: 'Users',
      count: stats.totalUsers,
      link: '/account/admin/users',
      color: 'blue',
    },
    {
      title: 'Roles',
      iconName: 'Shield',
      count: '6 types',
      link: '/account/admin/roles',
      color: 'purple',
    },
    {
      title: 'Events',
      iconName: 'Calendar',
      count: stats.upcomingEvents,
      link: '/account/admin/events',
      color: 'green',
    },
    {
      title: 'Analytics',
      iconName: 'BarChart3',
      count: 'Reports',
      link: '/account/admin/analytics',
      color: 'amber',
    },
    {
      title: 'Content',
      iconName: 'FileText',
      count: 'Manage',
      link: '/account/admin/content',
      color: 'pink',
    },
    {
      title: 'Settings',
      iconName: 'Settings',
      count: 'Configure',
      link: '/account/admin/settings',
      color: 'cyan',
    },
  ];

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="admin" />

      <AdminHeader stats={stats} />
      <StatsGrid stats={stats} />
      <SystemMetrics systemStats={systemStats} />

      {/* Main Content Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <PendingApprovals pendingApprovals={pendingApprovals} />
        <RecentActivity recentActivities={recentActivities} />
      </div>

      <QuickActions quickActions={quickActions} />

      {/* System Overview & Management */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <SystemNotifications />
        <ManagementLinks />
      </div>
    </div>
  );
}
