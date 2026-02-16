import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles } from '@/app/_lib/data-service';
import RoleSync from '../_components/RoleSync';
import Link from 'next/link';
import {
  Users,
  Calendar,
  Trophy,
  TrendingUp,
  DollarSign,
  ClipboardCheck,
  Shield,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Download,
  MessageSquare,
  BarChart3,
  Target,
  Award,
  Percent,
} from 'lucide-react';

export default async function AdvisorDashboard() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user is advisor
  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('advisor')) {
    redirect('/account');
  }

  // Mock stats - replace with real data
  const stats = {
    totalMembers: 156,
    eventsSemester: 12,
    achievementsYear: 18,
    participationGrowth: 25,
    budgetUtilization: 68,
    pendingApprovals: 3,
  };

  // Mock committee data
  const committee = [
    { role: 'President', name: 'Ahmed Rahman', status: 'Active', term: '2025-2026' },
    { role: 'Vice President', name: 'Fatima Khan', status: 'Active', term: '2025-2026' },
    { role: 'Secretary', name: 'Mehedi Hasan', status: 'Active', term: '2025-2026' },
  ];

  // Mock events data
  const recentEvents = [
    { name: 'Inter-University Programming Contest', type: 'Contest', date: 'Mar 15, 2026', participants: 45, status: 'Upcoming', approval: 'Approved' },
    { name: 'Web Development Workshop', type: 'Workshop', date: 'Mar 22, 2026', participants: 32, status: 'Upcoming', approval: 'Approved' },
    { name: 'AI/ML Seminar Series', type: 'Seminar', date: 'Apr 5, 2026', participants: 28, status: 'Planning', approval: 'Pending' },
  ];

  // Mock achievements
  const achievements = [
    { title: 'ICPC Dhaka Regional - 2nd Place', date: 'Jan 2026', category: 'Contest' },
    { title: 'National Hackathon Winner', date: 'Dec 2025', category: 'Hackathon' },
    { title: 'Research Paper Published', date: 'Nov 2025', category: 'Research' },
  ];

  // Mock pending approvals
  const pendingApprovals = [
    { id: 1, type: 'Event Proposal', title: 'International Workshop on Cloud Computing', submittedBy: 'Executive Committee', date: 'Feb 14, 2026', priority: 'High' },
    { id: 2, type: 'Budget Request', title: 'Additional Equipment Purchase', submittedBy: 'Admin', date: 'Feb 13, 2026', priority: 'Medium' },
    { id: 3, type: 'Policy Change', title: 'New Membership Criteria Update', submittedBy: 'Executive Committee', date: 'Feb 12, 2026', priority: 'Low' },
  ];

  // Mock budget data
  const budgetData = {
    allocated: 150000,
    used: 102000,
    remaining: 48000,
  };

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="advisor" />
      
      {/* Header with Role Badge */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-slate-500/10 via-blue-500/10 to-indigo-500/10 p-6 backdrop-blur-xl sm:p-8">
        <div className="absolute right-0 top-0 h-40 w-40 bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 bg-indigo-500/10 blur-3xl" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-400" />
            <span className="rounded-full bg-indigo-400/20 px-3 py-1 text-sm font-semibold text-indigo-300">
              Faculty Advisor
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white md:text-4xl">Advisor Dashboard</h1>
          <p className="mt-2 text-gray-300">
            Strategic Oversight • Policy Guidance • Institutional Alignment
          </p>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Total Members</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.totalMembers}</p>
              <p className="mt-1 text-xs text-gray-400">Active students</p>
            </div>
            <Users className="h-8 w-8 text-blue-400 opacity-70" />
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/10 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Events - Semester</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.eventsSemester}</p>
              <p className="mt-1 text-xs text-gray-400">This semester</p>
            </div>
            <Calendar className="h-8 w-8 text-green-400 opacity-70" />
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Achievements</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.achievementsYear}</p>
              <p className="mt-1 text-xs text-gray-400">This year</p>
            </div>
            <Trophy className="h-8 w-8 text-amber-400 opacity-70" />
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Growth Rate</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.participationGrowth}%</p>
              <p className="mt-1 flex items-center text-xs text-green-400">
                <TrendingUp className="mr-1 h-3 w-3" />
                Increasing
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-400 opacity-70" />
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Budget Status</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.budgetUtilization}%</p>
              <p className="mt-1 text-xs text-gray-400">Utilized</p>
            </div>
            <DollarSign className="h-8 w-8 text-cyan-400 opacity-70" />
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/10 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Pending Approvals</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.pendingApprovals}</p>
              <p className="mt-1 flex items-center text-xs text-orange-400">
                <Clock className="mr-1 h-3 w-3" />
                Action needed
              </p>
            </div>
            <ClipboardCheck className="h-8 w-8 text-orange-400 opacity-70" />
          </div>
        </div>
      </div>

      {/* Approval Center - Priority Section */}
      <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 backdrop-blur-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">📋 Approval Center</h2>
            <p className="text-sm text-gray-400">Items requiring your review</p>
          </div>
          <Link
            href="/account/advisor/approvals"
            className="rounded-lg bg-orange-500/20 px-3 py-1.5 text-sm font-semibold text-orange-300 transition-colors hover:bg-orange-500/30"
          >
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {pendingApprovals.map((approval) => (
            <div
              key={approval.id}
              className="rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-orange-500/30 hover:bg-white/10"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-300">
                      {approval.type}
                    </span>
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      approval.priority === 'High' ? 'bg-red-500/20 text-red-300' :
                      approval.priority === 'Medium' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {approval.priority} Priority
                    </span>
                  </div>
                  <h3 className="mt-2 font-semibold text-white">{approval.title}</h3>
                  <p className="mt-1 text-xs text-gray-400">
                    By {approval.submittedBy} • {approval.date}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 rounded bg-green-500/20 px-3 py-1.5 text-xs font-semibold text-green-300 transition-colors hover:bg-green-500/30">
                    <CheckCircle className="h-3 w-3" />
                    Approve
                  </button>
                  <button className="flex items-center gap-1 rounded bg-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/30">
                    <Eye className="h-3 w-3" />
                    Review
                  </button>
                  <button className="flex items-center gap-1 rounded bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/30">
                    <XCircle className="h-3 w-3" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Club Overview */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">🏛 Club Overview</h2>
              <p className="text-sm text-gray-400">Committee structure</p>
            </div>
            <Link
              href="/account/advisor/club-overview"
              className="rounded-lg bg-indigo-500/20 px-3 py-1.5 text-sm font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/30"
            >
              Details
            </Link>
          </div>
          <div className="space-y-3">
            {committee.map((member, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 transition-all duration-200 hover:border-indigo-500/30 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-blue-500 text-sm font-bold text-white">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{member.name}</p>
                    <p className="text-xs text-gray-400">{member.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-semibold text-green-300">
                    {member.status}
                  </span>
                  <p className="mt-1 text-xs text-gray-400">{member.term}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Overview */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">💰 Budget Overview</h2>
              <p className="text-sm text-gray-400">Financial status</p>
            </div>
            <Link
              href="/account/advisor/budget"
              className="rounded-lg bg-cyan-500/20 px-3 py-1.5 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/30"
            >
              View Full
            </Link>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Allocated Budget</span>
                <span className="text-lg font-bold text-white">৳{budgetData.allocated.toLocaleString()}</span>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Used</span>
                <span className="text-lg font-bold text-cyan-300">৳{budgetData.used.toLocaleString()}</span>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Remaining</span>
                <span className="text-lg font-bold text-green-300">৳{budgetData.remaining.toLocaleString()}</span>
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-400">Utilization</span>
                <span className="font-semibold text-white">{stats.budgetUtilization}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-linear-to-r from-cyan-500 to-blue-500"
                  style={{ width: `${stats.budgetUtilization}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events & Achievements Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Recent Events */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">📅 Recent Events</h2>
              <p className="text-sm text-gray-400">Event monitoring</p>
            </div>
            <Link
              href="/account/advisor/events"
              className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/30"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentEvents.map((event, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-white/10 bg-white/5 p-3 transition-all duration-200 hover:border-blue-500/30 hover:bg-white/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white">{event.name}</h3>
                    <p className="mt-1 text-xs text-gray-400">{event.type} • {event.date}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      <Users className="mr-1 inline h-3 w-3" />
                      {event.participants} Participants
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    event.approval === 'Approved' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {event.approval}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">🏆 Achievements</h2>
              <p className="text-sm text-gray-400">Recent accomplishments</p>
            </div>
            <Link
              href="/account/advisor/achievements"
              className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-500/30"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {achievements.map((achievement, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-all duration-200 hover:border-amber-500/30 hover:bg-white/10"
              >
                <Award className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white">{achievement.title}</h3>
                  <p className="mt-1 text-xs text-gray-400">{achievement.category} • {achievement.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Advisory Notes & Reports */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Advisory Notes */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">📝 Advisory Notes</h2>
                <p className="text-sm text-gray-400">Strategic guidance & recommendations</p>
              </div>
              <button className="flex items-center gap-1 rounded-lg bg-blue-500/20 px-3 py-1.5 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/30">
                <MessageSquare className="h-4 w-4" />
                Add Note
              </button>
            </div>
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
              <textarea
                placeholder="Add strategic recommendations, semester planning notes, or guidance for the executive committee..."
                className="w-full resize-none rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none"
                rows={4}
              />
              <div className="mt-3 flex justify-end gap-2">
                <button className="rounded bg-gray-500/20 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:bg-gray-500/30">
                  Cancel
                </button>
                <button className="rounded bg-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/30">
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Quick Access */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-400" />
              <h3 className="font-bold text-white">Reports</h3>
            </div>
            <p className="mb-4 text-sm text-gray-400">Download reports</p>
            <div className="space-y-2">
              <Link
                href="/account/advisor/reports"
                className="flex w-full items-center justify-between rounded-lg bg-green-500/10 px-3 py-2 text-sm font-semibold text-green-300 transition-colors hover:bg-green-500/20"
              >
                <span>Annual Report</span>
                <Download className="h-4 w-4" />
              </Link>
              <Link
                href="/account/advisor/reports"
                className="flex w-full items-center justify-between rounded-lg bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/20"
              >
                <span>Semester Summary</span>
                <Download className="h-4 w-4" />
              </Link>
              <Link
                href="/account/advisor/reports"
                className="flex w-full items-center justify-between rounded-lg bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/20"
              >
                <span>Financial Report</span>
                <Download className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              <h3 className="font-bold text-white">Analytics</h3>
            </div>
            <p className="mb-4 text-sm text-gray-400">View insights</p>
            <Link
              href="/account/advisor/analytics"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-semibold text-purple-300 transition-colors hover:bg-purple-500/30"
            >
              <Eye className="h-4 w-4" />
              View Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

