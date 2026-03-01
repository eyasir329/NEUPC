/**
 * @file Mentor notices page — displays active notices filtered for the
 *   mentor audience (notices targeting “all” or “mentor” users).
 * @module MentorNoticesPage
 * @access mentor
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getActiveNotices } from '@/app/_lib/data-service';
import MentorNoticesClient from './_components/MentorNoticesClient';

export const metadata = { title: 'Notices | Mentor | NEUPC' };

export default async function MentorNoticesPage() {
  const [{ user }, allNotices] = await Promise.all([
    requireRole('mentor'),
    getActiveNotices().catch(() => []),
  ]);

  const notices = allNotices.filter(
    (n) =>
      !n.target_audience ||
      n.target_audience.includes('all') ||
      n.target_audience.includes('mentor')
  );

  return <MentorNoticesClient notices={notices} mentorId={user.id} />;
}
