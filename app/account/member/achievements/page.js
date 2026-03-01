/**
 * @file Member achievements page — shows earned badges and certificates
 *   alongside progress towards unearned achievements to motivate
 *   continued engagement.
 * @module MemberAchievementsPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth-guard';
import {
  getMemberAchievements,
  getUserCertificates,
} from '@/app/_lib/data-service';
import MemberAchievementsClient from './_components/MemberAchievementsClient';

export const metadata = { title: 'Achievements | Member | NEUPC' };

export default async function MemberAchievementsPage() {
  const { user } = await requireRole('member');

  const [memberAchievements, certificates] = await Promise.all([
    getMemberAchievements(user.id).catch(() => []),
    getUserCertificates(user.id).catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <MemberAchievementsClient
        memberAchievements={memberAchievements}
        certificates={certificates}
        userId={user.id}
      />
    </div>
  );
}
