/**
 * @file Member dashboard shell — composes the redesigned dashboard view
 *   using the shared `_ui` design primitives that mirror the
 *   problem-solving page's visual language.
 * @module MemberDashboardClient
 */

'use client';

import MemberHeader from './MemberHeader';
import MemberStatsGrid from './MemberStatsGrid';
import UpcomingEventsSection from './UpcomingEventsSection';
import RecentActivity from './RecentActivity';
import LearningProgress from './LearningProgress';
import AchievementsSection from './AchievementsSection';
import QuickAccessSection from './QuickAccessSection';
import { PageShell } from './_ui';

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
    { name: 'Frontend Development', progress: 78, tone: 'blue', completed: 39, total: 50 },
    { name: 'Backend with Node.js', progress: 45, tone: 'emerald', completed: 18, total: 40 },
    { name: 'DSA Mastery Track', progress: 92, tone: 'violet', completed: 46, total: 50 },
    { name: 'System Design', progress: 22, tone: 'amber', completed: 7, total: 32 },
    { name: 'DevOps Foundations', progress: 60, tone: 'orange', completed: 21, total: 35 },
    { name: 'Mobile Dev (Flutter)', progress: 12, tone: 'rose', completed: 4, total: 30 },
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

  const last30Activity = [
    1, 0, 2, 3, 1, 0, 4, 2, 5, 3, 1, 2, 6, 4, 3, 2, 1, 0, 3, 5, 4, 2, 6, 7, 3,
    2, 4, 5, 8, 6,
  ];

  return (
    <PageShell>
      <MemberHeader
        firstName={firstName}
        userLevel={userLevel}
        streakDays={stats.streakDays}
      />
      <MemberStatsGrid stats={stats} activity={last30Activity} />

      <div className="grid gap-5 lg:grid-cols-3">
        <UpcomingEventsSection upcomingEvents={upcomingEvents} />
        <RecentActivity recentActivities={recentActivities} />
      </div>

      <LearningProgress roadmaps={roadmaps} />

      <div className="grid gap-5 lg:grid-cols-3">
        <AchievementsSection achievements={achievements} />
        <QuickAccessSection />
      </div>
    </PageShell>
  );
}
