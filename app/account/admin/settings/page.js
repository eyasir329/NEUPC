/**
 * @file Admin settings page (server component).
 * Fetches all system settings and converts them to a key-value map
 * for the settings management UI.
 *
 * @module AdminSettingsPage
 * @access admin
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { getAllSettings } from '@/app/_lib/services/data-service';
import SettingsClient from './_components/SettingsClient';

export const metadata = { title: 'Settings | Admin | NEUPC' };

export default async function AdminSettingsPage() {
  const [{ user }, rawSettings] = await Promise.all([
    requireRole('admin'),
    getAllSettings().catch(() => []),
  ]);

  const settingsMap = {};
  for (const row of rawSettings) {
    settingsMap[row.key] = row.value;
  }

  return <SettingsClient initialSettings={settingsMap} adminId={user.id} />;
}
