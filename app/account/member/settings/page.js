/**
 * @file Member settings page — provides account preferences and
 *   configuration options for the authenticated member.
 * @module MemberSettingsPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import MemberSettingsClient from './_components/MemberSettingsClient';

export const metadata = { title: 'Settings | Member | NEUPC' };

export default async function MemberSettingsPage() {
  const { user } = await requireRole('member');

  return <MemberSettingsClient user={user} />;
}
