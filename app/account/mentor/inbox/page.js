/**
 * @file Mentor inbox page — active notices for the mentor audience.
 *   UI is shared via {@link InboxClient}.
 * @module MentorInboxPage
 * @access mentor
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { getActiveNotices } from '@/app/_lib/services/data-service';
import InboxClient from '@/app/account/_components/inbox/InboxClient';

export const metadata = { title: 'Inbox | Mentor | NEUPC' };

export default async function MentorInboxPage() {
  const [, allNotices] = await Promise.all([
    requireRole('mentor'),
    getActiveNotices().catch(() => []),
  ]);

  const notices = allNotices.filter(
    (n) =>
      !n.target_audience ||
      n.target_audience.includes('all') ||
      n.target_audience.includes('mentor')
  );

  return (
    <InboxClient
      notices={notices}
      accent="amber"
      subtitle="Notices and announcements for mentors."
    />
  );
}
