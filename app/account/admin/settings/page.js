/**
 * @file Admin settings page (server component).
 * Fetches all system settings and converts them to a key-value map
 * for the settings management UI.
 *
 * @module AdminSettingsPage
 * @access admin
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getAllSettings } from '@/app/_lib/data-service';
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

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <SettingsClient initialSettings={settingsMap} adminId={user.id} />
    </div>
  );
}
