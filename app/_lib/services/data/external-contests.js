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

  // Clear the table to remove stale or duplicate future contests
  await supabaseAdmin
    .from('external_contests')
    .delete();

  // Deduplicate rows in memory by platform, normalized name, and start_time
  const seen = new Set();
  const uniqueRows = [];
  for (const row of rows) {
    const normName = String(row.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const key = `${row.platform}|${normName}|${row.start_time}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueRows.push(row);
    }
  }

  const { error } = await supabaseAdmin
    .from('external_contests')
    .upsert(uniqueRows, { onConflict: 'clist_id' });
  if (error) throw new Error(error.message);

  return { count: uniqueRows.length };
}
