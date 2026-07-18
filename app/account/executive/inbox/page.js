/**
 * @file Executive inbox page — active notices for the executive audience.
 *   UI is shared via {@link InboxClient}.
 * @module ExecutiveInboxPage
 * @access executive
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { getActiveNotices } from '@/app/_lib/services/data-service';
import InboxClient from '@/app/account/_components/inbox/InboxClient';

export const metadata = { title: 'Inbox | Executive | NEUPC' };

export default async function ExecutiveInboxPage() {
  const [, allNotices] = await Promise.all([
    requireRole(['executive', 'admin']),
    getActiveNotices().catch(() => []),
  ]);

  const notices = allNotices.filter(
    (n) =>
      !n.target_audience ||
      n.target_audience.includes('all') ||
      n.target_audience.includes('executive')
  );

  return (
    <InboxClient
      notices={notices}
      accent="blue"
      subtitle="Announcements and updates for the executive committee."
    />
  );
}
