/**
 * @file Guest settings page — provides preference controls available to
 *   guest-role users such as notification toggles and display options.
 * @module GuestSettingsPage
 * @access guest
 */

import { requireRole } from '@/app/_lib/auth-guard';
import GuestSettingsClient from './_components/GuestSettingsClient';

export const metadata = { title: 'Settings | Guest | NEUPC' };

export default async function GuestSettingsPage() {
  const { user } = await requireRole('guest', { checkIsActive: false });
  return <GuestSettingsClient user={user} />;
}
