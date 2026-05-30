/**
 * @file Bootcamps route page
 * @module BootcampsPage
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { getMentorAssignedBootcamps } from '@/app/_lib/actions/bootcamp-actions';
import MentorBootcampsListClient from './_components/MentorBootcampsListClient';

export const metadata = { title: 'My Bootcamps | Mentor | NEUPC' };

export default async function MentorBootcampsPage() {
  await requireRole('mentor');
  const bootcamps = await getMentorAssignedBootcamps().catch(() => []);

  return <MentorBootcampsListClient bootcamps={bootcamps} />;
}
