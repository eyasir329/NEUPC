/**
 * @file Mentor profile page — displays the authenticated mentor’s account
 *   information and linked member profile data for review or editing.
 * @module MentorProfilePage
 * @access mentor
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { getMemberProfileByUserId } from '@/app/_lib/services/data-service';
import { getUserHandlesV2 } from '@/app/_lib/services/problem-solving-v2-helpers';
import MentorProfileClient from './_components/MentorProfileClient';

export const metadata = { title: 'Profile | Mentor | NEUPC' };

export default async function MentorProfilePage() {
  const { user } = await requireRole('mentor');
  const [memberProfile, handles] = await Promise.all([
    getMemberProfileByUserId(user.id).catch(() => null),
    getUserHandlesV2(user.id).catch(() => []),
  ]);

  const codeforcesHandle =
    handles.find((h) => h.platform === 'codeforces')?.handle || null;

  return (
    <MentorProfileClient
      user={user}
      memberProfile={memberProfile}
      codeforcesHandle={codeforcesHandle}
    />
  );
}
