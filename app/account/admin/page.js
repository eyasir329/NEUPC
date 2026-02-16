import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles } from '@/app/_lib/data-service';
import RoleSync from '../_components/RoleSync';
import Link from 'next/link';
import {
  Users,
  Calendar,
  Shield,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Activity,
  Clock,
  Database,
  Settings,
  FileText,
  UserCheck,
  Award,
  MessageSquare,
  BarChart3,
  Layers,
  Lock,
  Zap,
  ExternalLink,
  Bell,
  Server,
} from 'lucide-react';

export default async function AdminDashboard() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user is admin
  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('admin')) {
    redirect('/account');
  }

  // Mock stats - replace with real data
  const stats = {
    totalUsers: 1248,
    activeMembers: 856,
    mentors: 32,
    upcomingEvents: 8,
    pendingApprovals: 12,
    systemHealth: 98,
  };

  // Mock recent activities
  const recentActivities = [
    { action: 'New user registration: Aisha Rahman', time: '5 min ago', type: 'user', icon: UserCheck },
    { action: 'Event approved: Web3 Workshop', time: '15 min ago', type: 'event', icon: CheckCircle },
    { action: 'Role updated: John Doe → Mentor', time: '1 hour ago', type: 'role', icon: Shield },
    { action: 'System backup completed', time: '2 hours ago', type: 'system', icon: Database },
  ];

  // Mock pending approvals
  const pendingApprovals = [
    { id: 1, type: 'Member Application', user: 'Sarah Ahmed', date: 'Feb 15' },
    { id: 2, type: 'Event Request', user: 'John Doe', date: 'Feb 15' },
    { id: 3, type: 'Mentor Application', user: 'Mike Chen', date: 'Feb 14' },
  ];

  // Mock system stats
  const systemStats = [
    { label: 'User Growth', value: '+12.5%', trend: 'up', color: 'green' },
    { label: 'Event Participation', value: '87%', trend: 'up', color: 'blue' },
    { label: 'Mentor Response Rate', value: '94%', trend: 'up', color: 'purple' },
    { label: 'System Uptime', value: '99.9%', trend: 'stable', color: 'cyan' },
  ];

  // Admin quick actions
  const quickActions = [
    { title: 'Users', icon: Users, count: stats.totalUsers, link: '/account/admin/users', color: 'blue' },
    { title: 'Roles', icon: Shield, count: '6 types', link: '/account/admin/roles', color: 'purple' },
    { title: 'Events', icon: Calendar, count: stats.upcomingEvents, link: '/account/admin/events', color: 'green' },
    { title: 'Analytics', icon: BarChart3, count: 'Reports', link: '/account/admin/analytics', color: 'amber' },
    { title: 'Content', icon: FileText, count: 'Manage', link: '/account/admin/content', color: 'pink' },
    { title: 'Settings', icon: Settings, count: 'Configure', link: '/account/admin/settings', color: 'cyan' },
  ];

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="admin" />
      
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-linear-to-br from-red-500/10 via-orange-500/10 to-amber-500/10 p-6 backdrop-blur-xl sm:p-8">
        <div className="absolute right-0 top-0 h-40 w-40 bg-red-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 bg-orange-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                🛠️ Admin Control Center
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-sm font-semibold text-red-300">
                  <Shield className="h-4 w-4" />
                  Full Access
                </span>
                <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-sm font-semibold text-green-300">
                  <Activity className="h-4 w-4" />
                  System Healthy
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-gray-400">System Health</p>
                  <p className="text-sm font-bold text-white">{stats.systemHealth}%</p>
                </div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-linear-to-r from-green-500 to-cyan-500"
                  style={{ width: `${stats.systemHealth}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Total Users</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Active Members</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.activeMembers}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Mentors</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.mentors}</p>
            </div>
            <Award className="h-8 w-8 text-purple-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Events</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.upcomingEvents}</p>
            </div>
            <Calendar className="h-8 w-8 text-amber-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Pending</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.pendingApprovals}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Health</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.systemHealth}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-cyan-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>
      </div>

      {/* System Performance Metrics */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-4">
        {systemStats.map((stat, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-400">{stat.label}</p>
              {stat.trend === 'up' && (
                <TrendingUp className={`h-4 w-4 text-${stat.color}-400`} />
              )}
            </div>
            <p className={`mt-2 text-2xl font-bold text-${stat.color}-400`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Pending Approvals - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">⚠️ Pending Approvals</h2>
                <p className="text-sm text-gray-400">Items requiring your attention</p>
              </div>
              <Link
                href="/account/admin/approvals"
                className="rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/30"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {pendingApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-red-500/30 hover:bg-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-500/20">
                      <AlertCircle className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{approval.type}</h3>
                      <p className="mt-1 text-xs text-gray-400">
                        {approval.user} • {approval.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded-lg bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-300 transition-colors hover:bg-green-500/30">
                      Approve
                    </button>
                    <button className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/30">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity, idx) => {
              const Icon = activity.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-all duration-200 hover:border-white/20 hover:bg-white/10"
                >
                  <div className={`rounded-full bg-${activity.type === 'user' ? 'blue' : activity.type === 'event' ? 'green' : activity.type === 'role' ? 'purple' : 'cyan'}-500/20 p-2`}>
                    <Icon className={`h-4 w-4 text-${activity.type === 'user' ? 'blue' : activity.type === 'event' ? 'green' : activity.type === 'role' ? 'purple' : 'cyan'}-400`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{activity.action}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Admin Quick Actions */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">⚡ Quick Actions</h2>
          <p className="text-sm text-gray-400">Administrative tools and management</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link
                key={idx}
                href={action.link}
                className="group rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/10"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className={`rounded-lg bg-${action.color}-500/20 p-2`}>
                    <Icon className={`h-5 w-5 text-${action.color}-400`} />
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <h3 className="font-semibold text-white">{action.title}</h3>
                <p className="mt-1 text-xs text-gray-400">
                  {typeof action.count === 'number' ? action.count : action.count}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* System Overview & Management */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* System Notifications */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-white">System Notifications</h3>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-amber-300">
                    Database backup scheduled
                  </p>
                  <p className="mt-1 text-xs text-gray-400">Tonight at 2:00 AM</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 text-green-400" />
                <div>
                  <p className="text-sm font-semibold text-green-300">
                    All systems operational
                  </p>
                  <p className="mt-1 text-xs text-gray-400">Last checked: 5 min ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-400" />
            <h3 className="font-bold text-white">Management</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/account/admin/system-logs"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 transition-all hover:border-white/20 hover:bg-white/10"
            >
              <FileText className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-semibold text-white">System Logs</span>
            </Link>
            <Link
              href="/account/admin/security"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 transition-all hover:border-white/20 hover:bg-white/10"
            >
              <Lock className="h-4 w-4 text-red-400" />
              <span className="text-sm font-semibold text-white">Security</span>
            </Link>
            <Link
              href="/account/admin/export"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 transition-all hover:border-white/20 hover:bg-white/10"
            >
              <Database className="h-4 w-4 text-green-400" />
              <span className="text-sm font-semibold text-white">Export Data</span>
            </Link>
            <Link
              href="/account/admin/contact-submissions"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 transition-all hover:border-white/20 hover:bg-white/10"
            >
              <MessageSquare className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">Messages</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

