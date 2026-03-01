/**
 * @file Reports client — executive reporting dashboard with aggregated
 *   statistics across users, events, contests, registrations, and blogs.
 * @module ExecutiveReportsClient
 */

'use client';

import {
  Users,
  Calendar,
  Trophy,
  BookOpen,
  Image,
  BarChart2,
  TrendingUp,
  CheckCircle,
  Award,
  FileText,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className={`rounded-xl p-2.5 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="mt-0.5 text-3xl font-bold text-white">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

function ProgressBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">
          {value} <span className="text-gray-600">/ {max}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-0.5 text-right text-xs text-gray-500">{pct}%</p>
    </div>
  );
}

export default function ReportsClient({ stats, recentEvents }) {
  const attendanceRate =
    stats.totalRegistrations > 0
      ? Math.round(
          (stats.attendedRegistrations / stats.totalRegistrations) * 100
        )
      : 0;
  const publishRate =
    stats.totalBlogs > 0
      ? Math.round((stats.publishedBlogs / stats.totalBlogs) * 100)
      : 0;
  const completionRate =
    stats.totalEvents > 0
      ? Math.round((stats.completedEvents / stats.totalEvents) * 100)
      : 0;

  return (
    <div className="space-y-8 px-4 pt-6 pb-8 sm:space-y-10 sm:px-6 sm:pt-8 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
        <p className="mt-1 text-gray-400">
          Overview of club activity and performance metrics
        </p>
      </div>

      {/* Primary Stats */}
      <div>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          Club Overview
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={Users}
            label="Total Members"
            value={stats.totalUsers}
            sub={`${stats.activeUsers} active`}
            color="bg-blue-500/20 text-blue-400"
          />
          <StatCard
            icon={Calendar}
            label="Total Events"
            value={stats.totalEvents}
            sub={`${stats.completedEvents} completed`}
            color="bg-purple-500/20 text-purple-400"
          />
          <StatCard
            icon={Trophy}
            label="Contests"
            value={stats.totalContests}
            color="bg-amber-500/20 text-amber-400"
          />
          <StatCard
            icon={Users}
            label="Registrations"
            value={stats.totalRegistrations}
            sub={`${stats.attendedRegistrations} attended`}
            color="bg-emerald-500/20 text-emerald-400"
          />
          <StatCard
            icon={BookOpen}
            label="Blog Posts"
            value={stats.totalBlogs}
            sub={`${stats.publishedBlogs} published`}
            color="bg-rose-500/20 text-rose-400"
          />
          <StatCard
            icon={Image}
            label="Gallery Items"
            value={stats.totalGallery ?? '—'}
            color="bg-cyan-500/20 text-cyan-400"
          />
        </div>
      </div>

      {/* Rate Metrics */}
      <div>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          Performance Rates
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2 font-semibold text-white">
              <TrendingUp className="h-5 w-5 text-emerald-400" /> Engagement
            </div>
            <ProgressBar
              label="Event Attendance"
              value={stats.attendedRegistrations}
              max={stats.totalRegistrations}
              color="bg-emerald-500"
            />
            <ProgressBar
              label="Event Completion"
              value={stats.completedEvents}
              max={stats.totalEvents}
              color="bg-blue-500"
            />
          </div>
          <div className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2 font-semibold text-white">
              <BarChart2 className="h-5 w-5 text-purple-400" /> Content
            </div>
            <ProgressBar
              label="Blog Publish Rate"
              value={stats.publishedBlogs}
              max={stats.totalBlogs}
              color="bg-rose-500"
            />
            <ProgressBar
              label="Active Members"
              value={stats.activeUsers}
              max={stats.totalUsers}
              color="bg-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Highlight Boxes */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            icon: CheckCircle,
            label: 'Attendance Rate',
            value: `${attendanceRate}%`,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
          },
          {
            icon: Award,
            label: 'Event Completion',
            value: `${completionRate}%`,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border-blue-500/20',
          },
          {
            icon: FileText,
            label: 'Published Blogs',
            value: `${publishRate}%`,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10 border-rose-500/20',
          },
        ].map((m) => (
          <div
            key={m.label}
            className={`rounded-2xl border p-5 text-center backdrop-blur-xl ${m.bg}`}
          >
            <m.icon className={`mx-auto mb-2 h-6 w-6 ${m.color}`} />
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            <p className="mt-1 text-xs text-gray-400">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Events */}
      {recentEvents?.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase">
            Recent Events
          </h2>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs tracking-wide text-gray-500 uppercase">
                    <th className="px-4 py-3">Event</th>
                    <th className="hidden px-4 py-3 sm:table-cell">Category</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="hidden px-4 py-3 lg:table-cell">Date</th>
                    <th className="px-4 py-3 text-right">Registrations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentEvents.map((e) => (
                    <tr
                      key={e.id}
                      className="transition-colors hover:bg-white/3"
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        {e.title}
                      </td>
                      <td className="hidden px-4 py-3 text-gray-400 capitalize sm:table-cell">
                        {e.category || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-xs capitalize ${
                            e.status === 'completed'
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                              : e.status === 'ongoing'
                                ? 'border-blue-500/20 bg-blue-500/10 text-blue-400'
                                : e.status === 'cancelled'
                                  ? 'border-red-500/20 bg-red-500/10 text-red-400'
                                  : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">
                        {e.start_date
                          ? new Date(e.start_date).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {e.registrations?.[0]?.count ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
