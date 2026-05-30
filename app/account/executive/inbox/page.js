/**
 * @file Executive notices page — displays active notices filtered for the
 *   executive audience (notices targeting "all" or "executive" users).
 * @module ExecutiveNoticesPage
 * @access executive
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { getActiveNotices } from '@/app/_lib/services/data-service';
import ExecutiveNoticesClient from './_components/ExecutiveNoticesClient';

export const metadata = { title: 'Inbox | Executive | NEUPC' };

export default async function ExecutiveNoticesPage() {
  const [{ user }, allNotices] = await Promise.all([
    requireRole('executive'),
    getActiveNotices().catch(() => []),
  ]);

  const notices = allNotices.filter(
    (n) =>
      !n.target_audience ||
      n.target_audience.includes('all') ||
      n.target_audience.includes('executive')
  );

  return <ExecutiveNoticesClient notices={notices} executiveId={user.id} />;
}
