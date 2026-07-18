/**
 * @file Advisor dashboard shell — clarity-first layout with a clear
 *   primary/secondary hierarchy tuned for an oversight role. All widget
 *   data is derived from live database records passed by the server page.
 *
 * Layout (top → bottom):
 *   1. AdvisorHeader        — greeting + role + term + pending count
 *   2. StatsGrid            — 6 hero metrics (pending leads)
 *   3. Action zone          — 2/3 primary stack + 1/3 side rail
 *        primary: ActionQueue · WeekAtAGlance
 *        rail:    AtRiskItems · DecisionsLog · ReportsQuickAccess
 *   4. RecentEvents · Achievements      (2 col)
 *   5. BudgetOverview · ClubOverview    (2 col)
 *   6. AdvisoryNotes (2/3) + AnalyticsDashboard (1/3)
 *
 * @module AdvisorDashboardClient
 */

'use client';

import { useMemo, useState } from 'react';
import { PageShell } from '@/app/account/_components/ui';
import AdvisorHeader from './AdvisorHeader';
import StatsGrid from './StatsGrid';
import ActionQueue from './ActionQueue';
import AtRiskItems from './AtRiskItems';
import WeekAtAGlance from './WeekAtAGlance';
import DecisionsLog from './DecisionsLog';
import ClubOverview from './ClubOverview';
import BudgetOverview from './BudgetOverview';
import RecentEvents from './RecentEvents';
import Achievements from './Achievements';
import AdvisoryNotes from './AdvisoryNotes';
import ReportsQuickAccess from './ReportsQuickAccess';
import AnalyticsDashboard from './AnalyticsDashboard';

const DAY_MS = 86400000;

function ageToPriority(dateStr, now) {
  const hours = (now - new Date(dateStr).getTime()) / 3600000;
  if (hours >= 72) return 'High';
  if (hours >= 24) return 'Medium';
  return 'Low';
}

function fmtDate(d) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const cap = (s) =>
  typeof s === 'string' && s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

// Current academic term, e.g. "2025 – 2026" (year rolls over in July).
function academicTerm() {
  const now = new Date();
  const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start} – ${start + 1}`;
}

export default function AdvisorDashboardClient({
  firstName = 'Advisor',
  advisorId,
  platformStats = {},
  events = [],
  eventStats = {},
  budgetSummary = {},
  achievements = [],
  achievementStats = {},
  joinRequests = [],
  memberProfiles = [],
  pendingBudgetEntries = [],
  committeeMembers = [],
  activityLogs = [],
  notes = [],
}) {
  // Snapshot the clock once per mount so derived widgets stay stable
  // across re-renders (react-hooks/purity).
  const [now] = useState(() => Date.now());

  const budgetUtilization =
    budgetSummary.totalIncome > 0
      ? Math.min(
          100,
          Math.round(
            (budgetSummary.totalExpenses / budgetSummary.totalIncome) * 100
          )
        )
      : 0;

  const pendingApprovals = useMemo(() => {
    const items = [
      ...joinRequests.map((r) => ({
        id: `join-${r.id}`,
        type: 'Join Request',
        title: r.full_name || r.email || 'New applicant',
        submittedBy: r.email || 'applicant',
        date: r.created_at,
      })),
      ...memberProfiles.map((p) => ({
        id: `profile-${p.id}`,
        type: 'Member Profile',
        title: p.users?.full_name || p.users?.email || 'Member profile',
        submittedBy: p.users?.email || 'member',
        date: p.created_at,
      })),
      ...pendingBudgetEntries.map((e) => ({
        id: `budget-${e.id}`,
        type: 'Budget Request',
        title: e.description || e.events?.title || 'Budget entry',
        submittedBy: e.users?.full_name || 'Executive',
        date: e.created_at || e.transaction_date,
      })),
    ].map((item) => ({ ...item, priority: ageToPriority(item.date, now) }));
    return items.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [joinRequests, memberProfiles, pendingBudgetEntries, now]);

  const stats = {
    pendingApprovals: pendingApprovals.length,
    totalMembers: platformStats.approvedMembers ?? 0,
    upcomingEvents: (eventStats.upcoming ?? 0) + (eventStats.ongoing ?? 0),
    totalEvents: eventStats.total ?? 0,
    achievementsYear: achievementStats.thisYear ?? 0,
    budgetUtilization,
  };

  // 7-day strip (Mon–Sun of the current week) built from real events.
  const weekDays = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return labels.map((label, i) => {
      const dayStart = new Date(monday.getTime() + i * DAY_MS);
      const dayEnd = new Date(dayStart.getTime() + DAY_MS);
      const items = events
        .filter((e) => {
          const start = new Date(e.start_date);
          return (
            !Number.isNaN(start.getTime()) &&
            start >= dayStart &&
            start < dayEnd &&
            e.status !== 'cancelled' &&
            e.status !== 'draft'
          );
        })
        .map((e) => ({ type: 'event', label: e.title }));
      return { label, date: String(dayStart.getDate()), items };
    });
  }, [events]);

  // Health signals derived from live data.
  const atRiskItems = useMemo(() => {
    const items = [];
    const soon = now + 21 * DAY_MS;
    for (const e of events) {
      if (e.status !== 'upcoming' || !e.max_participants) continue;
      const start = new Date(e.start_date).getTime();
      if (Number.isNaN(start) || start > soon || start < now) continue;
      const ratio = (e.registrationCount ?? 0) / e.max_participants;
      if (ratio < 0.4) {
        const days = Math.max(1, Math.round((start - now) / DAY_MS));
        items.push({
          title: `${e.title} — registration below 40% of capacity`,
          detail: `Capacity ${e.max_participants}, registered ${e.registrationCount ?? 0}. Event starts in ${days} day${days === 1 ? '' : 's'}.`,
          severity: 'warning',
          href: '/account/advisor/events',
        });
      }
    }
    if (budgetUtilization > 90) {
      items.push({
        title: 'Budget utilization approaching ceiling',
        detail: `${budgetUtilization}% of recorded income already spent this term.`,
        severity: 'critical',
        href: '/account/advisor/budget',
      });
    }
    const stale = pendingApprovals.filter(
      (p) => now - new Date(p.date).getTime() > 7 * DAY_MS
    ).length;
    if (stale > 0) {
      items.push({
        title: `${stale} approval${stale === 1 ? '' : 's'} pending for over a week`,
        detail: 'Long-waiting requests can stall onboarding and spending.',
        severity: 'watch',
        href: '/account/advisor/approvals',
      });
    }
    return items.slice(0, 4);
  }, [events, budgetUtilization, pendingApprovals, now]);

  // Advisor's own recent decisions from the activity log.
  const recentDecisions = useMemo(
    () =>
      activityLogs
        .filter((log) => log.user_id === advisorId)
        .slice(0, 5)
        .map((log) => ({
          action: log.action?.includes('reject')
            ? 'rejected'
            : log.action?.includes('approve')
              ? 'approved'
              : 'noted',
          title: (log.action || 'activity').replaceAll('_', ' '),
          type: cap((log.entity_type || 'record').replaceAll('_', ' ')),
          at: log.created_at,
        })),
    [activityLogs, advisorId]
  );

  const decisionsThisMonth = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return activityLogs.filter(
      (log) =>
        log.user_id === advisorId && new Date(log.created_at) >= monthStart
    ).length;
  }, [activityLogs, advisorId]);

  const recentEvents = useMemo(
    () =>
      events
        .filter((e) => e.status !== 'draft')
        .slice(0, 3)
        .map((e) => ({
          name: e.title,
          type: cap(e.category) || 'Event',
          date: fmtDate(e.start_date),
          participants: e.registrationCount ?? 0,
          status: cap(e.status) || '—',
        })),
    [events]
  );

  const recentAchievements = useMemo(
    () =>
      achievements.slice(0, 3).map((a) => ({
        title: a.title,
        date: a.year ? String(a.year) : fmtDate(a.created_at),
        category: cap(a.category) || 'Achievement',
      })),
    [achievements]
  );

  // Latest-term committee snapshot.
  const committee = useMemo(() => {
    if (!committeeMembers.length) return [];
    const latestTerm = committeeMembers[0]?.term_start;
    return committeeMembers
      .filter((m) => m.term_start === latestTerm)
      .slice(0, 5)
      .map((m) => ({
        role: m.committee_positions?.title || 'Member',
        name: m.users?.full_name || 'Unknown',
        status: 'Active',
        term: m.term_start
          ? `${new Date(m.term_start).getFullYear()}–${m.term_end ? new Date(m.term_end).getFullYear() : ''}`
          : '',
      }));
  }, [committeeMembers]);

  // Club-wide activity volume, last 7 days (for the sparkline).
  const { weekActivity, weekGrowth } = useMemo(() => {
    const counts = Array(14).fill(0);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    for (const log of activityLogs) {
      const daysAgo = Math.floor(
        (todayStart.getTime() + DAY_MS - new Date(log.created_at).getTime()) /
          DAY_MS
      );
      if (daysAgo >= 0 && daysAgo < 14) counts[13 - daysAgo]++;
    }
    const thisWeek = counts.slice(7).reduce((a, b) => a + b, 0);
    const lastWeek = counts.slice(0, 7).reduce((a, b) => a + b, 0);
    const growth =
      lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;
    return { weekActivity: counts.slice(7), weekGrowth: growth };
  }, [activityLogs]);

  const budgetData = {
    allocated: budgetSummary.totalIncome ?? 0,
    used: budgetSummary.totalExpenses ?? 0,
    remaining: budgetSummary.balance ?? 0,
  };

  return (
    <PageShell>
      <AdvisorHeader
        firstName={firstName}
        term={academicTerm()}
        decisionsThisMonth={decisionsThisMonth}
        pendingCount={pendingApprovals.length}
        totalMembers={stats.totalMembers}
      />

      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="flex flex-col gap-8 xl:col-span-8">
          <ActionQueue pendingApprovals={pendingApprovals} />
          <WeekAtAGlance days={weekDays} />
        </div>
        <div className="flex flex-col gap-8 xl:col-span-4">
          <div className="flex flex-col gap-8 xl:sticky xl:top-8">
            <AtRiskItems items={atRiskItems} />
            <DecisionsLog decisions={recentDecisions} />
            <ReportsQuickAccess />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentEvents recentEvents={recentEvents} />
        <Achievements achievements={recentAchievements} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BudgetOverview
          budgetData={budgetData}
          budgetUtilization={budgetUtilization}
        />
        <ClubOverview committee={committee} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdvisoryNotes initialNotes={notes} />
        </div>
        <AnalyticsDashboard weekActivity={weekActivity} growth={weekGrowth} />
      </div>
    </PageShell>
  );
}
