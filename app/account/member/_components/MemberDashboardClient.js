/**
 * @file Member dashboard shell — clarity-first layout with a clear
 *   primary/secondary hierarchy.
 *
 * Layout (top → bottom):
 *   1. MemberHeader             — greeting + level + XP + streak (one row)
 *   2. ProfileCompletenessNudge — only when < 100% (dismissible)
 *   3. MemberStatsGrid          — 4 hero metrics
 *   4. Action zone              — 2/3 primary stack + 1/3 side rail
 *        primary: NextContest · ContinueLearning · DailyPractice
 *        rail:    TodaysPlan · NotificationsPreview · RecentActivity
 *   5. UpcomingEvents           — full-width
 *   6. LearningProgress         — full-width
 *   7. AchievementsSection      — demoted (vanity, not actionable)
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

const inHours = (h) => new Date(Date.now() + h * 3600000).toISOString();
const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();

export default function MemberDashboardClient({ session }) {
  const firstName = session.user.name?.split(' ')[0] || 'Member';

  const stats = {
    upcomingEvents: 4,
    achievements: 12,
    completedRoadmaps: 2,
    unreadMessages: 7,
    problemsSolved: 318,
    contestRating: 1547,
    streakDays: 23,
  };

  const userLevel = {
    level: 'Specialist',
    title: 'Intermediate Developer',
    xp: 1250,
    nextLevelXp: 2000,
    membershipStatus: 'Active',
    rank: 47,
    totalMembers: 412,
  };

  // Profile completeness checklist — show nudge only if not 100%
  const profileChecklist = [
    { id: 'avatar', label: 'Avatar', done: true },
    { id: 'bio', label: 'Bio', done: true },
    { id: 'cf', label: 'Codeforces', done: true },
    { id: 'lc', label: 'LeetCode', done: false },
    { id: 'github', label: 'GitHub', done: true },
    { id: 'skills', label: 'Skills', done: false },
    { id: 'cgpa', label: 'CGPA', done: false },
  ];

  // Continue-learning resume target
  const resume = {
    bootcamp: 'DSA Mastery Track',
    lessonTitle: 'Segment Trees · Lazy Propagation',
    moduleIndex: 7,
    lessonIndex: 3,
    duration: 28,
    completedLessons: 46,
    totalLessons: 50,
    remaining: 4,
    lastOpened: '2h ago',
    href: '/account/member/bootcamps',
  };

  // Next registered contest with live countdown
  const nextContest = {
    title: 'NEUPC Monthly Contest #27',
    platform: 'Codeforces',
    location: 'Online',
    registered: 156,
    startAt: inHours(18 + 0.45),
    href: '/account/member/events',
  };

  // Top unread notifications (subset of full inbox)
  const notifications = [
    {
      id: 'n1',
      notification_type: 'event',
      title: 'Web3 Workshop starts in 2 hours',
      message: 'Reminder for your registered event in CSE Seminar Hall.',
      created_at: hoursAgo(0.05),
      is_read: false,
    },
    {
      id: 'n2',
      notification_type: 'mention',
      title: 'Sajid Hossain replied to your thread',
      message: '"How to debug Express middleware order?" — upvoted 12 times.',
      created_at: hoursAgo(0.2),
      is_read: false,
    },
    {
      id: 'n3',
      notification_type: 'achievement',
      title: "You earned the 'Open-Source Contributor' badge",
      message: '5 PRs merged in NEUPC repos this month.',
      created_at: hoursAgo(3),
      is_read: false,
    },
    {
      id: 'n4',
      notification_type: 'system',
      title: 'Codeforces sync completed',
      message: '+12 new submissions imported.',
      created_at: hoursAgo(6),
      is_read: false,
    },
    {
      id: 'n5',
      notification_type: 'mention',
      title: 'Nusrat Jahan mentioned you',
      message: '"@you check this elegant DP transition for LIS!"',
      created_at: hoursAgo(8),
      is_read: false,
    },
    {
      id: 'n6',
      notification_type: 'lesson',
      title: 'New lesson: JWT Authentication',
      message: 'In Full-Stack Web Dev bootcamp · 22 min.',
      created_at: hoursAgo(36),
      is_read: true,
    },
    {
      id: 'n7',
      notification_type: 'event',
      title: "Hackathon '26 registration opens tomorrow",
      message: 'Limited to 312 participants across 78 teams.',
      created_at: hoursAgo(24),
      is_read: true,
    },
  ];

  // Daily practice recommendation
  const dailyProblem = {
    title: 'Two Pointers · Maximum Subarray with Distinct Values',
    difficulty: 'Medium',
    platform: 'Codeforces',
    tags: ['two-pointers', 'sliding-window', 'arrays'],
    solvedBy: 4218,
    estTime: 25,
    href: 'https://codeforces.com/problemset/problem/1234/D',
  };
  const todaySolved = 3;
  const dailyGoal = 5;
  const last7 = [4, 2, 5, 7, 3, 6, todaySolved];

  // Today's plan — derived from registrations, replies, lessons
  const todaysPlan = [
    {
      id: 'p1',
      type: 'practice',
      title: `Solve ${dailyGoal - todaySolved} more problems`,
      subtitle: "Today's daily goal · +50 XP",
      accent: 'emerald',
      href: '/account/member/problem-solving',
    },
    {
      id: 'p2',
      type: 'reply',
      title: 'Reply to 2 unanswered Help Desk threads',
      subtitle: 'You were mentioned · 1 hour overdue',
      accent: 'violet',
      href: '/account/member/discussions',
    },
    {
      id: 'p3',
      type: 'lesson',
      title: 'Finish Segment Trees lesson',
      subtitle: '28 min · resumes from where you stopped',
      accent: 'pink',
      href: '/account/member/bootcamps',
    },
    {
      id: 'p4',
      type: 'contest',
      title: "Confirm seat for Hackathon '26",
      subtitle: 'Registration window closes in 2 days',
      accent: 'amber',
      href: '/account/member/events',
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: 'Web3 & Smart Contract Workshop',
      date: 'May 12, 2026',
      time: '14:00',
      location: 'CSE Seminar Hall',
      status: 'Registered',
      category: 'Workshop',
      accent: 'violet',
      attendees: 84,
    },
    {
      id: 2,
      title: 'Inter-University Hackathon 2026',
      date: 'May 18, 2026',
      time: '09:00',
      location: 'Main Auditorium',
      status: 'Open',
      category: 'Hackathon',
      accent: 'amber',
      attendees: 312,
    },
    {
      id: 3,
      title: 'NEUPC Monthly Contest #27',
      date: 'May 24, 2026',
      time: '20:00',
      location: 'Online · Codeforces',
      status: 'Registered',
      category: 'Contest',
      accent: 'rose',
      attendees: 156,
    },
    {
      id: 4,
      title: 'AI/ML Beginner Bootcamp',
      date: 'Jun 02, 2026',
      time: '10:00',
      location: 'Lab 304',
      status: 'Open',
      category: 'Bootcamp',
      accent: 'emerald',
      attendees: 48,
    },
  ];

  const roadmaps = [
    {
      name: 'Frontend Development',
      progress: 78,
      tone: 'blue',
      completed: 39,
      total: 50,
    },
    {
      name: 'Backend with Node.js',
      progress: 45,
      tone: 'emerald',
      completed: 18,
      total: 40,
    },
    {
      name: 'DSA Mastery Track',
      progress: 92,
      tone: 'violet',
      completed: 46,
      total: 50,
    },
    {
      name: 'System Design',
      progress: 22,
      tone: 'amber',
      completed: 7,
      total: 32,
    },
    {
      name: 'DevOps Foundations',
      progress: 60,
      tone: 'orange',
      completed: 21,
      total: 35,
    },
    {
      name: 'Mobile Dev (Flutter)',
      progress: 12,
      tone: 'rose',
      completed: 4,
      total: 30,
    },
  ];

  const recentActivities = [
    {
      action: 'Solved "Two Pointers Approach" on Codeforces Round 991',
      time: '12 minutes ago',
      icon: 'CheckCircle',
      tone: 'emerald',
    },
    {
      action: 'Registered for NEUPC Monthly Contest #27',
      time: '2 hours ago',
      icon: 'Calendar',
      tone: 'blue',
    },
    {
      action: 'Earned the "30-Day Streak" achievement badge',
      time: '1 day ago',
      icon: 'Award',
      tone: 'amber',
    },
    {
      action: 'Replied to "DP Optimization Tricks" in Help Desk',
      time: '2 days ago',
      icon: 'MessageSquare',
      tone: 'violet',
    },
    {
      action: 'Completed module: "Graph Traversal Patterns"',
      time: '3 days ago',
      icon: 'BookOpen',
      tone: 'cyan',
    },
    {
      action: 'Submitted certificate request for ICPC Regional',
      time: '5 days ago',
      icon: 'FileText',
      tone: 'pink',
    },
  ];

  const achievements = [
    { title: 'ICPC Regionalist', icon: '🏆', earned: true, date: 'Dec 2024' },
    { title: 'Top Contributor', icon: '⭐', earned: true, date: 'Mar 2026' },
    { title: '30-Day Streak', icon: '🔥', earned: true, date: 'May 2026' },
    { title: 'Roadmap Finisher', icon: '🎯', earned: true, date: 'Apr 2026' },
    { title: 'Bootcamp Mentor', icon: '🎓', earned: false, progress: 60 },
    { title: 'Code Reviewer', icon: '👁️', earned: true, date: 'Feb 2026' },
    { title: '100 Problems', icon: '💯', earned: true, date: 'Jan 2026' },
    { title: 'Hackathon Winner', icon: '🚀', earned: false, progress: 30 },
  ];

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
          <NextContestCountdown contest={nextContest} />
          <DailyPracticeCard
            problem={dailyProblem}
            todaySolved={todaySolved}
            dailyGoal={dailyGoal}
            weekActivity={last7}
            streak={stats.streakDays}
          />
          <UpcomingEventsSection upcomingEvents={upcomingEvents} />
          <VideoWatchTime roadmaps={roadmaps} />
        </div>

        <div className="flex flex-col gap-8 xl:col-span-4">
          <div className="sticky top-8 flex flex-col gap-8">
            <TodaysPlan items={todaysPlan} />
            <NotificationsPreview items={notifications} />
            <RecentActivity recentActivities={recentActivities} />
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-8">
        <LearningProgress roadmaps={roadmaps} />
        <AchievementsSection achievements={achievements} />
      </div>
    </PageShell>
  );
}
