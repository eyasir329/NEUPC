/**
 * @file Admin system logs page (server component).
 * Fetches system log data for the audit trail viewer.
 *
 * @module AdminSystemLogsPage
 * @access admin
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getSystemLogsData } from '@/app/_lib/system-logs-service';
import SystemLogsClient from './_components/SystemLogsClient';

export const metadata = { title: 'System Logs | Admin | NEUPC' };

export default async function AdminSystemLogsPage() {
  const [{ user }, logsData] = await Promise.all([
    requireRole('admin'),
    getSystemLogsData().catch(() => null),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <SystemLogsClient data={logsData} adminId={user.id} />
    </div>
  );
}
