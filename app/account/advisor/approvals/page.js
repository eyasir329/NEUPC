/**
 * @file Advisor approvals centre — surfaces pending join requests, member
 *   profile updates, and un-approved budget entries so the advisor can
 *   review and act on them in one place.
 * @module AdvisorApprovalsPage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getPendingJoinRequests,
  getPendingMemberProfiles,
  getAllBudgetEntries,
} from '@/app/_lib/data-service';
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
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <AdvisorApprovalsClient
        joinRequests={joinRequests}
        memberProfiles={memberProfiles}
        budgetEntries={pendingBudgetEntries}
        advisorId={user.id}
      />
    </div>
  );
}
