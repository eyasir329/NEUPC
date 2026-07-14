/**
 * @file Advisor analytics client component
 * @module AdvisorAnalyticsClient
 */

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  Trophy,
  TrendingUp,
  CheckCircle,
  Clock,
  BarChart3,
  Activity,
  ArrowRight,
  UserPlus,
  UserCheck,
  Mail,
} from 'lucide-react';
import {
  PageShell,
  PageHeader,
  GlassCard,
  StatCard,
  SectionHeader,
  ActionButton,
  TabBar,
  EmptyState,
} from '@/app/account/_components/ui';

const RANGE_TABS = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: 'all', label: 'All time' },
];

export default function AdvisorAnalyticsClient({
  platformStats = {},
  dashboardMetrics = {},
  eventsWithStats = [],
  topAchievements = [],
}) {
  const [range, setRange] = useState('all');

  const { upcomingEvents, pastEvents, engagement } = useMemo(() => {
    const now = new Date();
    const up = eventsWithStats.filter((e) => new Date(e.start_date) > now);
    const past = eventsWithStats.filter((e) => new Date(e.end_date) < now);
    const reg = eventsWithStats.reduce(
      (s, e) => s + (e.registrationCount ?? 0),
      0
    );
    const att = eventsWithStats.reduce((s, e) => s + (e.attendedCount ?? 0), 0);
    return {
      upcomingEvents: up.slice(0, 6),
      pastEvents: past.slice(0, 5),
      engagement: {
        totalRegistrations: reg,
        totalAttended: att,
        attendanceRate: reg > 0 ? Math.round((att / reg) * 100) : 0,
      },
    };
  }, [eventsWithStats]);

  return (
    <PageShell>
      {/* Page Header */}
      <PageHeader
        icon={BarChart3}
        title="Analytics"
        subtitle="Platform growth metrics, event performance, and club engagement."
        accent="indigo"
        actions={
          <div className="w-full sm:w-auto">
            <TabBar tabs={RANGE_TABS} value={range} onChange={setRange} />
          </div>
        }
      />

      {/* Primary KPI Stats Grid */}
      <div className="animate-fade-in grid grid-cols-2 gap-3 select-none lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={platformStats.totalUsers ?? 0}
          accent="blue"
          sublabel="Global platform users"
          delay={0}
        />
        <StatCard
          icon={CheckCircle}
          label="Verified Members"
          value={platformStats.totalApprovedMembers ?? 0}
          accent="emerald"
          sublabel="Approved candidates"
          delay={0.05}
        />
        <StatCard
          icon={Calendar}
          label="Hosted Events"
          value={platformStats.totalEvents ?? 0}
          accent="violet"
          sublabel="Organized events"
          delay={0.1}
        />
        <StatCard
          icon={Trophy}
          label="Contests Loaded"
          value={platformStats.totalContests ?? 0}
          accent="amber"
          sublabel="Problem solving metrics"
          delay={0.15}
        />
      </div>

      {/* Oversight Pipeline Links */}
      <GlassCard padding="p-6">
        <SectionHeader
          icon={Clock}
          title="Administrative Queue"
          subtitle="Oversight pipelines that require immediate advisor decision making"
          accent="amber"
        />
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <PipelineTile
            href="/account/advisor/approvals"
            label="Member Approvals"
            value={dashboardMetrics.pendingMemberProfiles ?? 0}
            icon={UserCheck}
            accent="blue"
          />
          <PipelineTile
            href="/account/advisor/approvals"
            label="Join Requests"
            value={dashboardMetrics.pendingJoinRequests ?? 0}
            icon={UserPlus}
            accent="orange"
          />
          <PipelineTile
            href="/account/advisor/events"
            label="Upcoming Events"
            value={dashboardMetrics.upcomingEvents ?? 0}
            icon={Calendar}
            accent="violet"
          />
          <PipelineTile
            href="/account/advisor/reports"
            label="Unread Contacts"
            value={dashboardMetrics.unreadContacts ?? 0}
            icon={Mail}
            accent="emerald"
          />
        </div>
      </GlassCard>

      {/* Double Column Intelligence Panels */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Event Engagement Dashboard */}
        <GlassCard padding="p-6">
          <SectionHeader
            icon={Activity}
            title="Event Conversion & Engagement"
            subtitle="Analyze participant retention from registrations to active attendance."
            accent="violet"
          />

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <EngagementTile
              label="Registrations"
              value={engagement.totalRegistrations}
              tone="blue"
            />
            <EngagementTile
              label="Attended"
              value={engagement.totalAttended}
              tone="emerald"
            />
            <EngagementTile
              label="Attendance Rate"
              value={`${engagement.attendanceRate}%`}
              tone="violet"
            />
          </div>

          {/* Visual Conversion progress bar */}
          <div className="mt-4 rounded-xl border border-white/6 bg-white/2 p-3 select-none">
            <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] font-bold tracking-widest text-gray-500 uppercase">
              <span>Conversion Meter</span>
              <span className="text-violet-400">
                {engagement.attendanceRate}% Conversion
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/6 bg-white/5">
              <div
                className="h-full bg-linear-to-r from-blue-500 via-violet-500 to-emerald-500 transition-all duration-1000"
                style={{ width: `${engagement.attendanceRate}%` }}
              />
            </div>
          </div>

          <div className="mt-5">
            <h4 className="mb-2.5 font-mono text-[10px] font-bold tracking-widest text-gray-500 uppercase select-none">
              Top recent events performance
            </h4>
            {pastEvents.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No past events loaded"
                description="Completed activities containing participant stats will appear here."
                accent="violet"
              />
            ) : (
              <ul className="space-y-2">
                {pastEvents.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between rounded-xl border border-white/6 bg-white/2 p-3 transition-all hover:border-white/10 hover:bg-white/4"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="line-clamp-1 text-xs font-semibold text-white">
                        {e.title}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-gray-500">
                        {new Date(e.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 font-sans text-[10px] font-bold tracking-wider whitespace-nowrap text-violet-400 uppercase">
                      {e.registrationCount ?? 0} registrations
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-5">
            <ActionButton
              href="/account/advisor/events"
              tone="ghost"
              icon={ArrowRight}
            >
              Manage Club Events
            </ActionButton>
          </div>
        </GlassCard>

        {/* Top Achievements Board */}
        <GlassCard padding="p-6">
          <SectionHeader
            icon={Trophy}
            title="Earned Achievements Ladder"
            subtitle="Highly claimed accomplishments and awards by registered student members."
            accent="amber"
          />
          {topAchievements.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={Trophy}
                title="No achievements claimed yet"
                description="Earned achievements will surface here as members claim them."
                accent="amber"
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {topAchievements.map((a, idx) => {
                const isGold = idx === 0;
                const isSilver = idx === 1;
                const isBronze = idx === 2;
                return (
                  <li
                    key={a.id || idx}
                    className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/2 p-3 transition-all hover:bg-white/4"
                  >
                    {/* Gamified medalled rank display */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black select-none ${
                        isGold
                          ? 'border-amber-500/30 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                          : isSilver
                            ? 'border-slate-400/30 bg-slate-400/20 text-slate-300'
                            : isBronze
                              ? 'border-orange-500/30 bg-orange-500/20 text-orange-300'
                              : 'border-white/6 bg-white/5 text-gray-500'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-xs font-semibold text-white">
                        {a.title}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-gray-500">
                        {a.memberCount ?? 0} members earned
                      </p>
                    </div>

                    {(isGold || isSilver || isBronze) && (
                      <Trophy
                        className={`h-4 w-4 shrink-0 ${
                          isGold
                            ? 'text-amber-400'
                            : isSilver
                              ? 'text-slate-400'
                              : 'text-orange-400'
                        }`}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-5">
            <ActionButton
              href="/account/advisor/achievements"
              tone="ghost"
              icon={ArrowRight}
            >
              Review Club Achievements
            </ActionButton>
          </div>
        </GlassCard>
      </div>

      {/* Upcoming Activities Tracker */}
      {upcomingEvents.length > 0 && (
        <GlassCard padding="p-6">
          <SectionHeader
            icon={TrendingUp}
            title="Upcoming Activity Tracker"
            subtitle="Scheduled club events and bootcamps still ahead in the calendar"
            accent="emerald"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((e) => (
              <div
                key={e.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/6 bg-white/2 p-4 transition-all hover:border-emerald-500/30 hover:bg-white/4"
              >
                <div>
                  <p className="line-clamp-1 text-xs font-semibold text-white transition-colors group-hover:text-emerald-400">
                    {e.title}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(e.start_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3 text-xs">
                  <span className="text-gray-500">Enrollment</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                    {e.registrationCount ?? 0} registered
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </PageShell>
  );
}

// ── Pipeline Tile ────────────────────────────────────────────────────────────
function PipelineTile({ href, label, value, icon: Icon, accent }) {
  const ACCENT_GLOWS = {
    blue: 'hover:border-blue-500/30 hover:bg-blue-500/5 group-hover:text-blue-400',
    orange:
      'hover:border-orange-500/30 hover:bg-orange-500/5 group-hover:text-orange-400',
    violet:
      'hover:border-violet-500/30 hover:bg-violet-500/5 group-hover:text-violet-400',
    emerald:
      'hover:border-emerald-500/30 hover:bg-emerald-500/5 group-hover:text-emerald-400',
  };

  const ACCENT_ICONS = {
    blue: 'text-blue-500/40 group-hover:text-blue-400',
    orange: 'text-orange-500/40 group-hover:text-orange-400',
    violet: 'text-violet-500/40 group-hover:text-violet-400',
    emerald: 'text-emerald-500/40 group-hover:text-emerald-400',
  };

  return (
    <Link
      href={href}
      className={`group relative flex flex-col justify-between gap-3 overflow-hidden rounded-xl border border-white/6 bg-white/2 p-4 transition-all ${ACCENT_GLOWS[accent]}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-2xl font-black text-white">{value}</span>
        {Icon && (
          <Icon
            className={`h-4.5 w-4.5 transition-colors ${ACCENT_ICONS[accent]}`}
          />
        )}
      </div>
      <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase transition-colors group-hover:text-white">
        {label}
      </span>
    </Link>
  );
}

// ── Engagement Tile ──────────────────────────────────────────────────────────
const ENGAGE_TONE = {
  blue: 'border-blue-500/20 bg-blue-500/[0.05] text-blue-300',
  emerald: 'border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300',
  violet: 'border-violet-500/20 bg-violet-500/[0.05] text-violet-300',
};

function EngagementTile({ label, value, tone }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border p-3.5 text-center select-none ${ENGAGE_TONE[tone]}`}
    >
      <span className="text-xl font-black text-white">{value}</span>
      <span className="mt-1 font-mono text-[10px] font-bold tracking-widest text-gray-500 uppercase">
        {label}
      </span>
    </div>
  );
}
