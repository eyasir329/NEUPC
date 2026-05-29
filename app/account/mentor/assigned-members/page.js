/**
 * @file Assigned members route page
 * @module AssignedMembersPage
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { getMentorAssignedBootcamps } from '@/app/_lib/actions/bootcamp-actions';
import AssignedMembersClient from './_components/AssignedMembersClient';

export const metadata = { title: 'Assigned Members | Mentor | NEUPC' };

export default async function AssignedMembersPage() {
  await requireRole('mentor');
  const bootcamps = await getMentorAssignedBootcamps().catch(() => []);

  return <AssignedMembersClient bootcamps={bootcamps} />;
}
