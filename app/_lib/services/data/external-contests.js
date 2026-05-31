/**
 * @file external (clist) upcoming-contests data-access — split from the
 *   data-service module. Backs the problem-solving "Upcoming Contests" feed.
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';

// Upcoming contests that have not started yet, soonest first.
export async function getUpcomingExternalContests(limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('external_contests')
    .select('*')
    .gt('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

// Most recent sync timestamp, used to decide whether a refresh is due.
export async function getExternalContestsSyncedAt() {
  const { data, error } = await supabaseAdmin
    .from('external_contests')
    .select('synced_at')
    .order('synced_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.synced_at || null;
}

// Replace the upcoming feed: prune contests that already started, then upsert
// the freshly fetched rows (deduplicated on the upstream clist contest id).
export async function upsertExternalContests(rows) {
  if (!rows || rows.length === 0) return { count: 0 };

  await supabaseAdmin
    .from('external_contests')
    .delete()
    .lt('start_time', new Date().toISOString());

  const { error } = await supabaseAdmin
    .from('external_contests')
    .upsert(rows, { onConflict: 'clist_id' });
  if (error) throw new Error(error.message);

  return { count: rows.length };
}
