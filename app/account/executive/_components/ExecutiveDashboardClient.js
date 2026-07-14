/**
 * @file Executive dashboard client component — thin composer that renders
 *   the dashboard sections from server-fetched data.
 * @module ExecutiveDashboardClient
 */

'use client';

import ExecutiveHeader from './ExecutiveHeader';
import ExecutiveStatsGrid from './ExecutiveStatsGrid';
import PendingActions from './PendingActions';
import UpcomingEvents from './UpcomingEvents';
import RecentMembers from './RecentMembers';
import LatestNotices from './LatestNotices';
import QuickAccessCards from './QuickAccessCards';
import { PageShell } from '@/app/account/_components/ui';

export default function ExecutiveDashboardClient({
  firstName,
  fullName,
  stats,
  pendingActions,
  upcomingEvents,
  recentMembers,
  latestNotices,
}) {
  return (
    <PageShell>
      <ExecutiveHeader firstName={firstName} fullName={fullName} />
      <ExecutiveStatsGrid stats={stats} />
      <PendingActions pendingActions={pendingActions} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="flex flex-col gap-6 xl:col-span-8">
          <UpcomingEvents upcomingEvents={upcomingEvents} />
          <LatestNotices latestNotices={latestNotices} />
        </div>
        <div className="flex flex-col gap-6 xl:col-span-4">
          <div className="sticky top-8 flex flex-col gap-6">
            <RecentMembers recentMembers={recentMembers} />
            <QuickAccessCards />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
