/**
 * @file Advisor committee management — lists all committee positions and
 *   current appointment holders so the advisor can oversee or restructure
 *   the executive committee.
 * @module AdvisorCommitteePage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getCommitteePositions,
  getAllCommitteeMembers,
  getUsersBasic,
} from '@/app/_lib/services/data-service';
import AdvisorCommitteeClient from './_components/AdvisorCommitteeClient';

export const metadata = { title: 'Committee | Advisor | NEUPC' };

export default async function AdvisorCommitteePage() {
  await requireRole('advisor');

  const [members, positions, users] = await Promise.all([
    getAllCommitteeMembers().catch(() => []),
    getCommitteePositions().catch(() => []),
    getUsersBasic().catch(() => []),
  ]);

  return (
    <AdvisorCommitteeClient
      initialMembers={members}
      initialPositions={positions}
      initialUsers={users}
    />
  );
}
