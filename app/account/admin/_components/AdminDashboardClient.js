/**
 * @file Admin dashboard shell — clarity-first layout that mirrors the
 *   member panel hierarchy and visual language.
 *
 * Layout (top → bottom):
 *   1. AdminHeader       — console title + role pills + system health
 *   2. StatsGrid         — 6 hero metrics
 *   3. SystemMetrics     — secondary KPIs (growth, participation, etc.)
 *   4. Action zone       — 2/3 primary + 1/3 side rail
 *        primary: PendingApprovals · QuickActions
 *        rail:    RecentActivity · SystemNotifications
 *   5. ManagementLinks   — full-width secondary navigation
 *
 * @module AdminDashboardClient
 */

'use client';

import AdminHeader from './AdminHeader';
import StatsGrid from './StatsGrid';
import SystemMetrics from './SystemMetrics';
import PendingApprovals from './PendingApprovals';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';
import SystemNotifications from './SystemNotifications';
import ManagementLinks from './ManagementLinks';
import { PageShell } from '@/app/account/_components/ui';

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

  const pendingApprovals = [
    { id: 1, type: 'Member Application', user: 'Sarah Ahmed', date: 'Feb 15' },
    { id: 2, type: 'Event Request', user: 'John Doe', date: 'Feb 15' },
    { id: 3, type: 'Mentor Application', user: 'Mike Chen', date: 'Feb 14' },
  ];

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
    <PageShell>
      <AdminHeader stats={stats} />

      <StatsGrid stats={stats} />

      <SystemMetrics systemStats={systemStats} />

      <div className="relative mt-2 grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="flex flex-col gap-8 xl:col-span-8">
          <PendingApprovals pendingApprovals={pendingApprovals} />
          <QuickActions quickActions={quickActions} />
        </div>

        <div className="flex flex-col gap-8 xl:col-span-4">
          <div className="sticky top-8 flex flex-col gap-8">
            <RecentActivity recentActivities={recentActivities} />
            <SystemNotifications />
          </div>
        </div>
      </div>

      <ManagementLinks />
    </PageShell>
  );
}
