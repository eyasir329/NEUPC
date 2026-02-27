'use client';

import Link from 'next/link';
import {
  Users,
  Calendar,
  Trophy,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export default function AdvisorClubOverviewClient({
  platformStats,
  dashboardMetrics,
  upcomingEvents = [],
  budgetSummary,
  topAchievements = [],
}) {
  const lastUpdated = new Date().toLocaleString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Club Overview</h1>
          <p className="mt-1 text-gray-400">
            Club health and insights at a glance
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: <span className="text-gray-400">{lastUpdated}</span>
        </div>
      </div>

      {/* Platform Health KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HealthCard
          icon={Users}
          label="Total Users"
          value={platformStats?.totalUsers || 0}
          color="blue"
        />
        <HealthCard
          icon={CheckCircle}
          label="Approved Members"
          value={platformStats?.totalApprovedMembers || 0}
          color="green"
        />
        <HealthCard
          icon={Calendar}
          label="Total Events"
          value={platformStats?.totalEvents || 0}
          color="purple"
        />
        <HealthCard
          icon={Trophy}
          label="Total Contests"
          value={platformStats?.totalContests || 0}
          color="amber"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Approval Pipeline */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
              <Clock className="h-5 w-5 text-amber-400" />
              Approval Pipeline
            </h2>
            <Link
              href="/account/advisor/approvals"
              className="text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            <PipelineCard
              label="Pending Member Profiles"
              value={dashboardMetrics?.pendingMemberProfiles || 0}
              urgent={dashboardMetrics?.pendingMemberProfiles > 5}
            />
            <PipelineCard
              label="Pending Join Requests"
              value={dashboardMetrics?.pendingJoinRequests || 0}
              urgent={dashboardMetrics?.pendingJoinRequests > 10}
            />
            <PipelineCard
              label="Upcoming Events"
              value={dashboardMetrics?.upcomingEvents || 0}
              urgent={false}
            />
            <PipelineCard
              label="Unread Contacts"
              value={dashboardMetrics?.unreadContacts || 0}
              urgent={dashboardMetrics?.unreadContacts > 20}
            />
          </div>
        </div>

        {/* Financial Snapshot */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
              <DollarSign className="h-5 w-5 text-green-400" />
              Financial Snapshot
            </h2>
            <Link
              href="/account/advisor/budget"
              className="text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              View Budget →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
              <p className="mb-1 text-sm text-gray-400">Income</p>
              <p className="text-xl font-bold text-green-400">
                ৳{budgetSummary?.totalIncome || 0}
              </p>
            </div>
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
              <p className="mb-1 text-sm text-gray-400">Expenses</p>
              <p className="text-xl font-bold text-red-400">
                ৳{budgetSummary?.totalExpenses || 0}
              </p>
            </div>
            <div
              className={`rounded-xl border p-4 text-center ${
                budgetSummary?.balance >= 0
                  ? 'border-blue-500/30 bg-blue-500/10'
                  : 'border-amber-500/30 bg-amber-500/10'
              }`}
            >
              <p className="mb-1 text-sm text-gray-400">Balance</p>
              <p
                className={`text-xl font-bold ${
                  budgetSummary?.balance >= 0
                    ? 'text-blue-400'
                    : 'text-amber-400'
                }`}
              >
                ৳{budgetSummary?.balance || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Schedule */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
              <Calendar className="h-5 w-5 text-purple-400" />
              Upcoming Schedule
            </h2>
            <Link
              href="/account/advisor/events"
              className="text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              View Events →
            </Link>
          </div>

          {upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
                >
                  <h3 className="line-clamp-1 text-sm font-medium text-white">
                    {event.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                    <span>
                      {new Date(event.start_date).toLocaleDateString()}
                    </span>
                    {event.venue && <span>• {event.venue}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-500" />
              <p className="text-sm text-gray-400">
                No upcoming events scheduled
              </p>
            </div>
          )}
        </div>

        {/* Top Achievements */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
              <Trophy className="h-5 w-5 text-amber-400" />
              Top Achievements
            </h2>
            <Link
              href="/account/advisor/achievements"
              className="text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              View All →
            </Link>
          </div>

          {topAchievements && topAchievements.length > 0 ? (
            <div className="space-y-3">
              {topAchievements.map((achievement, idx) => (
                <div
                  key={achievement.id}
                  className="rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        idx === 0
                          ? 'bg-amber-500/20 text-amber-400'
                          : idx === 1
                            ? 'bg-gray-400/20 text-gray-400'
                            : idx === 2
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="line-clamp-1 text-sm font-medium text-white">
                        {achievement.title}
                      </h3>
                      <p className="mt-1 text-xs text-gray-400">
                        {achievement.memberCount || 0} members
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Trophy className="mx-auto mb-3 h-12 w-12 text-gray-500" />
              <p className="text-sm text-gray-400">No achievements yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-xl font-semibold text-white">Quick Links</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink
            href="/account/advisor/analytics"
            label="Analytics"
            icon={TrendingUp}
          />
          <QuickLink
            href="/account/advisor/approvals"
            label="Approvals"
            icon={CheckCircle}
          />
          <QuickLink
            href="/account/advisor/committee"
            label="Committee"
            icon={Users}
          />
          <QuickLink
            href="/account/advisor/reports"
            label="Reports"
            icon={Calendar}
          />
        </div>
      </div>
    </div>
  );
}

function HealthCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
    green:
      'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
    purple:
      'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
    amber:
      'from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400',
  };

  return (
    <div
      className={`bg-linear-to-br backdrop-blur-xl ${colorClasses[color]} rounded-2xl border p-6`}
    >
      <Icon className="mb-4 h-8 w-8" />
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function PipelineCard({ label, value, urgent }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
      <div className="flex items-center gap-2">
        {urgent && <AlertCircle className="h-4 w-4 text-amber-400" />}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <span
        className={`text-lg font-bold ${urgent ? 'text-amber-400' : 'text-white'}`}
      >
        {value}
      </span>
    </div>
  );
}

function QuickLink({ href, label, icon: Icon }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
    >
      <Icon className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
      <span className="text-sm font-medium text-white">{label}</span>
      <ArrowRight className="ml-auto h-4 w-4 text-gray-500 transition-colors group-hover:text-blue-400" />
    </Link>
  );
}
