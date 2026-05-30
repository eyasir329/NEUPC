/**
 * @file Advisor inbox page — displays active notices filtered for the
 *   advisor audience (notices targeting "all" or "advisor" users).
 * @module AdvisorInboxPage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { getActiveNotices } from '@/app/_lib/services/data-service';
import AdvisorNoticesClient from './_components/AdvisorNoticesClient';

export const metadata = { title: 'Inbox | Advisor | NEUPC' };

export default async function AdvisorInboxPage() {
  const [{ user }, allNotices] = await Promise.all([
    requireRole('advisor'),
    getActiveNotices().catch(() => []),
  ]);

  const notices = allNotices.filter(
    (n) =>
      !n.target_audience ||
      n.target_audience.includes('all') ||
      n.target_audience.includes('advisor')
  );

  return <AdvisorNoticesClient notices={notices} advisorId={user.id} />;
}
