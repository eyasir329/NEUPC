/**
 * @file Advisor dashboard shell — clarity-first layout with a clear
 *   primary/secondary hierarchy tuned for an oversight role.
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

import { PageShell } from '../../_components/ui/dashboard';
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

const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();

export default function AdvisorDashboardClient({ session }) {
  const firstName = session?.user?.name?.split(' ')[0] || 'Advisor';

  const stats = {
    totalMembers: 156,
    eventsSemester: 12,
    achievementsYear: 18,
    participationGrowth: 25,
    budgetUtilization: 68,
    pendingApprovals: 3,
  };

  const committee = [
    { role: 'President', name: 'Ahmed Rahman', status: 'Active', term: '2025-2026' },
    { role: 'Vice President', name: 'Fatima Khan', status: 'Active', term: '2025-2026' },
    { role: 'Secretary', name: 'Mehedi Hasan', status: 'Active', term: '2025-2026' },
  ];

  const recentEvents = [
    { name: 'Inter-University Programming Contest', type: 'Contest', date: 'Mar 15, 2026', participants: 45, status: 'Upcoming', approval: 'Approved' },
    { name: 'Web Development Workshop', type: 'Workshop', date: 'Mar 22, 2026', participants: 32, status: 'Upcoming', approval: 'Approved' },
    { name: 'AI/ML Seminar Series', type: 'Seminar', date: 'Apr 5, 2026', participants: 28, status: 'Planning', approval: 'Pending' },
  ];

  const achievements = [
    { title: 'ICPC Dhaka Regional - 2nd Place', date: 'Jan 2026', category: 'Contest' },
    { title: 'National Hackathon Winner', date: 'Dec 2025', category: 'Hackathon' },
    { title: 'Research Paper Published', date: 'Nov 2025', category: 'Research' },
  ];

  const pendingApprovals = [
    { id: 1, type: 'Event Proposal', title: 'International Workshop on Cloud Computing', submittedBy: 'Executive Committee', date: hoursAgo(26), priority: 'High' },
    { id: 2, type: 'Budget Request', title: 'Additional Equipment Purchase', submittedBy: 'Admin', date: hoursAgo(50), priority: 'Medium' },
    { id: 3, type: 'Policy Change', title: 'New Membership Criteria Update', submittedBy: 'Executive Committee', date: hoursAgo(72), priority: 'Low' },
  ];

  const budgetData = { allocated: 150000, used: 102000, remaining: 48000 };

  // Advisor-focused widgets data ---------------------------------------------
  const atRiskItems = [
    {
      title: 'AI/ML Seminar Series — registration below 40% of capacity',
      detail: 'Capacity 70, registered 27. Event starts in 18 days; consider a reminder push.',
      severity: 'warning',
      href: '/account/advisor/events',
    },
    {
      title: 'Equipment budget line approaching ceiling',
      detail: '92% utilized this term. Next quarter forecast may exceed allocation.',
      severity: 'critical',
      href: '/account/advisor/budget',
    },
    {
      title: 'Secretary term ends in 6 weeks',
      detail: 'No successor candidate nominated yet. Discuss with executive in next meeting.',
      severity: 'watch',
      href: '/account/advisor/committee',
    },
  ];

  const weekDays = [
    { label: 'Mon', date: '19', items: [{ type: 'event', label: 'NEUPC Practice Round' }] },
    { label: 'Tue', date: '20', items: [{ type: 'decision', label: 'Cloud Workshop approval due' }] },
    { label: 'Wed', date: '21', items: [{ type: 'meeting', label: 'Exec sync · 4pm' }] },
    { label: 'Thu', date: '22', items: [
      { type: 'event', label: 'Web Dev Workshop' },
      { type: 'deadline', label: 'Sponsor proposal' },
    ]},
    { label: 'Fri', date: '23', items: [{ type: 'event', label: 'NEUPC Monthly #27' }] },
    { label: 'Sat', date: '24', items: [] },
    { label: 'Sun', date: '25', items: [{ type: 'deadline', label: 'Monthly report' }] },
  ];

  const recentDecisions = [
    { action: 'approved', title: 'Hackathon \'26 budget request', type: 'Budget', at: hoursAgo(4) },
    { action: 'noted', title: 'Onboarding flow feedback for new members', type: 'Note', at: hoursAgo(30) },
    { action: 'approved', title: 'Sponsor outreach plan', type: 'Policy', at: hoursAgo(60) },
    { action: 'rejected', title: 'Off-campus retreat proposal', type: 'Event', at: hoursAgo(96) },
  ];

  return (
    <PageShell>
      <AdvisorHeader
        firstName={firstName}
        term="2025 – 2026"
        decisionsThisMonth={recentDecisions.length + 5}
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
          <div className="sticky top-8 flex flex-col gap-8">
            <AtRiskItems items={atRiskItems} />
            <DecisionsLog decisions={recentDecisions} />
            <ReportsQuickAccess />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentEvents recentEvents={recentEvents} />
        <Achievements achievements={achievements} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BudgetOverview
          budgetData={budgetData}
          budgetUtilization={stats.budgetUtilization}
        />
        <ClubOverview committee={committee} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdvisoryNotes />
        </div>
        <AnalyticsDashboard />
      </div>
    </PageShell>
  );
}
