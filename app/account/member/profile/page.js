/**
 * @file Member profile page — displays the authenticated member’s
 *   account information and linked member profile data (student ID,
 *   session, department, competitive handles), plus live
 *   problem-solving statistics, activity heatmap, contest history,
 *   achievements and certificates — all read from the database.
 * @module MemberProfilePage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import {
  getMemberAchievements,
  getUserCertificates,
  getUserContestParticipations,
  getMemberProfileData,
} from '@/app/_lib/services/data-service';
import MemberProfileClient from './_components/MemberProfileClient';

export const metadata = { title: 'Profile | Member | NEUPC' };

export default async function MemberProfilePage() {
  const { user } = await requireRole('member');

  const [profileData, memberAchievements, certificates, contestParticipations] =
    await Promise.all([
      getMemberProfileData(user.id).catch(() => ({
        memberProfile: null,
        handles: [],
        userStats: null,
        dailyActivity: [],
      })),
      getMemberAchievements(user.id).catch(() => []),
      getUserCertificates(user.id).catch(() => []),
      getUserContestParticipations(user.id).catch(() => []),
    ]);

  const { memberProfile, handles, userStats, dailyActivity } = profileData;

  const handlesMap = {};
  (handles || []).forEach((h) => {
    if (h.platform?.code) handlesMap[`${h.platform.code}_handle`] = h.handle;
  });

  const enrichedProfile = memberProfile
    ? {
        ...memberProfile,
        session:
          memberProfile.session ?? memberProfile.academic_session ?? null,
        academic_session:
          memberProfile.academic_session ?? memberProfile.session ?? null,
        ...handlesMap,
      }
    : null;

  return (
    <MemberProfileClient
      user={user}
      memberProfile={enrichedProfile}
      handles={handles || []}
      userStats={userStats}
      dailyActivity={dailyActivity || []}
      memberAchievements={memberAchievements || []}
      certificates={certificates || []}
      contestParticipations={contestParticipations || []}
    />
  );
}
