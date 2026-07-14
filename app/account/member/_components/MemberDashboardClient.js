/**
 * @file Member dashboard shell — clarity-first layout with a clear
 *   primary/secondary hierarchy. Every widget renders real data passed
 *   down from the server page; sections without data hide themselves.
 *
 * Layout (top → bottom):
 *   1. MemberHeader             — greeting + tier + rank + streak
 *   2. ProfileCompletenessNudge — only when < 100% (dismissible)
 *   3. MemberStatsGrid          — 4 hero metrics
 *   4. Action zone              — 2/3 primary stack + 1/3 side rail
 *   5. LearningProgress + AchievementsSection — full-width
 *
 * @module MemberDashboardClient
 */

'use client';

import MemberHeader from './MemberHeader';
import MemberStatsGrid from './MemberStatsGrid';
import UpcomingEventsSection from './UpcomingEventsSection';
import RecentActivity from './RecentActivity';
import LearningProgress from './LearningProgress';
import VideoWatchTime from './VideoWatchTime';
import AchievementsSection from './AchievementsSection';
import NextContestCountdown from './NextContestCountdown';
import NotificationsPreview from './NotificationsPreview';
import ProfileCompletenessNudge from './ProfileCompletenessNudge';
import DailyPracticeCard from './DailyPracticeCard';
import TodaysPlan from './TodaysPlan';
import { PageShell } from '@/app/account/_components/ui';

const DAILY_GOAL = 3;

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} minutes ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  return `${Math.floor(s / 86400)} days ago`;
}

export default function MemberDashboardClient({ firstName, data }) {
  const {
    stats,
    profileChecklist,
    notifications,
    events,
    roadmaps,
    watchData,
    todaySolved,
    weekActivity,
    recentSolves,
    achievements,
  } = data;

  // Header tier / progress — next 50-problem milestone
  const milestone = Math.max(
    50,
    Math.ceil((stats.problemsSolved + 1) / 50) * 50
  );
  const userLevel = {
    level: stats.ratingBand || 'Member',
    title: `${milestone} problems solved`,
    xp: stats.problemsSolved,
    nextLevelXp: milestone,
    unit: 'solved',
    rank: stats.rank,
    totalMembers: stats.totalMembers,
  };

  // Next upcoming event (prefer one the member registered for)
  const nextEvent = events.find((e) => e.registered) || events[0] || null;
  const nextContest = nextEvent
    ? {
        title: nextEvent.title,
        platform: nextEvent.category || 'Event',
        location: nextEvent.location || 'TBA',
        registered: nextEvent.registered,
        startAt: nextEvent.start_date,
        href: '/account/member/events',
      }
    : null;

  const upcomingEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category || 'Event',
    date: e.start_date
      ? new Date(e.start_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'TBA',
    time: e.start_date
      ? new Date(e.start_date).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '',
    location: e.location || 'TBA',
    status: e.registered ? 'Registered' : 'Open',
    attendees: null,
  }));

  // Today's plan — derived from real state
  const todaysPlan = [];
  if (todaySolved < DAILY_GOAL) {
    todaysPlan.push({
      id: 'plan-practice',
      type: 'practice',
      title: `Solve ${DAILY_GOAL - todaySolved} more problem${DAILY_GOAL - todaySolved > 1 ? 's' : ''}`,
      subtitle: "Today's practice goal",
      accent: 'emerald',
      href: '/account/member/problem-solving',
    });
  }
  const activeTrack = roadmaps.find((r) => r.progress > 0 && r.progress < 100);
  if (activeTrack) {
    todaysPlan.push({
      id: 'plan-lesson',
      type: 'lesson',
      title: `Continue ${activeTrack.name}`,
      subtitle: `${activeTrack.completed} of ${activeTrack.total} lessons done`,
      accent: 'pink',
      href: `/account/member/bootcamps/${activeTrack.id}`,
    });
  }
  if (stats.unreadMessages > 0) {
    todaysPlan.push({
      id: 'plan-inbox',
      type: 'reply',
      title: `Review ${stats.unreadMessages} unread notification${stats.unreadMessages > 1 ? 's' : ''}`,
      subtitle: 'Stay on top of club updates',
      accent: 'violet',
      href: '/account/member/notifications',
    });
  }
  const unregistered = events.find((e) => !e.registered);
  if (unregistered) {
    todaysPlan.push({
      id: 'plan-event',
      type: 'contest',
      title: `Register for ${unregistered.title}`,
      subtitle: 'Seats are limited',
      accent: 'amber',
      href: '/account/member/events',
    });
  }

  const recentActivities = recentSolves.map((s) => ({
    action: `Solved “${s.name}” on ${s.platform}`,
    time: timeAgo(s.solvedAt),
    icon: 'CheckCircle',
    tone: 'emerald',
  }));

  return (
    <PageShell>
      <MemberHeader
        firstName={firstName}
        userLevel={userLevel}
        streakDays={stats.streakDays}
      />

      <ProfileCompletenessNudge checklist={profileChecklist} />

      <MemberStatsGrid stats={stats} />

      <div className="relative mt-8 grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="flex flex-col gap-8 xl:col-span-8">
          {nextContest && <NextContestCountdown contest={nextContest} />}
          <DailyPracticeCard
            problem={null}
            todaySolved={todaySolved}
            dailyGoal={DAILY_GOAL}
            weekActivity={weekActivity}
            streak={stats.streakDays}
          />
          <UpcomingEventsSection upcomingEvents={upcomingEvents} />
          {roadmaps.length > 0 && (
            <VideoWatchTime roadmaps={roadmaps} watchData={watchData} />
          )}
        </div>

        <div className="flex flex-col gap-8 xl:col-span-4">
          <div className="sticky top-8 flex flex-col gap-8">
            {todaysPlan.length > 0 && <TodaysPlan items={todaysPlan} />}
            <NotificationsPreview items={notifications} />
            {recentActivities.length > 0 && (
              <RecentActivity recentActivities={recentActivities} />
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-8">
        {roadmaps.length > 0 && <LearningProgress roadmaps={roadmaps} />}
        {achievements.length > 0 && (
          <AchievementsSection achievements={achievements} />
        )}
      </div>
    </PageShell>
  );
}
