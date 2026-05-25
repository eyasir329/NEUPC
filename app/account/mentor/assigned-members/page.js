import { requireRole } from '@/app/_lib/auth-guard';
import { getMentorAssignedBootcamps } from '@/app/_lib/bootcamp-actions';
import AssignedMembersClient from './_components/AssignedMembersClient';

export const metadata = { title: 'Assigned Members | Mentor | NEUPC' };

export default async function AssignedMembersPage() {
  await requireRole('mentor');
  const bootcamps = await getMentorAssignedBootcamps().catch(() => []);

  return <AssignedMembersClient bootcamps={bootcamps} />;
}
