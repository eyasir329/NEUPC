/**
 * @file Mentor assigned members page — lists all mentees currently
 *   assigned to this mentor with their mentorship status and progress
 *   details.
 * @module MentorAssignedMembersPage
 * @access mentor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getMentorshipsByMentor } from '@/app/_lib/data-service';
import AssignedMembersClient from './_components/AssignedMembersClient';

export const metadata = { title: 'Assigned Members | Mentor | NEUPC' };

export default async function AssignedMembersPage() {
  const { user } = await requireRole('mentor');
  const mentorships = await getMentorshipsByMentor(user.id).catch(() => []);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <AssignedMembersClient mentorships={mentorships} mentorId={user.id} />
    </div>
  );
}
