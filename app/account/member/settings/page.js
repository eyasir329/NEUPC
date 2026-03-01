/**
 * @file Member settings page — provides account preferences and
 *   configuration options for the authenticated member.
 * @module MemberSettingsPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth-guard';
import MemberSettingsClient from './_components/MemberSettingsClient';

export const metadata = { title: 'Settings | Member | NEUPC' };

export default async function MemberSettingsPage() {
  const { user } = await requireRole('member');

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <MemberSettingsClient user={user} />
    </div>
  );
}
