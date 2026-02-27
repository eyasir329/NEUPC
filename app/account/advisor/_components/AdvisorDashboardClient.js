'use client';

import RoleSync from '../../_components/RoleSync';
import AdvisorHeader from './AdvisorHeader';
import StatsGrid from './StatsGrid';
import ApprovalCenter from './ApprovalCenter';
import ClubOverview from './ClubOverview';
import BudgetOverview from './BudgetOverview';
import RecentEvents from './RecentEvents';
import Achievements from './Achievements';
import AdvisoryNotes from './AdvisoryNotes';
import ReportsQuickAccess from './ReportsQuickAccess';
import AnalyticsDashboard from './AnalyticsDashboard';

export default function AdvisorDashboardClient({ session }) {
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
    {
      role: 'President',
      name: 'Ahmed Rahman',
      status: 'Active',
      term: '2025-2026',
    },
    {
      role: 'Vice President',
      name: 'Fatima Khan',
      status: 'Active',
      term: '2025-2026',
    },
    {
      role: 'Secretary',
      name: 'Mehedi Hasan',
      status: 'Active',
      term: '2025-2026',
    },
  ];

  // Mock events data
  const recentEvents = [
    {
      name: 'Inter-University Programming Contest',
      type: 'Contest',
      date: 'Mar 15, 2026',
      participants: 45,
      status: 'Upcoming',
      approval: 'Approved',
    },
    {
      name: 'Web Development Workshop',
      type: 'Workshop',
      date: 'Mar 22, 2026',
      participants: 32,
      status: 'Upcoming',
      approval: 'Approved',
    },
    {
      name: 'AI/ML Seminar Series',
      type: 'Seminar',
      date: 'Apr 5, 2026',
      participants: 28,
      status: 'Planning',
      approval: 'Pending',
    },
  ];

  // Mock achievements
  const achievements = [
    {
      title: 'ICPC Dhaka Regional - 2nd Place',
      date: 'Jan 2026',
      category: 'Contest',
    },
    {
      title: 'National Hackathon Winner',
      date: 'Dec 2025',
      category: 'Hackathon',
    },
    {
      title: 'Research Paper Published',
      date: 'Nov 2025',
      category: 'Research',
    },
  ];

  // Mock pending approvals
  const pendingApprovals = [
    {
      id: 1,
      type: 'Event Proposal',
      title: 'International Workshop on Cloud Computing',
      submittedBy: 'Executive Committee',
      date: 'Feb 14, 2026',
      priority: 'High',
    },
    {
      id: 2,
      type: 'Budget Request',
      title: 'Additional Equipment Purchase',
      submittedBy: 'Admin',
      date: 'Feb 13, 2026',
      priority: 'Medium',
    },
    {
      id: 3,
      type: 'Policy Change',
      title: 'New Membership Criteria Update',
      submittedBy: 'Executive Committee',
      date: 'Feb 12, 2026',
      priority: 'Low',
    },
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

      <AdvisorHeader />
      <StatsGrid stats={stats} />
      <ApprovalCenter pendingApprovals={pendingApprovals} />

      {/* Two Column Layout */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <ClubOverview committee={committee} />
        <BudgetOverview
          budgetData={budgetData}
          budgetUtilization={stats.budgetUtilization}
        />
      </div>

      {/* Events & Achievements Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <RecentEvents recentEvents={recentEvents} />
        <Achievements achievements={achievements} />
      </div>

      {/* Advisory Notes & Reports */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdvisoryNotes />
        </div>

        {/* Reports Quick Access */}
        <div className="space-y-4">
          <ReportsQuickAccess />
          <AnalyticsDashboard />
        </div>
      </div>
    </div>
  );
}
