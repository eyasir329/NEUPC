/**
 * @file Member participation overview — consolidates event registrations,
 *   contest results, certificates, and discussion threads authored by
 *   the member into a single activity timeline.
 * @module MemberParticipationPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getUserEventRegistrations,
  getUserContestParticipations,
  getUserCertificates,
  getAllDiscussionThreads,
} from '@/app/_lib/data-service';
import MemberParticipationClient from './_components/MemberParticipationClient';

export const metadata = { title: 'Participation | Member | NEUPC' };

export default async function MemberParticipationPage() {
  const { user } = await requireRole('member');

  const [registrations, contestParticipations, certificates, allThreads] =
    await Promise.all([
      getUserEventRegistrations(user.id).catch(() => []),
      getUserContestParticipations(user.id).catch(() => []),
      getUserCertificates(user.id).catch(() => []),
      getAllDiscussionThreads(200, 0).catch(() => []),
    ]);

  const myThreads = allThreads.filter((t) => t.author_id === user.id);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <MemberParticipationClient
        registrations={registrations}
        contestParticipations={contestParticipations}
        certificates={certificates}
        myThreads={myThreads}
        userId={user.id}
      />
    </div>
  );
}
