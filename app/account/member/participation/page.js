/**
 * @file Member participation overview — consolidates event registrations,
 *   contest results, certificates, and discussion threads authored by
 *   the member into a single activity timeline.
 * @module MemberParticipationPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getUserEventRegistrations,
  getUserContestParticipations,
  getUserCertificates,
  getAllDiscussionThreads,
  getMemberAchievements,
} from '@/app/_lib/services/data-service';
import MemberParticipationClient from './_components/MemberParticipationClient';

export const metadata = { title: 'Participation | Member | NEUPC' };

export default async function MemberParticipationPage() {
  const { user } = await requireRole('member');

  const [
    registrations,
    contestParticipations,
    certificates,
    allThreads,
    memberAchievements,
  ] = await Promise.all([
    getUserEventRegistrations(user.id).catch(() => []),
    getUserContestParticipations(user.id).catch(() => []),
    getUserCertificates(user.id).catch(() => []),
    getAllDiscussionThreads(200, 0).catch(() => []),
    getMemberAchievements(user.id).catch(() => []),
  ]);

  const myThreads = allThreads.filter((t) => t.author_id === user.id);

  return (
    <MemberParticipationClient
      registrations={registrations}
      contestParticipations={contestParticipations}
      certificates={certificates}
      myThreads={myThreads}
      memberAchievements={memberAchievements}
      userId={user.id}
    />
  );
}

