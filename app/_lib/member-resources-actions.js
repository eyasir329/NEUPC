'use server';

import { supabaseAdmin } from './supabase';
import { revalidatePath } from 'next/cache';

/** Increment the upvote count for a resource (one action per user per session — enforced client-side). */
export async function upvoteResourceAction(resourceId) {
  if (!resourceId) return { error: 'Missing resource ID.' };

  const { data: resource, error: fetchErr } = await supabaseAdmin
    .from('resources')
    .select('id, upvotes')
    .eq('id', resourceId)
    .single();

  if (fetchErr || !resource) return { error: 'Resource not found.' };

  const { error } = await supabaseAdmin
    .from('resources')
    .update({ upvotes: (resource.upvotes ?? 0) + 1 })
    .eq('id', resourceId);

  if (error) return { error: error.message };
  revalidatePath('/account/member/resources');
  return { success: true, newCount: (resource.upvotes ?? 0) + 1 };
}
