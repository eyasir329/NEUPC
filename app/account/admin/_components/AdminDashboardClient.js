/**
 * @file Admin dashboard shell — clarity-first layout that mirrors the
 *   member panel hierarchy and visual language. All data is fetched
 *   server-side and passed in as props.
 *
 * Layout (top → bottom):
 *   1. AdminHeader       — console title + role pills + system health
 *   2. StatsGrid         — 6 hero metrics
 *   3. SystemMetrics     — secondary KPIs (activity, contacts, contests)
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

export default function AdminDashboardClient({
  stats = {},
  systemStats = [],
  pendingApprovals = [],
  recentActivities = [],
  notices = [],
}) {
  const quickActions = [
    {
      title: 'Users',
      iconName: 'Users',
      count: stats.totalUsers ?? 0,
      link: '/account/admin/users',
      color: 'blue',
    },
    {
      title: 'Roles',
      iconName: 'Shield',
      count: 'Manage',
      link: '/account/admin/roles',
      color: 'purple',
    },
    {
      title: 'Events',
      iconName: 'Calendar',
      count: stats.upcomingEvents ?? 0,
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
      title: 'Blogs',
      iconName: 'FileText',
      count: 'Manage',
      link: '/account/admin/blogs',
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
            <SystemNotifications notices={notices} />
          </div>
        </div>
      </div>

      <ManagementLinks />
    </PageShell>
  );
}
