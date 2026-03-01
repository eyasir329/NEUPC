/**
 * @file Admin notice management page (server component).
 * Fetches notices with stats for the notice board management UI.
 *
 * @module AdminNoticesPage
 * @access admin
 */

import { getNoticesAdmin } from '@/app/_lib/data-service';
import NoticeManagementClient from './_components/NoticeManagementClient';

export const metadata = { title: 'Notices | Admin | NEUPC' };

export default async function AdminNoticesPage() {
  const { notices, stats } = await getNoticesAdmin().catch(() => ({
    notices: [],
    stats: {},
  }));

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <NoticeManagementClient initialNotices={notices} stats={stats} />
    </div>
  );
}
