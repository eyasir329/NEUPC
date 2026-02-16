import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles } from '@/app/_lib/data-service';
import RoleSync from '../_components/RoleSync';
import Link from 'next/link';
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  Star,
  MessageSquare,
  Video,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BookOpen,
  Target,
  Award,
  BarChart3,
  UserPlus,
  FileText,
  ExternalLink,
} from 'lucide-react';

export default async function MentorDashboard() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user is mentor
  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('mentor')) {
    redirect('/account');
  }

  // Mock stats - replace with real data
  const stats = {
    activeMentees: 18,
    upcomingSessions: 3,
    completedSessions: 47,
    averageRating: 4.8,
    completionRate: 92,
    unreadMessages: 5,
  };

  // Mock upcoming sessions
  const todaySessions = [
    {
      id: 1,
      title: 'React Fundamentals',
      mentee: 'Aisha Rahman',
      time: '4:00 PM',
      type: '1:1',
      platform: 'Google Meet',
      status: 'upcoming',
    },
    {
      id: 2,
      title: 'Backend Debugging Session',
      mentee: 'Rahul Sharma',
      time: '6:30 PM',
      type: 'Group',
      platform: 'Zoom',
      status: 'upcoming',
    },
    {
      id: 3,
      title: 'Career Guidance',
      mentee: 'Sara Ahmed',
      time: '8:00 PM',
      type: '1:1',
      platform: 'Google Meet',
      status: 'upcoming',
    },
  ];

  // Mock mentee progress
  const menteeProgress = [
    {
      id: 1,
      name: 'Aisha Rahman',
      roadmap: 'Frontend Development',
      progress: 70,
      status: 'On Track',
      lastSession: '2 days ago',
      statusColor: 'green',
    },
    {
      id: 2,
      name: 'Rahul Sharma',
      roadmap: 'Backend Development',
      progress: 45,
      status: 'Needs Attention',
      lastSession: '5 days ago',
      statusColor: 'amber',
    },
    {
      id: 3,
      name: 'Sara Ahmed',
      roadmap: 'DSA Track',
      progress: 85,
      status: 'Excellent',
      lastSession: 'Yesterday',
      statusColor: 'emerald',
    },
    {
      id: 4,
      name: 'John Doe',
      roadmap: 'Full Stack',
      progress: 60,
      status: 'On Track',
      lastSession: '3 days ago',
      statusColor: 'green',
    },
  ];

  // Mock recent activities
  const recentActivities = [
    { action: 'Completed session with Aisha on React Hooks', time: '1 hour ago', icon: CheckCircle, color: 'green' },
    { action: 'New mentee request from David Lee', time: '3 hours ago', icon: UserPlus, color: 'blue' },
    { action: 'Uploaded new Backend resources', time: '1 day ago', icon: BookOpen, color: 'purple' },
    { action: 'Received 5-star rating from Sara', time: '2 days ago', icon: Star, color: 'amber' },
  ];

  const mentorName = session.user.name?.split(' ')[0] || 'Mentor';

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="mentor" />
      
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 p-6 backdrop-blur-xl sm:p-8">
        <div className="absolute right-0 top-0 h-40 w-40 bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 bg-blue-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                👨‍🏫 Welcome back, {mentorName}!
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-300">
                  Technical Mentor
                </span>
                <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-300">
                  <Star className="h-3 w-3 fill-amber-300" />
                  {stats.averageRating} Rating
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-xs text-gray-400">Completion Rate</p>
                  <p className="text-sm font-bold text-white">{stats.completionRate}%</p>
                </div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-linear-to-r from-emerald-500 to-blue-500"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Link
          href="/account/mentor/mentees"
          className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20 sm:p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Active Mentees</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.activeMentees}</p>
            </div>
            <Users className="h-8 w-8 text-blue-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </Link>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Upcoming</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.upcomingSessions}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Completed</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.completedSessions}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Avg. Rating</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.averageRating}</p>
            </div>
            <Star className="h-8 w-8 fill-amber-400 text-amber-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Completion</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.completionRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-cyan-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Messages</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.unreadMessages}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-pink-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Today's Schedule - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">📅 Today's Schedule</h2>
                <p className="text-sm text-gray-400">Your upcoming mentoring sessions</p>
              </div>
              <Link
                href="/account/mentor/sessions"
                className="rounded-lg bg-green-500/20 px-3 py-1.5 text-sm font-semibold text-green-300 transition-colors hover:bg-green-500/30"
              >
                + Schedule
              </Link>
            </div>
            <div className="space-y-4">
              {todaySessions.map((session) => (
                <div
                  key={session.id}
                  className="group rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-green-500/30 hover:bg-white/10"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-green-500 to-emerald-500">
                        <Video className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white group-hover:text-green-300">
                          {session.title}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {session.mentee}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.time}
                          </span>
                          <span>•</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            session.type === '1:1' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {session.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 rounded-lg bg-green-500/20 px-4 py-2 text-sm font-semibold text-green-300 transition-colors hover:bg-green-500/30">
                      Join <ExternalLink className="h-4 w-4" />
                    </button>
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
            <p className="text-sm text-gray-400">Latest updates</p>
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

      {/* Mentee Progress Overview */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">👥 Mentee Progress Overview</h2>
            <p className="text-sm text-gray-400">Track your mentees' learning journey</p>
          </div>
          <Link
            href="/account/mentor/mentees"
            className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/30"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <div className="grid gap-3">
              {menteeProgress.map((mentee) => (
                <div
                  key={mentee.id}
                  className="grid grid-cols-1 gap-3 rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-white/20 hover:bg-white/10 sm:grid-cols-12 sm:items-center"
                >
                  <div className="sm:col-span-3">
                    <p className="font-semibold text-white">{mentee.name}</p>
                    <p className="mt-1 text-xs text-gray-400">{mentee.roadmap}</p>
                  </div>
                  <div className="sm:col-span-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full bg-${mentee.statusColor}-500 transition-all duration-500`}
                          style={{ width: `${mentee.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-white">{mentee.progress}%</span>
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                        mentee.statusColor === 'emerald'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : mentee.statusColor === 'green'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {mentee.status === 'Excellent' && <CheckCircle className="h-3 w-3" />}
                      {mentee.status === 'On Track' && <Target className="h-3 w-3" />}
                      {mentee.status === 'Needs Attention' && <AlertCircle className="h-3 w-3" />}
                      {mentee.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:col-span-3 sm:justify-end">
                    <span className="text-xs text-gray-400">Last: {mentee.lastSession}</span>
                    <button className="rounded bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/30">
                      Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        <Link
          href="/account/mentor/roadmaps"
          className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/30 hover:bg-white/10 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-6 w-6 text-purple-400" />
            <h3 className="font-bold text-white">Roadmaps</h3>
          </div>
          <p className="mb-4 text-sm text-gray-400">Assign & track learning paths</p>
          <div className="flex items-center text-sm font-semibold text-purple-300">
            Manage <ExternalLink className="ml-2 h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/account/mentor/resources"
          className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/10 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-cyan-400" />
            <h3 className="font-bold text-white">Resources</h3>
          </div>
          <p className="mb-4 text-sm text-gray-400">Upload materials & guides</p>
          <div className="flex items-center text-sm font-semibold text-cyan-300">
            Browse <ExternalLink className="ml-2 h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/account/mentor/reports"
          className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:border-amber-500/30 hover:bg-white/10 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-amber-400" />
            <h3 className="font-bold text-white">Reports</h3>
          </div>
          <p className="mb-4 text-sm text-gray-400">Analytics & insights</p>
          <div className="flex items-center text-sm font-semibold text-amber-300">
            View Stats <ExternalLink className="ml-2 h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/account/mentor/announcements"
          className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:border-pink-500/30 hover:bg-white/10 sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-6 w-6 text-pink-400" />
            <h3 className="font-bold text-white">Announcements</h3>
          </div>
          <p className="mb-4 text-sm text-gray-400">Post updates & reminders</p>
          <div className="flex items-center text-sm font-semibold text-pink-300">
            Create <ExternalLink className="ml-2 h-4 w-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}


