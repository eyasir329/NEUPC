import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getPendingJoinRequests,
  getPendingMemberProfiles,
  getAllBudgetEntries,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import AdvisorApprovalsClient from './_components/AdvisorApprovalsClient';

export const metadata = { title: 'Approvals | Advisor' };

export default async function AdvisorApprovalsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('advisor')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  const [joinRequests, memberProfiles, allBudgetEntries] = await Promise.all([
    getPendingJoinRequests().catch(() => []),
    getPendingMemberProfiles().catch(() => []),
    getAllBudgetEntries().catch(() => []),
  ]);

  // Filter pending budget entries
  const pendingBudgetEntries = allBudgetEntries.filter(
    (entry) => !entry.approved_at
  );

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="advisor" />
      <AdvisorApprovalsClient
        joinRequests={joinRequests}
        memberProfiles={memberProfiles}
        budgetEntries={pendingBudgetEntries}
        advisorId={user.id}
      />
    </div>
  );
}
