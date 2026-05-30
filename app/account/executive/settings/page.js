/**
 * @file Executive settings page — provides account preferences and
 *   notification configurations for the authenticated executive.
 * @module ExecutiveSettingsPage
 * @access executive
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import ExecutiveSettingsClient from './_components/ExecutiveSettingsClient';

export const metadata = { title: 'Settings | Executive | NEUPC' };

export default async function ExecutiveSettingsPage() {
  const { user } = await requireRole('executive');
  return <ExecutiveSettingsClient user={user} />;
}
