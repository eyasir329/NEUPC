/**
 * @file Executive profile page — displays the authenticated executive’s
 *   personal info, member profile details, and current committee position
 *   so they can review or update their data.
 * @module ExecutiveProfilePage
 * @access executive | admin
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getMemberProfileByUserId,
  getCurrentCommitteeMemberByUserId,
  getUserHandlesBasic,
} from '@/app/_lib/services/data-service';
import {
  isV2SchemaAvailable,
  getUserHandlesV2,
} from '@/app/_lib/services/problem-solving-v2-helpers';
import ExecutiveProfileClient from './_components/ExecutiveProfileClient';

export const metadata = { title: 'Profile | Executive | NEUPC' };

export default async function ExecutiveProfilePage() {
  const { user } = await requireRole(['executive', 'admin']);

  // Fetch basic profiles and committee info
  const [memberProfile, committeeInfo] = await Promise.all([
    getMemberProfileByUserId(user.id).catch(() => null),
    getCurrentCommitteeMemberByUserId(user.id).catch(() => null),
  ]);

  // Dynamically fetch user handles based on active schema format (V1 or V2)
  let userHandles = [];
  try {
    const useV2 = await isV2SchemaAvailable();
    userHandles = useV2
      ? await getUserHandlesV2(user.id)
      : await getUserHandlesBasic(user.id);
  } catch (err) {
    console.error('Error fetching user handles in profile page:', err);
  }

  // Merge handles into memberProfile for backward compatibility
  const handlesMap = {};
  (userHandles || []).forEach((h) => {
    handlesMap[`${h.platform}_handle`] = h.handle;
  });

  const enrichedProfile = {
    ...(memberProfile || {}),
    ...handlesMap,
  };

  return (
    <ExecutiveProfileClient
      user={user}
      memberProfile={enrichedProfile}
      committeeInfo={committeeInfo}
    />
  );
}
