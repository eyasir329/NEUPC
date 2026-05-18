/**
 * @file Advisor club overview client — comprehensive snapshot of club
 *   health: membership KPIs, approval pipeline, finances, schedule,
 *   and top achievements. Uses the shared dark-glass primitives.
 *
 * @module AdvisorClubOverviewClient
 */

'use client';

import Link from 'next/link';
import {
  Users,
  Calendar,
  Trophy,
  Wallet,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Activity,
  BarChart3,
} from 'lucide-react';
import {
  PageShell,
  PageHeader,
  GlassCard,
  StatCard,
  SectionHeader,
  Pill,
  ActionButton,
  EmptyState,
} from '../../../_components/ui/dashboard';

export default function AdvisorClubOverviewClient({
  platformStats = {},
  dashboardMetrics = {},
  upcomingEvents = [],
  budgetSummary = {},
  topAchievements = [],
}) {
  const lastUpdated = new Date().toLocaleString();
  const balance = Number(budgetSummary.balance ?? 0);

  return (
    <PageShell>
      <PageHeader
        icon={Activity}
        title="Club Overview"
        subtitle="Club health and insights at a glance"
        accent="indigo"
        meta={
          <Pill tone="gray">
            Last updated · {lastUpdated}
          </Pill>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <SectionHeader
            icon={Clock}
            title="Approval Pipeline"
            subtitle="What needs your attention"
            accent="amber"
            action={
              <ActionButton
                href="/account/advisor/approvals"
                tone="ghost"
                icon={ArrowRight}
              >
                Review
              </ActionButton>
            }
          />
          <ul className="space-y-2">
            <PipelineRow
              label="Pending Member Profiles"
              value={dashboardMetrics.pendingMemberProfiles ?? 0}
              urgent={(dashboardMetrics.pendingMemberProfiles ?? 0) > 5}
            />
            <PipelineRow
              label="Pending Join Requests"
              value={dashboardMetrics.pendingJoinRequests ?? 0}
              urgent={(dashboardMetrics.pendingJoinRequests ?? 0) > 10}
            />
            <PipelineRow
              label="Upcoming Events"
              value={dashboardMetrics.upcomingEvents ?? 0}
            />
            <PipelineRow
              label="Unread Contacts"
              value={dashboardMetrics.unreadContacts ?? 0}
              urgent={(dashboardMetrics.unreadContacts ?? 0) > 20}
            />
          </ul>
        </GlassCard>

        <GlassCard>
          <SectionHeader
            icon={Wallet}
            title="Financial Snapshot"
            subtitle="Budget at a glance"
            accent="emerald"
            action={
              <ActionButton
                href="/account/advisor/budget"
                tone="ghost"
                icon={ArrowRight}
              >
                Budget
              </ActionButton>
            }
          />
          <div className="grid grid-cols-3 gap-2">
            <FinanceTile
              label="Income"
              value={budgetSummary.totalIncome}
              tone="emerald"
            />
            <FinanceTile
              label="Expenses"
              value={budgetSummary.totalExpenses}
              tone="rose"
            />
            <FinanceTile
              label="Balance"
              value={balance}
              tone={balance >= 0 ? 'blue' : 'amber'}
            />
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <SectionHeader
            icon={Calendar}
            title="Upcoming Schedule"
            subtitle="Events on the calendar"
            accent="violet"
            action={
              <ActionButton
                href="/account/advisor/events"
                tone="ghost"
                icon={ArrowRight}
              >
                Events
              </ActionButton>
            }
          />
          {upcomingEvents.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Nothing scheduled"
              description="Upcoming events will appear here when added."
            />
          ) : (
            <ul className="space-y-2">
              {upcomingEvents.map((event) => (
                <li
                  key={event.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-violet-500/30 hover:bg-white/[0.04]"
                >
                  <p className="line-clamp-1 text-sm font-medium text-white">
                    {event.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(event.start_date).toLocaleDateString()}
                    {event.venue && <> · {event.venue}</>}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard>
          <SectionHeader
            icon={Trophy}
            title="Top Achievements"
            subtitle="Most-earned by the club"
            accent="amber"
            action={
              <ActionButton
                href="/account/advisor/achievements"
                tone="ghost"
                icon={ArrowRight}
              >
                All
              </ActionButton>
            }
          />
          {topAchievements.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No achievements yet"
              description="Club achievements will surface here as they're recorded."
            />
          ) : (
            <ul className="space-y-2">
              {topAchievements.map((a, idx) => (
                <li
                  key={a.id ?? idx}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-amber-500/30 hover:bg-white/[0.04]"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
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
                      {a.memberCount ?? 0} member
                      {a.memberCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      <GlassCard>
        <SectionHeader
          icon={BarChart3}
          title="Quick Links"
          subtitle="Jump to advisor tools"
          accent="indigo"
        />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
      </GlassCard>
    </PageShell>
  );
}

function PipelineRow({ label, value, urgent }) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2">
      <div className="flex items-center gap-2">
        {urgent && <AlertCircle className="h-3.5 w-3.5 text-amber-400" />}
        <span className="text-xs text-gray-300">{label}</span>
      </div>
      <span
        className={`text-base font-bold ${urgent ? 'text-amber-300' : 'text-white'}`}
      >
        {value}
      </span>
    </li>
  );
}

const FINANCE_TONE = {
  emerald: 'border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300',
  rose: 'border-rose-500/20 bg-rose-500/[0.05] text-rose-300',
  blue: 'border-blue-500/20 bg-blue-500/[0.05] text-blue-300',
  amber: 'border-amber-500/20 bg-amber-500/[0.05] text-amber-300',
};

function FinanceTile({ label, value, tone }) {
  return (
    <div className={`rounded-xl border p-3 text-center ${FINANCE_TONE[tone]}`}>
      <p className="text-[10px] font-medium tracking-wider text-gray-400 uppercase">
        {label}
      </p>
      <p className="mt-1 text-base font-bold">
        ৳{Number(value ?? 0).toLocaleString()}
      </p>
    </div>
  );
}

function QuickLink({ href, label, icon: Icon }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-indigo-500/30 hover:bg-white/[0.04]"
    >
      <Icon className="h-4 w-4 text-indigo-400 group-hover:text-indigo-300" />
      <span className="text-sm font-medium text-white">{label}</span>
      <ArrowRight className="ml-auto h-3.5 w-3.5 text-gray-600 transition-transform group-hover:translate-x-1 group-hover:text-indigo-300" />
    </Link>
  );
}
