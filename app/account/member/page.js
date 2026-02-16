import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles } from '@/app/_lib/data-service';
import RoleSync from '../_components/RoleSync';
import Link from 'next/link';
import {
  Trophy,
  Calendar,
  Award,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Flame,
  Target,
  Users,
  Code,
  Briefcase,
  Zap,
  CheckCircle,
  Clock,
  MapPin,
  ExternalLink,
  Star,
  Activity,
} from 'lucide-react';

export default async function MemberDashboard() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user is member
  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('member')) {
    redirect('/account');
  }

  // Mock stats - replace with real data
  const stats = {
    upcomingEvents: 2,
    achievements: 5,
    completedRoadmaps: 1,
    unreadMessages: 3,
  };

  // Mock user level data
  const userLevel = {
    level: 'Intermediate Developer',
    xp: 1250,
    nextLevelXp: 2000,
    membershipStatus: 'Active',
  };

  // Mock upcoming events
  const upcomingEvents = [
    {
      id: 1,
      title: 'Web3 Development Workshop',
      date: 'Mar 20, 2026',
      time: '2:00 PM',
      location: 'CSE Seminar Hall',
      status: 'Registered',
      image: '🌐',
    },
    {
      id: 2,
      title: 'Inter-University Hackathon',
      date: 'Apr 5, 2026',
      time: '9:00 AM',
      location: 'Main Campus',
      status: 'Not Registered',
      image: '💻',
    },
  ];

  // Mock roadmap progress
  const roadmaps = [
    { name: 'Frontend Development', progress: 65, color: 'blue' },
    { name: 'Backend Development', progress: 30, color: 'green' },
    { name: 'DSA Track', progress: 80, color: 'purple' },
  ];

  // Mock recent activities
  const recentActivities = [
    { action: 'Registered for Web3 Workshop', time: '2 hours ago', icon: Calendar, color: 'blue' },
    { action: 'Completed React Roadmap Module', time: '1 day ago', icon: CheckCircle, color: 'green' },
    { action: 'Earned "Open Source Contributor" badge', time: '3 days ago', icon: Award, color: 'amber' },
    { action: 'Posted in Community Forum', time: '5 days ago', icon: MessageSquare, color: 'purple' },
  ];

  // Mock achievements
  const achievements = [
    { title: 'Hackathon Winner', icon: '🏆', earned: true },
    { title: 'Top Contributor', icon: '⭐', earned: true },
    { title: '30 Days Streak', icon: '🔥', earned: true },
    { title: 'Roadmap Finisher', icon: '🎯', earned: true },
    { title: 'Workshop Organizer', icon: '🎓', earned: false },
    { title: 'Code Master', icon: '💻', earned: false },
  ];

  const firstName = session.user.name?.split(' ')[0] || 'Member';

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="member" />
      
      {/* Welcome Header with Level */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 p-6 backdrop-blur-xl sm:p-8">
        <div className="absolute right-0 top-0 h-40 w-40 bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 bg-purple-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                👋 Welcome back, {firstName}!
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm font-semibold text-blue-300">
                  {userLevel.level}
                </span>
                <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm font-semibold text-green-300">
                  Membership: {userLevel.membershipStatus}
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-xs text-gray-400">XP Progress</p>
                  <p className="text-sm font-bold text-white">
                    {userLevel.xp} / {userLevel.nextLevelXp}
                  </p>
                </div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-linear-to-r from-amber-500 to-orange-500"
                  style={{ width: `${(userLevel.xp / userLevel.nextLevelXp) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <Link
          href="/account/member/events"
          className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20 sm:p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Upcoming Events</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.upcomingEvents}</p>
              <p className="mt-1 text-xs text-blue-400">View calendar</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </Link>

        <Link
          href="/account/member/achievements"
          className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/20 sm:p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Achievements</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.achievements}</p>
              <p className="mt-1 text-xs text-amber-400">Badges earned</p>
            </div>
            <Trophy className="h-8 w-8 text-amber-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </Link>

        <Link
          href="/account/member/roadmap"
          className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/20 sm:p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Roadmaps</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.completedRoadmaps}</p>
              <p className="mt-1 text-xs text-purple-400">Completed</p>
            </div>
            <Target className="h-8 w-8 text-purple-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </Link>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Messages</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.unreadMessages}</p>
              <p className="mt-1 flex items-center text-xs text-green-400">
                <Clock className="mr-1 h-3 w-3" />
                Unread
              </p>
            </div>
            <MessageSquare className="h-8 w-8 text-green-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Upcoming Events - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">📅 Upcoming Events</h2>
                <p className="text-sm text-gray-400">Events you might be interested in</p>
              </div>
              <Link
                href="/account/member/events"
                className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/30"
              >
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="group rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-blue-500/30 hover:bg-white/10"
                >
                  <div className="flex gap-4">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-purple-500 text-3xl">
                      {event.image}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white group-hover:text-blue-300">
                        {event.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {event.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            event.status === 'Registered'
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}
                        >
                          {event.status}
                        </span>
                        {event.status === 'Not Registered' && (
                          <button className="rounded bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/30">
                            Register Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">⚡ Recent Activity</h2>
            <p className="text-sm text-gray-400">Your latest actions</p>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity, idx) => {
              const Icon = activity.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-all duration-200 hover:border-white/20 hover:bg-white/10"
                >
                  <div className={`rounded-full bg-${activity.color}-500/20 p-2`}>
                    <Icon className={`h-4 w-4 text-${activity.color}-400`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{activity.action}</p>
                    <p className="mt-1 text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">🗺 Learning Progress</h2>
            <p className="text-sm text-gray-400">Track your roadmap completion</p>
          </div>
          <Link
            href="/account/member/roadmap"
            className="rounded-lg bg-purple-500/20 px-3 py-1.5 text-sm font-semibold text-purple-300 transition-colors hover:bg-purple-500/30"
          >
            View All
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roadmaps.map((roadmap, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-white/20 hover:bg-white/10"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-white">{roadmap.name}</h3>
                <span className={`text-sm font-bold text-${roadmap.color}-400`}>
                  {roadmap.progress}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-${roadmap.color}-500 transition-all duration-500`}
                  style={{ width: `${roadmap.progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {roadmap.progress >= 80 ? 'Almost there!' : roadmap.progress >= 50 ? 'Great progress!' : 'Keep going!'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements & Quick Access */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Achievements Preview */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">🏆 Achievements</h2>
                <p className="text-sm text-gray-400">Badges you've earned</p>
              </div>
              <Link
                href="/account/member/achievements"
                className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-500/30"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {achievements.map((achievement, idx) => (
                <div
                  key={idx}
                  className={`group rounded-lg border p-4 text-center transition-all duration-200 ${
                    achievement.earned
                      ? 'border-amber-500/30 bg-amber-500/10 hover:border-amber-500/50 hover:bg-amber-500/20'
                      : 'border-white/10 bg-white/5 opacity-50'
                  }`}
                >
                  <div className="text-3xl">{achievement.icon}</div>
                  <p className={`mt-2 text-xs font-semibold ${achievement.earned ? 'text-amber-300' : 'text-gray-500'}`}>
                    {achievement.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-cyan-400" />
              <h3 className="font-bold text-white">Resources</h3>
            </div>
            <p className="mb-4 text-sm text-gray-400">Learning materials</p>
            <Link
              href="/account/member/resources"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/30"
            >
              Browse
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-pink-400" />
              <h3 className="font-bold text-white">Community</h3>
            </div>
            <p className="mb-4 text-sm text-gray-400">Join discussions</p>
            <Link
              href="/account/member/discussions"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-pink-500/20 px-4 py-2 text-sm font-semibold text-pink-300 transition-colors hover:bg-pink-500/30"
            >
              Explore
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

