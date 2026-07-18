/**
 * @file Mentor dashboard client component — renders live DB-backed
 *   stats, today's schedule, mentee overview, activity and pending
 *   task reviews.
 * @module MentorDashboardClient
 */

'use client';

import MentorHeader from './MentorHeader';
import MentorStatsGrid from './MentorStatsGrid';
import TodaysSchedule from './TodaysSchedule';
import MentorRecentActivity from './MentorRecentActivity';
import MenteeProgressOverview from './MenteeProgressOverview';
import QuickAccessGrid from './QuickAccessGrid';
import PendingReviews from './PendingReviews';
import { PageShell } from '@/app/account/_components/ui';

export default function MentorDashboardClient({ firstName, data }) {
  const {
    stats,
    todaySessions,
    upcomingSessions,
    menteeOverview,
    recentActivity,
    pendingSubmissions,
    bootcamps,
  } = data;

  return (
    <PageShell>
      <MentorHeader mentorName={firstName} stats={stats} />
      <MentorStatsGrid stats={stats} />

      <div className="mt-2 grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
        <div className="flex flex-col gap-6 xl:col-span-8 xl:gap-8">
          <TodaysSchedule
            todaySessions={todaySessions}
            upcomingSessions={upcomingSessions}
          />
          <MenteeProgressOverview
            menteeOverview={menteeOverview}
            bootcamps={bootcamps}
          />
        </div>
        <div className="flex flex-col gap-6 xl:col-span-4">
          <div className="flex flex-col gap-6 xl:sticky xl:top-8">
            <MentorRecentActivity recentActivities={recentActivity} />
            <PendingReviews submissions={pendingSubmissions} />
          </div>
        </div>
      </div>

      <QuickAccessGrid />
    </PageShell>
  );
}
