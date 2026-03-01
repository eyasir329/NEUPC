/**
 * @file Member contests hub — lists all programming contests alongside
 *   the member’s own participation history so they can register, track
 *   performance, and review past results.
 * @module MemberContestsPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getAllContests,
  getUserContestParticipations,
} from '@/app/_lib/data-service';
import MemberContestsClient from './_components/MemberContestsClient';

export const metadata = { title: 'Contests | Member | NEUPC' };

export default async function MemberContestsPage() {
  const { user } = await requireRole('member');

  const [contests, myParticipations] = await Promise.all([
    getAllContests().catch(() => []),
    getUserContestParticipations(user.id).catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <MemberContestsClient
        contests={contests}
        myParticipations={myParticipations}
        userId={user.id}
      />
    </div>
  );
}
