/**
 * @file Advisor dashboard — displays high-level club metrics, pending
 *   approvals, recent activity, and quick-action links for the faculty
 *   advisor. Data is fetched server-side and delegated to the client shell.
 *
 * @module AdvisorDashboardPage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getPlatformStatistics,
  getEventsWithStats,
  getBudgetSummary,
  getAchievementsAdmin,
  getPendingJoinRequests,
  getPendingMemberProfiles,
  getAllBudgetEntries,
  getAllCommitteeMembers,
  getActivityLogs,
  getAdvisorNotes,
} from '@/app/_lib/services/data-service';
import AdvisorDashboardClient from './_components/AdvisorDashboardClient';

export const metadata = { title: 'Dashboard | Advisor | NEUPC' };

export default async function AdvisorDashboardPage() {
  const { user } = await requireRole('advisor');

  const [
    platformStats,
    eventsData,
    budgetSummary,
    achievementsData,
    joinRequests,
    memberProfiles,
    allBudgetEntries,
    committeeMembers,
    activityLogs,
    notes,
  ] = await Promise.all([
    getPlatformStatistics().catch(() => ({})),
    getEventsWithStats().catch(() => ({ events: [], stats: {} })),
    getBudgetSummary().catch(() => ({
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
    })),
    getAchievementsAdmin().catch(() => ({ achievements: [], stats: {} })),
    getPendingJoinRequests().catch(() => []),
    getPendingMemberProfiles().catch(() => []),
    getAllBudgetEntries().catch(() => []),
    getAllCommitteeMembers().catch(() => []),
    getActivityLogs(300).catch(() => []),
    getAdvisorNotes(user.id).catch(() => []),
  ]);

  return (
    <AdvisorDashboardClient
      firstName={user.full_name?.split(' ')[0] || 'Advisor'}
      advisorId={user.id}
      platformStats={platformStats}
      events={eventsData?.events || []}
      eventStats={eventsData?.stats || {}}
      budgetSummary={budgetSummary}
      achievements={achievementsData?.achievements || []}
      achievementStats={achievementsData?.stats || {}}
      joinRequests={joinRequests}
      memberProfiles={memberProfiles}
      pendingBudgetEntries={(allBudgetEntries || []).filter(
        (e) => !e.approved_at
      )}
      committeeMembers={committeeMembers}
      activityLogs={activityLogs}
      notes={notes}
    />
  );
}
