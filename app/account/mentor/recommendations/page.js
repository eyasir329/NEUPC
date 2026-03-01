/**
 * @file Mentor recommendations page — allows the mentor to create and
 *   manage personalised learning recommendations for their assigned
 *   mentees based on observed skill gaps.
 * @module MentorRecommendationsPage
 * @access mentor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getMentorshipsByMentor } from '@/app/_lib/data-service';
import MentorRecommendationsClient from './_components/MentorRecommendationsClient';

export const metadata = { title: 'Recommendations | Mentor | NEUPC' };

export default async function MentorRecommendationsPage() {
  const { user } = await requireRole('mentor');
  const mentorships = await getMentorshipsByMentor(user.id).catch(() => []);

  return (
    <MentorRecommendationsClient mentorships={mentorships} mentorId={user.id} />
  );
}
