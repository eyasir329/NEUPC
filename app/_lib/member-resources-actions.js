/**
 * @file member resources actions
 * @module member-resources-actions
 */

'use server';

import { supabaseAdmin } from './supabase';
import { revalidatePath, revalidateTag } from 'next/cache';
import { requireActionSession } from './action-guard';

/** Increment the upvote count for a resource (authenticated users only).
 *
 * Race-condition-safe approach:
 *  1. Insert a row into `resource_upvotes` — the UNIQUE(resource_id, user_id)
 *     constraint atomically prevents duplicate votes at the DB level.
 *  2. If the insert is rejected (duplicate), return early without counting.
 *  3. Increment the denormalized `upvotes` counter.  Two concurrent new voters
 *     may each read the same old value and both add 1 — acceptable; the
 *     `resource_upvotes` table remains the source of truth for deduplication.
 */
export async function upvoteResourceAction(resourceId) {
  const authResult = await requireActionSession();
  if (authResult.error) return { error: authResult.error };
  const userId = authResult.user.id;

  if (!resourceId) return { error: 'Missing resource ID.' };

  // Atomically record the vote — unique constraint rejects duplicates.
  const { error: voteError } = await supabaseAdmin
    .from('resource_upvotes')
    .insert({ resource_id: resourceId, user_id: userId });

  if (voteError) {
    // Postgres unique-violation code is '23505'.
    if (voteError.code === '23505') {
      return { error: 'You have already upvoted this resource.' };
    }
    console.error('Resource upvote insert error:', voteError);
    return { error: 'Failed to upvote resource.' };
  }

  // Fetch the current count and bump it.  We do this after a successful
  // insert so there is at most one concurrent +1 per unique voter.
  const { data: resource, error: fetchErr } = await supabaseAdmin
    .from('resources')
    .select('id, upvotes')
    .eq('id', resourceId)
    .single();

  if (fetchErr || !resource) return { error: 'Resource not found.' };

  const newCount = (resource.upvotes ?? 0) + 1;

  const { error: updateErr } = await supabaseAdmin
    .from('resources')
    .update({ upvotes: newCount })
    .eq('id', resourceId);

  if (updateErr) {
    console.error('Resource upvote counter update error:', updateErr);
    return { error: 'Failed to update upvote count.' };
  }

  revalidatePath('/account/member/resources');
  revalidateTag('roadmaps');
  revalidatePath('/roadmaps');
  return { success: true, newCount };
}

/** Toggle bookmark for current authenticated user. */
export async function toggleResourceBookmarkAction(resourceId) {
  const authResult = await requireActionSession();
  if (authResult.error) return { error: authResult.error };

  const userId = authResult.user.id;
  if (!resourceId) return { error: 'Missing resource ID.' };

  const { data: existing, error: checkError } = await supabaseAdmin
    .from('resource_bookmarks')
    .select('id')
    .eq('resource_id', resourceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (checkError) return { error: checkError.message };

  if (existing?.id) {
    const { error } = await supabaseAdmin
      .from('resource_bookmarks')
      .delete()
      .eq('id', existing.id);
    if (error) return { error: error.message };

    revalidatePath('/account/member/resources');
    return { success: true, bookmarked: false };
  }

  const { error } = await supabaseAdmin.from('resource_bookmarks').insert({
    resource_id: resourceId,
    user_id: userId,
  });

  if (error) return { error: error.message };

  revalidatePath('/account/member/resources');
  return { success: true, bookmarked: true };
}

/** Toggle "completed" state for current user. */
export async function toggleResourceCompletedAction(resourceId) {
  const authResult = await requireActionSession();
  if (authResult.error) return { error: authResult.error };

  const userId = authResult.user.id;
  if (!resourceId) return { error: 'Missing resource ID.' };

  const { data: existing, error: checkError } = await supabaseAdmin
    .from('resource_completions')
    .select('user_id')
    .eq('resource_id', resourceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (checkError) return { error: checkError.message };

  if (existing) {
    const { error } = await supabaseAdmin
      .from('resource_completions')
      .delete()
      .eq('resource_id', resourceId)
      .eq('user_id', userId);
    if (error) return { error: error.message };
    revalidatePath('/account/member/resources');
    return { success: true, completed: false };
  }

  const { error } = await supabaseAdmin
    .from('resource_completions')
    .insert({ resource_id: resourceId, user_id: userId });
  if (error) return { error: error.message };

  revalidatePath('/account/member/resources');
  return { success: true, completed: true };
}

/** Record lightweight resource view analytics. */
export async function trackResourceViewAction(resourceId, source = 'detail') {
  if (!resourceId) return { error: 'Missing resource ID.' };

  const authResult = await requireActionSession();
  const userId = authResult?.error ? null : authResult.user.id;

  const { error } = await supabaseAdmin.from('resource_views').insert({
    resource_id: resourceId,
    user_id: userId,
    source,
  });

  if (error) return { error: error.message };
  return { success: true };
}

/** Toggle love/upvote state for current user. */
export async function toggleResourceLoveAction(resourceId) {
  const authResult = await requireActionSession();
  if (authResult.error) return { error: authResult.error };

  const userId = authResult.user.id;
  if (!resourceId) return { error: 'Missing resource ID.' };

  // Check if user already upvoted/loved this resource
  const { data: existing, error: checkError } = await supabaseAdmin
    .from('resource_upvotes')
    .select('user_id')
    .eq('resource_id', resourceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (checkError) return { error: checkError.message };

  // Get current upvote count to increment/decrement safely
  const { data: resource, error: fetchErr } = await supabaseAdmin
    .from('resources')
    .select('id, upvotes')
    .eq('id', resourceId)
    .single();

  if (fetchErr || !resource) return { error: 'Resource not found.' };

  if (existing) {
    // Delete upvote and decrement count
    const { error: deleteErr } = await supabaseAdmin
      .from('resource_upvotes')
      .delete()
      .eq('resource_id', resourceId)
      .eq('user_id', userId);

    if (deleteErr) return { error: deleteErr.message };

    const newCount = Math.max(0, (resource.upvotes ?? 0) - 1);
    await supabaseAdmin
      .from('resources')
      .update({ upvotes: newCount })
      .eq('id', resourceId);

    revalidatePath('/account/member/resources');
    revalidatePath('/account/mentor/resources');
    return { success: true, loved: false, newCount };
  } else {
    // Insert upvote and increment count
    const { error: insertErr } = await supabaseAdmin
      .from('resource_upvotes')
      .insert({ resource_id: resourceId, user_id: userId });

    if (insertErr) return { error: insertErr.message };

    const newCount = (resource.upvotes ?? 0) + 1;
    await supabaseAdmin
      .from('resources')
      .update({ upvotes: newCount })
      .eq('id', resourceId);

    revalidatePath('/account/member/resources');
    revalidatePath('/account/mentor/resources');
    return { success: true, loved: true, newCount };
  }
}

// =============================================================================
// RESOURCE COMMENT ACTIONS
// =============================================================================

export async function getResourceCommentsAction(resourceId) {
  if (!resourceId) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from('resource_comments')
      .select('*, users(id, full_name, avatar_url)')
      .eq('resource_id', resourceId)
      .eq('is_approved', true)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (err) {
    console.error('Failed to get resource comments:', err);
    return [];
  }
}

export async function addResourceCommentAction(formData) {
  const authResult = await requireActionSession();
  if (authResult.error) return { error: authResult.error };
  const user = authResult.user;

  const resourceId = formData.get('resourceId');
  const content = formData.get('content')?.trim();
  const parentId = formData.get('parentId') || null;

  if (!resourceId) return { error: 'Resource ID is required.' };
  if (!content || content.length < 2) return { error: 'Comment is too short.' };
  if (content.length > 2000)
    return { error: 'Comment must be under 2000 characters.' };

  const { data, error } = await supabaseAdmin
    .from('resource_comments')
    .insert([
      {
        resource_id: resourceId,
        user_id: user.id,
        parent_id: parentId,
        content,
        is_approved: true,
      },
    ])
    .select('*, users(id, full_name, avatar_url)')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/account/member/resources');
  revalidatePath('/account/mentor/resources');
  return { comment: data };
}

export async function editResourceCommentAction(formData) {
  const authResult = await requireActionSession();
  if (authResult.error) return { error: authResult.error };
  const user = authResult.user;

  const id = formData.get('id');
  const content = formData.get('content')?.trim();

  if (!id) return { error: 'Comment ID is required.' };
  if (!content || content.length < 2) return { error: 'Comment is too short.' };
  if (content.length > 2000)
    return { error: 'Comment must be under 2000 characters.' };

  const { data, error } = await supabaseAdmin
    .from('resource_comments')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, users(id, full_name, avatar_url)')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/account/member/resources');
  revalidatePath('/account/mentor/resources');
  return { comment: data };
}

export async function deleteResourceCommentAction(formData) {
  const authResult = await requireActionSession();
  if (authResult.error) return { error: authResult.error };
  const user = authResult.user;

  const id = formData.get('id');
  if (!id) return { error: 'Comment ID is required.' };

  const { error } = await supabaseAdmin
    .from('resource_comments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/account/member/resources');
  revalidatePath('/account/mentor/resources');
  return { success: true };
}
