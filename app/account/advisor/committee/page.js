import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserRoles,
  getUserByEmail,
  getCommitteePositions,
  getCurrentCommittee,
} from '@/app/_lib/data-service';
import RoleSync from '../../_components/RoleSync';
import AdvisorCommitteeClient from './_components/AdvisorCommitteeClient';

export const metadata = { title: 'Committee | Advisor' };

export default async function AdvisorCommitteePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userRoles = await getUserRoles(session.user.email);
  if (!userRoles.includes('advisor')) redirect('/account');

  const user = await getUserByEmail(session.user.email);
  if (user?.account_status !== 'active' || !user?.is_active)
    redirect('/account');

  const [positions, currentCommittee] = await Promise.all([
    getCommitteePositions().catch(() => []),
    getCurrentCommittee().catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <RoleSync role="advisor" />
      <AdvisorCommitteeClient
        positions={positions}
        currentCommittee={currentCommittee}
        advisorId={user.id}
      />
    </div>
  );
}
