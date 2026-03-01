/**
 * @file Member notices board — displays official announcements, alerts,
 *   and informational notices targeting club members.
 * @module MemberNoticesPage
 * @access member
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { getAllNotices } from '@/app/_lib/data-service';
import MemberNoticesClient from './_components/MemberNoticesClient';

export const metadata = { title: 'Notices | Member | NEUPC' };

export default async function MemberNoticesPage() {
  const [{ user }, notices] = await Promise.all([
    requireRole('member'),
    getAllNotices().catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <MemberNoticesClient notices={notices} userId={user.id} />
    </div>
  );
}
