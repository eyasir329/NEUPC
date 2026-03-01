/**
 * @file Mentor profile page — displays the authenticated mentor’s account
 *   information and linked member profile data for review or editing.
 * @module MentorProfilePage
 * @access mentor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getMemberProfileByUserId } from '@/app/_lib/data-service';
import MentorProfileClient from './_components/MentorProfileClient';

export const metadata = { title: 'Profile | Mentor | NEUPC' };

export default async function MentorProfilePage() {
  const { user } = await requireRole('mentor');
  const memberProfile = await getMemberProfileByUserId(user.id).catch(
    () => null
  );

  return <MentorProfileClient user={user} memberProfile={memberProfile} />;
}
