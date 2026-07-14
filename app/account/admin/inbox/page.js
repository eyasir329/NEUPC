/**
 * @file Admin inbox page — full notice management (create, edit, pin,
 *   archive) for administrators, plus stats. Rendering is handled by
 *   {@link NoticeManagementClient}.
 * @module AdminInboxPage
 * @access admin
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';
import { getNoticesAdmin } from '@/app/_lib/services/data-service';
import { PageShell } from '@/app/account/_components/ui';
import NoticeManagementClient from './_components/NoticeManagementClient';

export const metadata = { title: 'Inbox | Admin | NEUPC' };
export const revalidate = 0;

export default async function AdminInboxPage() {
  const [, { notices, stats }] = await Promise.all([
    requireRole('admin'),
    getNoticesAdmin().catch(() => ({ notices: [], stats: {} })),
  ]);

  return (
    <PageShell>
      <NoticeManagementClient initialNotices={notices} stats={stats} />
    </PageShell>
  );
}
