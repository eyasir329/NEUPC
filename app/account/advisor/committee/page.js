/**
 * @file Advisor committee management — lists all committee positions and
 *   current appointment holders so the advisor can oversee or restructure
 *   the executive committee.
 * @module AdvisorCommitteePage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getCommitteePositions,
  getCurrentCommittee,
} from '@/app/_lib/data-service';
import AdvisorCommitteeClient from './_components/AdvisorCommitteeClient';

export const metadata = { title: 'Committee | Advisor | NEUPC' };

export default async function AdvisorCommitteePage() {
  const { user } = await requireRole('advisor');

  const [positions, currentCommittee] = await Promise.all([
    getCommitteePositions().catch(() => []),
    getCurrentCommittee().catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <AdvisorCommitteeClient
        positions={positions}
        currentCommittee={currentCommittee}
        advisorId={user.id}
      />
    </div>
  );
}
