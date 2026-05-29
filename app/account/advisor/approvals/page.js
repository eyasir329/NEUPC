/**
 * @file Advisor approvals centre — surfaces pending join requests, member
 *   profile updates, and un-approved budget entries so the advisor can
 *   review and act on them in one place.
 * @module AdvisorApprovalsPage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getPendingJoinRequests,
  getPendingMemberProfiles,
  getAllBudgetEntries,
} from '@/app/_lib/services/data-service';
import AdvisorApprovalsClient from './_components/AdvisorApprovalsClient';

export const metadata = { title: 'Approvals | Advisor | NEUPC' };

export default async function AdvisorApprovalsPage() {
  const { user } = await requireRole('advisor');

  const [joinRequests, memberProfiles, allBudgetEntries] = await Promise.all([
    getPendingJoinRequests().catch(() => []),
    getPendingMemberProfiles().catch(() => []),
    getAllBudgetEntries().catch(() => []),
  ]);

  const pendingBudgetEntries = allBudgetEntries.filter(
    (entry) => !entry.approved_at
  );

  return (
    <AdvisorApprovalsClient
      joinRequests={joinRequests}
      memberProfiles={memberProfiles}
      budgetEntries={pendingBudgetEntries}
      advisorId={user.id}
    />
  );
}
