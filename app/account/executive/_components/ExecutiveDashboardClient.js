'use client';

import ExecutiveHeader from './ExecutiveHeader';
import ExecutiveStatsGrid from './ExecutiveStatsGrid';
import PendingActions from './PendingActions';
import UpcomingEvents from './UpcomingEvents';
import RecentMembers from './RecentMembers';
import LatestNotices from './LatestNotices';
import QuickAccessCards from './QuickAccessCards';
import { PageShell } from '@/app/account/_components/ui';

export default function ExecutiveDashboardClient({ session }) {
  const stats = {
    totalEvents: 24,
    activeMembers: 156,
    pendingRegistrations: 12,
    totalParticipation: 342,
    activeNotices: 5,
    engagementRate: 78,
  };

  const upcomingEvents = [
    { id: 1, name: 'Inter-University Programming Contest 2026', date: 'Mar 15, 2026', registrations: 45, status: 'Open',   statusColor: 'green' },
    { id: 2, name: 'Web Development Workshop',                  date: 'Mar 22, 2026', registrations: 32, status: 'Open',   statusColor: 'green' },
    { id: 3, name: 'Algorithm Masterclass',                     date: 'Apr 05, 2026', registrations: 28, status: 'Closed', statusColor: 'red'   },
  ];

  const pendingActions = [
    { id: 1, type: 'registrations', count: 12, label: 'Pending Registrations',  color: 'red',    icon: 'UserCheck' },
    { id: 2, type: 'applications',  count: 3,  label: 'Membership Applications',color: 'amber',  icon: 'UserPlus'  },
    { id: 3, type: 'blogs',         count: 2,  label: 'Blogs Awaiting Review',  color: 'blue',   icon: 'FileText'  },
    { id: 4, type: 'events',        count: 1,  label: 'Events Needs Approval',  color: 'orange', icon: 'Calendar'  },
  ];

  const recentMembers = [
    { name: 'Ahmed Khan',    joinDate: '2 days ago', activity: 'High'   },
    { name: 'Fatima Rahman', joinDate: '3 days ago', activity: 'Medium' },
    { name: 'Mehedi Hasan',  joinDate: '5 days ago', activity: 'High'   },
    { name: 'Nusrat Jahan',  joinDate: '1 week ago', activity: 'Low'    },
  ];

  const latestNotices = [
    { title: 'Registration Open for Spring Contest', date: 'Feb 14, 2026', status: 'Published' },
    { title: 'Workshop Schedule Updated',            date: 'Feb 12, 2026', status: 'Published' },
    { title: 'New Membership Guidelines',            date: 'Feb 10, 2026', status: 'Draft'     },
  ];

  return (
    <PageShell>
      <ExecutiveHeader session={session} />
      <ExecutiveStatsGrid stats={stats} />
      <PendingActions pendingActions={pendingActions} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 flex flex-col gap-6">
          <UpcomingEvents upcomingEvents={upcomingEvents} />
          <LatestNotices latestNotices={latestNotices} />
        </div>
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="sticky top-8 flex flex-col gap-6">
            <RecentMembers recentMembers={recentMembers} />
            <QuickAccessCards />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
