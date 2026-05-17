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
import { PageShell, PageHeader, GlassCard, GradientBar, StatCard } from '@/app/account/executive/_components/_ui';


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
    <PageShell>
      <PageHeader
        icon={BarChart2}
        title="Reports & Analytics"
        subtitle="Overview of club activity and performance metrics"
        accent="violet"
      />

      {/* Primary Stats */}
      <div>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          Club Overview
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Users,    label: 'Total Members',   value: stats.totalUsers,         sublabel: `${stats.activeUsers} active`,          accent: 'blue'   },
            { icon: Calendar, label: 'Total Events',    value: stats.totalEvents,        sublabel: `${stats.completedEvents} completed`,    accent: 'violet' },
            { icon: Trophy,   label: 'Contests',        value: stats.totalContests,                                                         accent: 'amber'  },
            { icon: Users,    label: 'Registrations',   value: stats.totalRegistrations, sublabel: `${stats.attendedRegistrations} attended`,accent: 'emerald'},
            { icon: BookOpen, label: 'Blog Posts',      value: stats.totalBlogs,         sublabel: `${stats.publishedBlogs} published`,     accent: 'rose'   },
            { icon: Image,    label: 'Gallery Items',   value: stats.totalGallery ?? '—',                                                   accent: 'cyan'   },
          ].map((s, i) => (
            <StatCard key={s.label} delay={i * 0.05} {...s} />
          ))}
        </div>
      </div>

      {/* Rate Metrics */}
      <div>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          Performance Rates
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard padding="p-6" className="space-y-5">
            <div className="flex items-center gap-2 font-semibold text-white">
              <TrendingUp className="h-5 w-5 text-emerald-400" /> Engagement
            </div>
            {[
              { label: 'Event Attendance', value: stats.attendedRegistrations, max: stats.totalRegistrations, tone: 'emerald' },
              { label: 'Event Completion', value: stats.completedEvents,       max: stats.totalEvents,        tone: 'blue'    },
            ].map((r) => (
              <div key={r.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-300">{r.label}</span>
                  <span className="text-gray-400">{r.value} <span className="text-gray-600">/ {r.max}</span></span>
                </div>
                <GradientBar value={r.value} max={r.max} tone={r.tone} />
              </div>
            ))}
          </GlassCard>
          <GlassCard padding="p-6" className="space-y-5">
            <div className="flex items-center gap-2 font-semibold text-white">
              <BarChart2 className="h-5 w-5 text-violet-400" /> Content
            </div>
            {[
              { label: 'Blog Publish Rate', value: stats.publishedBlogs, max: stats.totalBlogs,  tone: 'rose' },
              { label: 'Active Members',    value: stats.activeUsers,    max: stats.totalUsers,  tone: 'blue' },
            ].map((r) => (
              <div key={r.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-300">{r.label}</span>
                  <span className="text-gray-400">{r.value} <span className="text-gray-600">/ {r.max}</span></span>
                </div>
                <GradientBar value={r.value} max={r.max} tone={r.tone} />
              </div>
            ))}
          </GlassCard>
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
    </PageShell>
  );
}
