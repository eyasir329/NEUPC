/**
 * @file Advisor inbox page — active notices for the advisor audience.
 *   UI is shared via {@link InboxClient}.
 * @module AdvisorInboxPage
 * @access advisor
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { getActiveNotices } from '@/app/_lib/services/data-service';
import InboxClient from '@/app/account/_components/inbox/InboxClient';

export const metadata = { title: 'Inbox | Advisor | NEUPC' };

export default async function AdvisorInboxPage() {
  const [, allNotices] = await Promise.all([
    requireRole('advisor'),
    getActiveNotices().catch(() => []),
  ]);

  const notices = allNotices.filter(
    (n) =>
      !n.target_audience ||
      n.target_audience.includes('all') ||
      n.target_audience.includes('advisor')
  );

  return (
    <InboxClient
      notices={notices}
      accent="indigo"
      subtitle="Notices and announcements for faculty advisors."
    />
  );
}
