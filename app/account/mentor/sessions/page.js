/**
 * @file Mentor sessions page — displays mentorship relationships and
 *   session history so the mentor can schedule, track, and review
 *   one-on-one guidance interactions.
 * @module MentorSessionsPage
 * @access mentor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getMentorshipsByMentor } from '@/app/_lib/data-service';
import MentorSessionsClient from './_components/MentorSessionsClient';

export const metadata = { title: 'Sessions | Mentor | NEUPC' };

export default async function MentorSessionsPage() {
  const { user } = await requireRole('mentor');
  const mentorships = await getMentorshipsByMentor(user.id).catch(() => []);

  return <MentorSessionsClient mentorships={mentorships} mentorId={user.id} />;
}
