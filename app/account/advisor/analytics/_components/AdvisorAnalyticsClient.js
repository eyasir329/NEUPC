/**
 * @file Advisor analytics client — KPIs, pipeline, engagement, and top
 *   events / achievements using the shared dark-glass primitives.
 *
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
} from 'lucide-react';
import {
  PageShell,
  PageHeader,
  GlassCard,
  StatCard,
  SectionHeader,
  Pill,
  ActionButton,
  TabBar,
  EmptyState,
} from '../../../_components/ui/dashboard';

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
    const att = eventsWithStats.reduce(
      (s, e) => s + (e.attendedCount ?? 0),
      0
    );
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
      <PageHeader
        icon={BarChart3}
        title="Analytics"
        subtitle="Club performance and growth trends"
        accent="violet"
        actions={
          <div className="w-full sm:w-auto">
            <TabBar tabs={RANGE_TABS} value={range} onChange={setRange} />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={platformStats.totalUsers ?? 0}
          accent="blue"
          delay={0}
        />
        <StatCard
          icon={CheckCircle}
          label="Approved Members"
          value={platformStats.totalApprovedMembers ?? 0}
          accent="emerald"
          delay={0.04}
        />
        <StatCard
          icon={Calendar}
          label="Total Events"
          value={platformStats.totalEvents ?? 0}
          accent="violet"
          delay={0.08}
        />
        <StatCard
          icon={Trophy}
          label="Total Contests"
          value={platformStats.totalContests ?? 0}
          accent="amber"
          delay={0.12}
        />
      </div>

      <GlassCard>
        <SectionHeader
          icon={Clock}
          title="Approval Pipeline"
          subtitle="Open items across the system"
          accent="amber"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PipelineTile
            href="/account/advisor/approvals"
            label="Member Approvals"
            value={dashboardMetrics.pendingMemberProfiles ?? 0}
          />
          <PipelineTile
            href="/account/advisor/approvals"
            label="Join Requests"
            value={dashboardMetrics.pendingJoinRequests ?? 0}
          />
          <PipelineTile
            href="/account/advisor/events"
            label="Upcoming Events"
            value={dashboardMetrics.upcomingEvents ?? 0}
          />
          <PipelineTile
            href="/account/advisor/reports"
            label="Unread Contacts"
            value={dashboardMetrics.unreadContacts ?? 0}
          />
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <SectionHeader
            icon={Activity}
            title="Event Engagement"
            subtitle="How well events convert registrations to attendance"
            accent="violet"
          />
          <div className="grid grid-cols-3 gap-2">
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
              label="Rate"
              value={`${engagement.attendanceRate}%`}
              tone="violet"
            />
          </div>

          <div className="mt-5">
            <h4 className="mb-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
              Top recent events
            </h4>
            {pastEvents.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No past events"
                description="Completed events with stats will be summarised here."
              />
            ) : (
              <ul className="space-y-2">
                {pastEvents.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-white">
                        {e.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        {new Date(e.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Pill tone="blue">
                      {e.registrationCount ?? 0} registered
                    </Pill>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4">
            <ActionButton
              href="/account/advisor/events"
              tone="ghost"
              icon={ArrowRight}
            >
              View all events
            </ActionButton>
          </div>
        </GlassCard>

        <GlassCard>
          <SectionHeader
            icon={Trophy}
            title="Top Achievements"
            subtitle="Most-earned by members"
            accent="amber"
          />
          {topAchievements.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No achievements yet"
              description="Earned achievements will surface here as members claim them."
            />
          ) : (
            <ul className="space-y-2">
              {topAchievements.map((a, idx) => (
                <li
                  key={a.id ?? idx}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      idx === 0
                        ? 'bg-amber-500/20 text-amber-300'
                        : idx === 1
                          ? 'bg-gray-400/20 text-gray-300'
                          : idx === 2
                            ? 'bg-orange-500/20 text-orange-300'
                            : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-white">
                      {a.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {a.memberCount ?? 0} members earned
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <ActionButton
              href="/account/advisor/achievements"
              tone="ghost"
              icon={ArrowRight}
            >
              View all achievements
            </ActionButton>
          </div>
        </GlassCard>
      </div>

      {upcomingEvents.length > 0 && (
        <GlassCard>
          <SectionHeader
            icon={TrendingUp}
            title="Upcoming Events"
            subtitle="Events still ahead in the calendar"
            accent="emerald"
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((e) => (
              <div
                key={e.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-emerald-500/30 hover:bg-white/[0.04]"
              >
                <p className="line-clamp-1 text-sm font-medium text-white">
                  {e.title}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {new Date(e.start_date).toLocaleDateString()}
                </p>
                <p className="mt-1 text-xs">
                  <span className="font-semibold text-emerald-300">
                    {e.registrationCount ?? 0}
                  </span>
                  <span className="text-gray-500"> registered</span>
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </PageShell>
  );
}

function PipelineTile({ href, label, value }) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-amber-500/30 hover:bg-white/[0.04]"
    >
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-gray-400 group-hover:text-amber-300">
        {label}
      </p>
    </Link>
  );
}

const ENGAGE_TONE = {
  blue: 'border-blue-500/20 bg-blue-500/[0.05] text-blue-300',
  emerald: 'border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300',
  violet: 'border-violet-500/20 bg-violet-500/[0.05] text-violet-300',
};

function EngagementTile({ label, value, tone }) {
  return (
    <div className={`rounded-xl border p-3 text-center ${ENGAGE_TONE[tone]}`}>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="mt-1 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
        {label}
      </p>
    </div>
  );
}
