/**
 * @file Advisor settings page — provides account preferences and
 *   notification configurations for the authenticated advisor.
 * @module AdvisorSettingsPage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import AdvisorSettingsClient from './_components/AdvisorSettingsClient';

export const metadata = { title: 'Settings | Advisor | NEUPC' };

export default async function AdvisorSettingsPage() {
  const { user } = await requireRole('advisor');
  return <AdvisorSettingsClient user={user} />;
}
