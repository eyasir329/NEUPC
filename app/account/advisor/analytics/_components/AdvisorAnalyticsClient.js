'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  Trophy,
  TrendingUp,
  CheckCircle,
  Clock,
  BarChart3,
  Activity,
} from 'lucide-react';
import Link from 'next/link';

export default function AdvisorAnalyticsClient({
  platformStats,
  dashboardMetrics,
  eventsWithStats = [],
  topAchievements = [],
}) {
  const [timeRange, setTimeRange] = useState('all');

  // Process events data
  const { upcomingEvents, pastEvents, eventEngagement } = useMemo(() => {
    const now = new Date();
    const upcoming = eventsWithStats.filter(
      (e) => new Date(e.start_date) > now
    );
    const past = eventsWithStats.filter((e) => new Date(e.end_date) < now);

    const totalRegistrations = eventsWithStats.reduce(
      (sum, e) => sum + (e.registrationCount || 0),
      0
    );
    const totalAttended = eventsWithStats.reduce(
      (sum, e) => sum + (e.attendedCount || 0),
      0
    );
    const attendanceRate =
      totalRegistrations > 0
        ? Math.round((totalAttended / totalRegistrations) * 100)
        : 0;

    return {
      upcomingEvents: upcoming.slice(0, 5),
      pastEvents: past.slice(0, 5),
      eventEngagement: {
        totalRegistrations,
        totalAttended,
        attendanceRate,
      },
    };
  }, [eventsWithStats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="mt-1 text-gray-400">
            Club performance and growth trends
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {['7d', '30d', '90d', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Platform KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={platformStats?.totalUsers || 0}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Approved Members"
          value={platformStats?.totalApprovedMembers || 0}
          color="green"
        />
        <StatCard
          icon={Calendar}
          label="Total Events"
          value={platformStats?.totalEvents || 0}
          color="purple"
        />
        <StatCard
          icon={Trophy}
          label="Total Contests"
          value={platformStats?.totalContests || 0}
          color="amber"
        />
      </div>

      {/* Pipeline Metrics */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
          <Clock className="h-5 w-5 text-blue-400" />
          Pending Approvals
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PipelineCard
            label="Member Approvals"
            value={dashboardMetrics?.pendingMemberProfiles || 0}
            href="/account/advisor/approvals"
          />
          <PipelineCard
            label="Join Requests"
            value={dashboardMetrics?.pendingJoinRequests || 0}
            href="/account/advisor/approvals"
          />
          <PipelineCard
            label="Upcoming Events"
            value={dashboardMetrics?.upcomingEvents || 0}
            href="/account/advisor/events"
          />
          <PipelineCard
            label="Unread Contacts"
            value={dashboardMetrics?.unreadContacts || 0}
            href="/account/advisor/reports"
          />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Events Insights */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <BarChart3 className="h-5 w-5 text-purple-400" />
            Event Engagement
          </h2>

          {/* Engagement Stats */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-2xl font-bold text-white">
                {eventEngagement.totalRegistrations}
              </p>
              <p className="mt-1 text-xs text-gray-400">Registrations</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-2xl font-bold text-white">
                {eventEngagement.totalAttended}
              </p>
              <p className="mt-1 text-xs text-gray-400">Attended</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-2xl font-bold text-white">
                {eventEngagement.attendanceRate}%
              </p>
              <p className="mt-1 text-xs text-gray-400">Rate</p>
            </div>
          </div>

          {/* Top Events */}
          <div className="space-y-2">
            <h3 className="mb-3 text-sm font-medium text-gray-400">
              Top Recent Events
            </h3>
            {pastEvents.length > 0 ? (
              pastEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-white">
                        {event.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(event.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-3 text-right">
                      <p className="text-sm font-semibold text-blue-400">
                        {event.registrationCount || 0}
                      </p>
                      <p className="text-xs text-gray-500">registered</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-gray-500">
                No past events
              </p>
            )}
          </div>

          <Link
            href="/account/advisor/events"
            className="mt-4 block text-center text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            View All Events →
          </Link>
        </div>

        {/* Achievements Insights */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <Trophy className="h-5 w-5 text-amber-400" />
            Top Achievements
          </h2>

          <div className="space-y-3">
            {topAchievements && topAchievements.length > 0 ? (
              topAchievements.map((achievement, idx) => (
                <div
                  key={achievement.id}
                  className="rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10"
                >
                  <div className="flex gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${
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
                      <p className="line-clamp-1 text-sm font-medium text-white">
                        {achievement.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {achievement.memberCount || 0} members earned
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-gray-500">
                No achievements yet
              </p>
            )}
          </div>

          <Link
            href="/account/advisor/achievements"
            className="mt-4 block text-center text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            View All Achievements →
          </Link>
        </div>
      </div>

      {/* Upcoming Events Section */}
      {upcomingEvents.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <Activity className="h-5 w-5 text-green-400" />
            Upcoming Events
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <h3 className="mb-2 line-clamp-1 font-medium text-white">
                  {event.title}
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-400">
                    {new Date(event.start_date).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-400">
                      {event.registrationCount || 0}
                    </span>
                    <span className="text-gray-500">registered</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
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

function PipelineCard({ label, value, href }) {
  return (
    <Link
      href={href}
      className="block rounded-xl bg-white/5 p-4 transition-colors hover:bg-white/10"
    >
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-gray-400">{label}</p>
    </Link>
  );
}
