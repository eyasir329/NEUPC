/**
 * @file advisor notes data-access — strategic-guidance notes saved by
 *   faculty advisors (advisor_notes table).
 */

import { supabaseAdmin } from '@/app/_lib/integrations/supabase';

// Get all notes for one advisor, pinned first then newest.
export async function getAdvisorNotes(advisorId) {
  const { data, error } = await supabaseAdmin
    .from('advisor_notes')
    .select('*')
    .eq('advisor_id', advisorId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// Create a note.
export async function createAdvisorNote(advisorId, text, tag = 'Strategy') {
  const { data, error } = await supabaseAdmin
    .from('advisor_notes')
    .insert([{ advisor_id: advisorId, text, tag }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Toggle a note's pinned flag.
export async function setAdvisorNotePinned(id, advisorId, pinned) {
  const { data, error } = await supabaseAdmin
    .from('advisor_notes')
    .update({ pinned, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('advisor_id', advisorId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Delete a note.
export async function deleteAdvisorNote(id, advisorId) {
  const { error } = await supabaseAdmin
    .from('advisor_notes')
    .delete()
    .eq('id', id)
    .eq('advisor_id', advisorId);
  if (error) throw new Error(error.message);
  return { success: true };
}
