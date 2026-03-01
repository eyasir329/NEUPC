/**
 * @file Executive notice management — lists existing notices and provides
 *   a creation interface for announcements, alerts, and informational
 *   notices targeted at specific audiences.
 * @module ExecutiveCreateNoticePage
 * @access executive | admin
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { supabaseAdmin } from '@/app/_lib/supabase';
import NoticesClient from './_components/NoticesClient';

export const metadata = { title: 'Notices | Executive | NEUPC' };

export default async function CreateNoticePage() {
  const { user } = await requireRole(['executive', 'admin']);

  const { data: notices } = await supabaseAdmin
    .from('notices')
    .select(
      'id, title, content, notice_type, priority, target_audience, is_pinned, expires_at, views, created_at, updated_at'
    )
    .order('created_at', { ascending: false })
    .limit(100);

  return <NoticesClient initialNotices={notices || []} userId={user.id} />;
}
