/**
 * @file Member dashboard — personalised landing page showing the
 *   member’s real activity, upcoming events, learning progress, and
 *   quick links to key member features. All widgets are fed from the
 *   database (no mock data): events, notifications, problem-solving
 *   stats, bootcamp enrollments and watch-time activity.
 *
 * @module MemberDashboardPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getPublishedEvents,
  getUserEventRegistrations,
  getUserNotifications,
  getUnreadNotificationsCount,
  getMemberAchievements,
  getMemberDashboardStats,
} from '@/app/_lib/services/data-service';
import {
  getMyEnrollments,
  getBootcampProgress,
  getLearningActivity,
} from '@/app/_lib/actions/bootcamp-actions';
import MemberDashboardClient from './_components/MemberDashboardClient';

export const metadata = { title: 'Dashboard | Member | NEUPC' };

const TONES = ['blue', 'emerald', 'violet', 'amber', 'orange', 'rose'];

function ratingBand(rating) {
  if (!rating) return null;
  if (rating < 1200) return 'Newbie';
  if (rating < 1400) return 'Pupil';
  if (rating < 1600) return 'Specialist';
  if (rating < 1900) return 'Expert';
  if (rating < 2100) return 'Candidate Master';
  return 'Master';
}

function buildDashboard({
  user,
  events,
  registrations,
  notifications,
  unreadCount,
  memberAchievements,
  enrollments,
  learningActivity,
  psStats,
  roadmaps,
}) {
  const {
    memberProfile,
    handles,
    userStats,
    globalRank,
    totalRanked,
    recentSolves,
  } = psStats;

  // ── Watch-time chart data (last 7 days, real learning activity) ────
  const now = Date.now();
  const bootcampTitleById = Object.fromEntries(
    (enrollments || [])
      .filter((e) => e.bootcamps?.id)
      .map((e) => [e.bootcamps.id, e.bootcamps.title])
  );
  const watchByDate = {};
  for (const row of learningActivity || []) {
    const key = row.activity_date;
    if (!watchByDate[key]) watchByDate[key] = { minutes: 0, videos: [] };
    watchByDate[key].minutes += Math.round((row.watch_seconds || 0) / 60);
    for (const lesson of row.completed_lessons || []) {
      watchByDate[key].videos.push({
        title: lesson.title,
        course: bootcampTitleById[row.bootcamp_id] || 'Bootcamp',
        minutes: Math.round((lesson.watch_time || 0) / 60),
      });
    }
  }
  const watchData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      minutes: watchByDate[key]?.minutes || 0,
      videos: watchByDate[key]?.videos || [],
    };
  });

  // ── Problem-solving aggregates ──────────────────────────────────────
  const bestHandle = (handles || []).reduce(
    (best, h) => ((h.rating || 0) > (best?.rating || 0) ? h : best),
    null
  );
  const solvesPerDay = Array(7).fill(0);
  const todayKey = new Date(now).toISOString().slice(0, 10);
  for (const s of recentSolves || []) {
    const diff = Math.floor((now - new Date(s.first_solved_at)) / 86400000);
    if (diff >= 0 && diff < 7) solvesPerDay[6 - diff] += 1;
  }
  const todaySolved = (recentSolves || []).filter((s) =>
    (s.first_solved_at || '').startsWith(todayKey)
  ).length;

  const upcomingEventsList = (events || []).filter(
    (e) => e.start_date && new Date(e.start_date).getTime() > now
  );

  const dashboard = {
    stats: {
      problemsSolved: userStats?.total_solved ?? 0,
      solvedThisWeek:
        userStats?.solved_this_week ?? solvesPerDay.reduce((a, b) => a + b, 0),
      contestRating: bestHandle?.rating ?? null,
      ratingPlatform: bestHandle?.platform?.name ?? null,
      ratingBand: ratingBand(bestHandle?.rating),
      platformCount: (handles || []).length,
      upcomingEvents: upcomingEventsList.length,
      achievements: (memberAchievements || []).length,
      unreadMessages: unreadCount,
      streakDays: userStats?.current_streak ?? 0,
      longestStreak: userStats?.longest_streak ?? 0,
      rank: globalRank,
      totalMembers: totalRanked,
    },
    profileChecklist: [
      { id: 'avatar', label: 'Avatar', done: Boolean(user.avatar_url) },
      { id: 'bio', label: 'Bio', done: Boolean(memberProfile?.bio) },
      {
        id: 'skills',
        label: 'Skills',
        done: (memberProfile?.skills || []).length > 0,
      },
      { id: 'cgpa', label: 'CGPA', done: memberProfile?.cgpa != null },
      {
        id: 'handles',
        label: 'Judge handles',
        done: (handles || []).length > 0,
      },
    ],
    notifications: notifications || [],
    events: upcomingEventsList
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      .slice(0, 4)
      .map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        category: e.category,
        start_date: e.start_date,
        location: e.location,
        registered: (registrations || []).some((r) => r.events?.id === e.id),
      })),
    roadmaps,
    watchData,
    todaySolved,
    weekActivity: solvesPerDay,
    recentSolves: (recentSolves || []).slice(0, 6).map((s) => ({
      name: s.problems?.name,
      platform: s.problems?.platforms?.name || s.problems?.platforms?.code,
      solvedAt: s.first_solved_at,
    })),
    achievements: (memberAchievements || []).map((row) => ({
      title: row.achievements?.title || 'Achievement',
      icon: '🏆',
      earned: true,
      date: row.achievements?.achievement_date
        ? new Date(row.achievements.achievement_date).toLocaleDateString(
            'en-US',
            { month: 'short', year: 'numeric' }
          )
        : '',
    })),
  };

  return dashboard;
}

export default async function MemberDashboardPage() {
  const { user } = await requireRole('member');

  const [
    events,
    registrations,
    notifications,
    unreadCount,
    memberAchievements,
    enrollments,
    learningActivity,
    psStats,
  ] = await Promise.all([
    getPublishedEvents().catch(() => []),
    getUserEventRegistrations(user.id).catch(() => []),
    getUserNotifications(user.id, 7).catch(() => []),
    getUnreadNotificationsCount(user.id).catch(() => 0),
    getMemberAchievements(user.id).catch(() => []),
    getMyEnrollments().catch(() => []),
    getLearningActivity(null, 7).catch(() => []),
    getMemberDashboardStats(user.id).catch(() => ({
      memberProfile: null,
      handles: [],
      userStats: null,
      globalRank: null,
      totalRanked: 0,
      recentSolves: [],
    })),
  ]);

  // Bootcamp progress (same approach as the bootcamps page)
  const activeEnrollments = (enrollments || []).filter(
    (e) => e.bootcamps?.id && e.bootcamps.status !== 'archived'
  );
  const progressList = await Promise.all(
    activeEnrollments.map((e) =>
      getBootcampProgress(e.bootcamps.id).catch(() => null)
    )
  );
  const roadmaps = activeEnrollments.map((e, i) => {
    const p = progressList[i] || {};
    const total = p.totalLessons ?? e.bootcamps?.lesson_count ?? 0;
    const completed =
      p.completedLessons ??
      Object.values(p.lessonProgress || {}).filter((lp) => lp?.completed)
        .length;
    return {
      id: e.bootcamps.id,
      name: e.bootcamps.title,
      tone: TONES[i % TONES.length],
      completed,
      total,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const dashboard = buildDashboard({
    user,
    events,
    registrations,
    notifications,
    unreadCount,
    memberAchievements,
    enrollments,
    learningActivity,
    psStats,
    roadmaps,
  });

  return (
    <MemberDashboardClient
      firstName={user.full_name?.split(' ')[0] || 'Member'}
      data={dashboard}
    />
  );
}
