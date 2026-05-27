/**
 * @file Admin inbox page — displays active notices filtered for the
 *   admin audience (notices targeting "all" or "admin" users).
 * @module AdminInboxPage
 * @access admin
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getActiveNotices } from '@/app/_lib/data-service';
import AdminNoticesClient from './_components/AdminNoticesClient';

export const metadata = { title: 'Inbox | Admin | NEUPC' };

export default async function AdminInboxPage() {
  const [{ user }, allNotices] = await Promise.all([
    requireRole('admin'),
    getActiveNotices().catch(() => []),
  ]);

  const notices = allNotices.filter(
    (n) =>
      !n.target_audience ||
      n.target_audience.includes('all') ||
      n.target_audience.includes('admin')
  );

  return <AdminNoticesClient notices={notices} adminId={user.id} />;
}
