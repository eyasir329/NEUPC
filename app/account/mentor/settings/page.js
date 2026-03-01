/**
 * @file Mentor settings page — provides account preferences and
 *   configuration options for the authenticated mentor.
 * @module MentorSettingsPage
 * @access mentor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import MentorSettingsClient from './_components/MentorSettingsClient';

export const metadata = { title: 'Settings | Mentor | NEUPC' };

export default async function MentorSettingsPage() {
  const { user } = await requireRole('mentor');
  return <MentorSettingsClient user={user} />;
}
