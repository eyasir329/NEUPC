/**
 * @file Admin inbox page — active notices for the admin audience.
 *   UI is shared via {@link InboxClient}.
 * @module AdminInboxPage
 * @access admin
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { getActiveNotices } from '@/app/_lib/services/data-service';
import InboxClient from '@/app/account/_components/inbox/InboxClient';

export const metadata = { title: 'Inbox | Admin | NEUPC' };

export default async function AdminInboxPage() {
  const [, allNotices] = await Promise.all([
    requireRole('admin'),
    getActiveNotices().catch(() => []),
  ]);

  const notices = allNotices.filter(
    (n) =>
      !n.target_audience ||
      n.target_audience.includes('all') ||
      n.target_audience.includes('admin')
  );

  return (
    <InboxClient
      notices={notices}
      accent="sky"
      subtitle="Notices and system announcements for administrators."
    />
  );
}
