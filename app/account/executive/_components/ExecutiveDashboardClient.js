'use client';

import RoleSync from '../../_components/RoleSync';
import ExecutiveHeader from './ExecutiveHeader';
import ExecutiveStatsGrid from './ExecutiveStatsGrid';
import PendingActions from './PendingActions';
import UpcomingEvents from './UpcomingEvents';
import RecentMembers from './RecentMembers';
import LatestNotices from './LatestNotices';
import QuickAccessCards from './QuickAccessCards';

export default function ExecutiveDashboardClient({ session }) {
  // Mock stats - replace with real data
  const stats = {
    totalEvents: 24,
    activeMembers: 156,
    pendingRegistrations: 12,
    totalParticipation: 342,
    activeNotices: 5,
    engagementRate: 78,
  };

  // Mock upcoming events - replace with real data
  const upcomingEvents = [
    {
      id: 1,
      name: 'Inter-University Programming Contest 2026',
      date: 'Mar 15, 2026',
      registrations: 45,
      status: 'Open',
      statusColor: 'green',
    },
    {
      id: 2,
      name: 'Web Development Workshop',
      date: 'Mar 22, 2026',
      registrations: 32,
      status: 'Open',
      statusColor: 'green',
    },
    {
      id: 3,
      name: 'Algorithm Masterclass',
      date: 'Apr 5, 2026',
      registrations: 28,
      status: 'Closed',
      statusColor: 'red',
    },
  ];

  // Mock pending actions
  const pendingActions = [
    {
      id: 1,
      type: 'registrations',
      count: 12,
      label: 'Pending Registrations',
      color: 'red',
      icon: 'UserCheck',
    },
    {
      id: 2,
      type: 'applications',
      count: 3,
      label: 'Membership Applications',
      color: 'amber',
      icon: 'UserPlus',
    },
    {
      id: 3,
      type: 'blogs',
      count: 2,
      label: 'Blogs Awaiting Review',
      color: 'blue',
      icon: 'FileText',
    },
    {
      id: 4,
      type: 'events',
      count: 1,
      label: 'Events Needs Approval',
      color: 'orange',
      icon: 'Calendar',
    },
  ];

  // Mock recent members
  const recentMembers = [
    { name: 'Ahmed Khan', joinDate: '2 days ago', activity: 'High' },
    { name: 'Fatima Rahman', joinDate: '3 days ago', activity: 'Medium' },
    { name: 'Mehedi Hasan', joinDate: '5 days ago', activity: 'High' },
    { name: 'Nusrat Jahan', joinDate: '1 week ago', activity: 'Low' },
  ];

  // Mock latest notices
  const latestNotices = [
    {
      title: 'Registration Open for Spring Contest',
      date: 'Feb 14, 2026',
      status: 'Published',
    },
    {
      title: 'Workshop Schedule Updated',
      date: 'Feb 12, 2026',
      status: 'Published',
    },
    {
      title: 'New Membership Guidelines',
      date: 'Feb 10, 2026',
      status: 'Draft',
    },
  ];

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="executive" />

      <ExecutiveHeader />
      <ExecutiveStatsGrid stats={stats} />
      <PendingActions pendingActions={pendingActions} />

      {/* Two Column Layout */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <UpcomingEvents upcomingEvents={upcomingEvents} />
        <RecentMembers recentMembers={recentMembers} />
      </div>

      {/* Latest Notices & Quick Access Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LatestNotices latestNotices={latestNotices} />
        </div>

        {/* Quick Access Cards */}
        <QuickAccessCards />
      </div>
    </div>
  );
}
