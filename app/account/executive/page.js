import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles } from '@/app/_lib/data-service';
import RoleSync from '../_components/RoleSync';
import Link from 'next/link';
import {
  Calendar,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Bell,
  Image,
  Award,
  ArrowUpRight,
  Clock,
  UserCheck,
  Megaphone,
  BarChart3,
  Crown,
  Plus,
  Activity,
  UserPlus,
  Eye,
  Settings,
} from 'lucide-react';

export default async function ExecutiveDashboard() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user is executive
  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('executive')) {
    redirect('/account');
  }

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
      icon: UserCheck,
    },
    {
      id: 2,
      type: 'applications',
      count: 3,
      label: 'Membership Applications',
      color: 'amber',
      icon: UserPlus,
    },
    {
      id: 3,
      type: 'blogs',
      count: 2,
      label: 'Blogs Awaiting Review',
      color: 'blue',
      icon: FileText,
    },
    {
      id: 4,
      type: 'events',
      count: 1,
      label: 'Events Needs Approval',
      color: 'orange',
      icon: Calendar,
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

      {/* Header with Role Badge */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 p-6 backdrop-blur-xl sm:p-8">
        <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 bg-purple-500/20 blur-3xl" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <Crown className="h-6 w-6 text-amber-400" />
            <span className="rounded-full bg-amber-400/20 px-3 py-1 text-sm font-semibold text-amber-300">
              Executive Committee
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white md:text-4xl">
            Executive Dashboard
          </h1>
          <p className="mt-2 text-gray-300">
            Term: 2025–2026 • Manage events, members, and content operations
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <div className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Total Events</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {stats.totalEvents}
              </p>
              <p className="mt-1 flex items-center text-xs text-green-400">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                +12%
              </p>
            </div>
            <Calendar className="h-9 w-9 text-blue-400 opacity-80 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        <div className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">
                Active Members
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {stats.activeMembers}
              </p>
              <p className="mt-1 flex items-center text-xs text-green-400">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                +8%
              </p>
            </div>
            <Users className="h-9 w-9 text-green-400 opacity-80 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        <div className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">
                Pending Registrations
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {stats.pendingRegistrations}
              </p>
              <p className="mt-1 flex items-center text-xs text-amber-400">
                <Clock className="mr-1 h-3 w-3" />
                Needs Review
              </p>
            </div>
            <AlertCircle className="h-9 w-9 text-amber-400 opacity-80 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        <div className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">
                Total Participation
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {stats.totalParticipation}
              </p>
              <p className="mt-1 flex items-center text-xs text-green-400">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                +15%
              </p>
            </div>
            <TrendingUp className="h-9 w-9 text-purple-400 opacity-80 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        <div className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-pink-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">
                Active Notices
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {stats.activeNotices}
              </p>
              <p className="mt-1 flex items-center text-xs text-blue-400">
                <Activity className="mr-1 h-3 w-3" />
                Live
              </p>
            </div>
            <Megaphone className="h-9 w-9 text-pink-400 opacity-80 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        <div className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">
                Engagement Rate
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {stats.engagementRate}%
              </p>
              <p className="mt-1 flex items-center text-xs text-green-400">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                +5%
              </p>
            </div>
            <BarChart3 className="h-9 w-9 text-cyan-400 opacity-80 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>
      </div>

      {/* Pending Actions Section - IMPORTANT */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 backdrop-blur-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">⚡ Pending Actions</h2>
            <p className="text-sm text-gray-400">
              Items requiring immediate attention
            </p>
          </div>
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-300">
            {pendingActions.reduce((sum, action) => sum + action.count, 0)}{' '}
            Total
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pendingActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                className={`group cursor-pointer rounded-lg border border-${action.color}-500/30 bg-${action.color}-500/10 p-4 transition-all duration-200 hover:border-${action.color}-500/50 hover:bg-${action.color}-500/20`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 text-${action.color}-400`} />
                  <span
                    className={`text-2xl font-bold text-${action.color}-300`}
                  >
                    {action.count}
                  </span>
                </div>
                <p
                  className={`mt-2 text-sm font-semibold text-${action.color}-300`}
                >
                  {action.label}
                </p>
                <button
                  className={`mt-2 text-xs text-${action.color}-400 transition-colors hover:text-${action.color}-300`}
                >
                  View Details →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Upcoming Events Panel */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                📅 Upcoming Events
              </h2>
              <p className="text-sm text-gray-400">Manage event operations</p>
            </div>
            <Link
              href="/account/executive/events/manage"
              className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/30"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="group rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-blue-500/30 hover:bg-white/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white group-hover:text-blue-300">
                      {event.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">{event.date}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      event.statusColor === 'green'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    <Users className="mr-1 inline h-4 w-4" />
                    {event.registrations} Registered
                  </span>
                  <div className="flex gap-2">
                    <button className="rounded bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/30">
                      Manage
                    </button>
                    <button className="rounded bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300 transition-colors hover:bg-purple-500/30">
                      Registrations
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Members Overview */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                👥 Recent Members
              </h2>
              <p className="text-sm text-gray-400">Last 7 days</p>
            </div>
            <Link
              href="/account/executive/members"
              className="rounded-lg bg-green-500/20 px-3 py-1.5 text-sm font-semibold text-green-300 transition-colors hover:bg-green-500/30"
            >
              Manage
            </Link>
          </div>
          <div className="space-y-3">
            {recentMembers.map((member, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 transition-all duration-200 hover:border-green-500/30 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-500 text-sm font-bold text-white">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{member.name}</p>
                    <p className="text-xs text-gray-400">{member.joinDate}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    member.activity === 'High'
                      ? 'bg-green-500/20 text-green-300'
                      : member.activity === 'Medium'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {member.activity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Latest Notices & Quick Access Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Latest Notices */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  📰 Latest Notices
                </h2>
                <p className="text-sm text-gray-400">Recent announcements</p>
              </div>
              <Link
                href="/account/executive/notices/create"
                className="flex items-center gap-1 rounded-lg bg-pink-500/20 px-3 py-1.5 text-sm font-semibold text-pink-300 transition-colors hover:bg-pink-500/30"
              >
                <Plus className="h-4 w-4" />
                Create
              </Link>
            </div>
            <div className="space-y-3">
              {latestNotices.map((notice, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-pink-500/30 hover:bg-white/10"
                >
                  <div>
                    <h3 className="font-semibold text-white">{notice.title}</h3>
                    <p className="mt-1 text-xs text-gray-400">{notice.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        notice.status === 'Published'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {notice.status}
                    </span>
                    <button className="rounded bg-blue-500/20 p-2 text-blue-300 transition-colors hover:bg-blue-500/30">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="space-y-4">
          {/* Gallery Quick Access */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <Image className="h-5 w-5 text-cyan-400" />
              <h3 className="font-bold text-white">Gallery</h3>
            </div>
            <p className="mb-4 text-sm text-gray-400">Manage club photos</p>
            <Link
              href="/account/executive/gallery/manage"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/30"
            >
              <Plus className="h-4 w-4" />
              Upload
            </Link>
          </div>

          {/* Certificate Generator */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400" />
              <h3 className="font-bold text-white">Certificates</h3>
            </div>
            <p className="mb-4 text-sm text-gray-400">Generate certificates</p>
            <Link
              href="/account/executive/certificates/generate"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-500/30"
            >
              <Settings className="h-4 w-4" />
              Generate
            </Link>
          </div>

          {/* Reports Quick Access */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              <h3 className="font-bold text-white">Reports</h3>
            </div>
            <p className="mb-4 text-sm text-gray-400">Analytics & insights</p>
            <Link
              href="/account/executive/reports"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-semibold text-purple-300 transition-colors hover:bg-purple-500/30"
            >
              <Eye className="h-4 w-4" />
              View
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
