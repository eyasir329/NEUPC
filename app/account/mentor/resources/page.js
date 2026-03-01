/**
 * @file Mentor resources page — surfaces shared learning materials and
 *   documents that the mentor can reference or assign to mentees.
 * @module MentorResourcesPage
 * @access mentor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getAllResources } from '@/app/_lib/data-service';
import MentorResourcesClient from './_components/MentorResourcesClient';

export const metadata = { title: 'Resources | Mentor | NEUPC' };

export default async function MentorResourcesPage() {
  const [{ user }, resources] = await Promise.all([
    requireRole('mentor'),
    getAllResources().catch(() => []),
  ]);

  return <MentorResourcesClient resources={resources} mentorId={user.id} />;
}
