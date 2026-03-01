/**
 * @file Executive contest management — lists all programming contests with
 *   participant counts, platform details, and scheduling data so executives
 *   can create, edit, or track competitive programming events.
 * @module ExecutiveManageContestsPage
 * @access executive | admin
 */

import { requireRole } from '@/app/_lib/auth-guard';
import { supabaseAdmin } from '@/app/_lib/supabase';
import ManageContestsClient from './_components/ManageContestsClient';

export const metadata = { title: 'Contest Management | Executive | NEUPC' };

export default async function ManageContestsPage() {
  const { user } = await requireRole(['executive', 'admin']);

  const { data: contests } = await supabaseAdmin
    .from('contests')
    .select(
      `id, slug, title, description, platform, contest_url,
       start_time, duration, type, division, status, is_official,
       created_at, updated_at,
       contest_participants(count)`
    )
    .order('created_at', { ascending: false })
    .limit(100);

  const serialized = (contests || []).map((c) => ({
    ...c,
    participantCount: c.contest_participants?.[0]?.count ?? 0,
    contest_participants: undefined,
  }));

  return <ManageContestsClient initialContests={serialized} userId={user.id} />;
}
