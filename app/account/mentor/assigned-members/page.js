import { requireRole } from '@/app/_lib/auth-guard';
import { getMentorshipsByMentor } from '@/app/_lib/data-service';
import { getMentorAssignedBootcamps } from '@/app/_lib/bootcamp-actions';
import AssignedMembersClient from './_components/AssignedMembersClient';

export const metadata = { title: 'Assigned Members | Mentor | NEUPC' };

export default async function AssignedMembersPage() {
  const { user } = await requireRole('mentor');
  const [mentorships, bootcamps] = await Promise.all([
    getMentorshipsByMentor(user.id).catch(() => []),
    getMentorAssignedBootcamps().catch(() => []),
  ]);

  return <AssignedMembersClient mentorships={mentorships} bootcamps={bootcamps} />;
}
