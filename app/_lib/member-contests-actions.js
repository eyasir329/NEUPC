'use server';

import { supabaseAdmin } from './supabase';
import { revalidatePath } from 'next/cache';

/** Register the current user as a participant in a contest. */
export async function joinContestAction(contestId, userId) {
  if (!contestId || !userId) return { error: 'Missing contest or user ID.' };

  // Verify contest exists and is joinable
  const { data: contest, error: cErr } = await supabaseAdmin
    .from('contests')
    .select('id, title, status')
    .eq('id', contestId)
    .single();

  if (cErr || !contest) return { error: 'Contest not found.' };
  if (contest.status === 'finished')
    return { error: 'This contest has already finished.' };

  // Check for duplicate
  const { data: existing } = await supabaseAdmin
    .from('contest_participants')
    .select('id')
    .eq('contest_id', contestId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing)
    return { error: 'You are already registered for this contest.' };

  const { error: insErr } = await supabaseAdmin
    .from('contest_participants')
    .insert({
      contest_id: contestId,
      user_id: userId,
      registered_at: new Date().toISOString(),
    });

  if (insErr) return { error: insErr.message };
  revalidatePath('/account/member/contests');
  return { success: true };
}

/** Remove the current user's registration from a contest. */
export async function leaveContestAction(contestId, userId) {
  if (!contestId || !userId) return { error: 'Missing contest or user ID.' };

  const { data: contest } = await supabaseAdmin
    .from('contests')
    .select('status')
    .eq('id', contestId)
    .maybeSingle();

  if (contest?.status === 'running')
    return { error: 'Cannot leave a contest that is currently running.' };

  const { error } = await supabaseAdmin
    .from('contest_participants')
    .delete()
    .eq('contest_id', contestId)
    .eq('user_id', userId);

  if (error) return { error: error.message };
  revalidatePath('/account/member/contests');
  return { success: true };
}
