/**
 * @file member discussions actions
 * @module member-discussions-actions
 */

'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from './supabase';
import { requireActionSession } from './action-guard';
import { sanitizeText, sanitizeRichText } from './validation';
import {
  createDiscussionThread,
  createDiscussionReply,
  voteOnThread,
  voteOnReply,
  removeVote,
  markReplyAsSolution,
  deleteDiscussionThread,
  deleteDiscussionReply,
  getDiscussionThreadById,
  getThreadReplies,
} from './data-service';

// ─── Thread Actions ──────────────────────────────────────────────────────────

export async function createThreadAction({ categoryId, title, content, tags }) {
  const authResult = await requireActionSession();
  if (authResult.error) return { error: authResult.error };
  const userId = authResult.user.id;

  if (!categoryId || !title?.trim() || !content?.trim()) {
    return { error: 'All required fields must be provided.' };
  }

  const sanitizedTitle = sanitizeText(title, 200);
  const sanitizedContent = sanitizeRichText(content, 10000);

  const parsedTags = Array.isArray(tags)
    ? tags.map((t) => sanitizeText(t, 50)).filter(Boolean)
    : (tags || '')
        .split(',')
        .map((t) => sanitizeText(t, 50))
        .filter(Boolean);

  try {
    const thread = await createDiscussionThread({
      category_id: categoryId,
      title: sanitizedTitle,
      content: sanitizedContent,
      author_id: userId,
      tags: parsedTags,
    });
    revalidatePath('/account/member/discussions');
    return { success: true, thread };
  } catch {
    return { error: 'Failed to create thread.' };
  }
}

export async function deleteThreadAction({ threadId }) {
  const authResult = await requireActionSession();
  if (authResult.error) return { error: authResult.error };
  const userId = authResult.user.id;

  if (!threadId) return { error: 'Missing thread ID.' };
  try {
    // Verify ownership before delete
    const thread = await getDiscussionThreadById(threadId);
    if (thread?.author_id !== userId) return { error: 'Not authorized.' };
    await deleteDiscussionThread(threadId);
    revalidatePath('/account/member/discussions');
    return { success: true };
  } catch {
    return { error: 'Failed to delete thread.' };
  }
}

export async function markThreadSolvedAction({ threadId, isSolved }) {
  const authResult = await requireActionSession();
  if (authResult.error) return { error: authResult.error };
  const userId = authResult.user.id;

  if (!threadId) return { error: 'Missing thread ID.' };
  try {
    const thread = await getDiscussionThreadById(threadId);
    if (thread?.author_id !== userId) return { error: 'Not authorized.' };
    const { error } = await supabaseAdmin
      .from('discussion_threads')
      .update({ is_solved: isSolved })
      .eq('id', threadId);
    if (error) throw error;
    revalidatePath('/account/member/discussions');
    return { success: true };
  } catch {
    return { error: 'Failed to update thread.' };
  }
}

// ─── Reply Actions ───────────────────────────────────────────────────────────

export async function createReplyAction({ threadId, content, parentId }) {
  const authResult = await requireActionSession();
  if (authResult.error) return { error: authResult.error };
  const authorId = authResult.user.id;

  if (!threadId || !content?.trim()) {
    return { error: 'Reply content is required.' };
  }

  const sanitizedContent = sanitizeRichText(content, 10000);

  try {
    const reply = await createDiscussionReply({
      thread_id: threadId,
      author_id: authorId,
      content: sanitizedContent,
      ...(parentId && { parent_id: parentId }),
    });
    revalidatePath('/account/member/discussions');
    return { success: true, reply };
  } catch {
    return { error: 'Failed to post reply.' };
  }
}

export async function deleteReplyAction({ replyId }) {
  const authResult = await requireActionSession();
  if (authResult.error) return { error: authResult.error };
  const userId = authResult.user.id;

  if (!replyId) return { error: 'Missing reply ID.' };
  try {
    // Verify ownership before deleting
    const { data: reply } = await supabaseAdmin
      .from('discussion_replies')
      .select('author_id')
      .eq('id', replyId)
      .single();

    if (!reply || reply.author_id !== userId) {
      return { error: 'Not authorized to delete this reply.' };
    }

    await deleteDiscussionReply(replyId);
    revalidatePath('/account/member/discussions');
    return { success: true };
  } catch {
    return { error: 'Failed to delete reply.' };
  }
}

export async function markSolutionAction({ replyId, isSolution }) {
  const authResult = await requireActionSession();
  if (authResult.error) return { error: authResult.error };
  const userId = authResult.user.id;

  if (!replyId) return { error: 'Missing reply ID.' };
  try {
    // Only the thread author can mark a solution
    const { data: reply } = await supabaseAdmin
      .from('discussion_replies')
      .select('thread_id')
      .eq('id', replyId)
      .single();

    if (!reply) return { error: 'Reply not found.' };

    const thread = await getDiscussionThreadById(reply.thread_id);
    if (thread?.author_id !== userId) {
      return { error: 'Only the thread author can mark a solution.' };
    }

    await markReplyAsSolution(replyId, isSolution);
    revalidatePath('/account/member/discussions');
    return { success: true };
  } catch {
    return { error: 'Failed to mark solution.' };
  }
}

// ─── Vote Actions ────────────────────────────────────────────────────────────

export async function voteThreadAction({ threadId, voteType, currentVote }) {
  const authResult = await requireActionSession();
  if (authResult.error) return { error: authResult.error };
  const userId = authResult.user.id;

  if (!threadId) return { error: 'Missing thread ID.' };
  try {
    if (currentVote === voteType) {
      // Toggle off
      await removeVote(userId, threadId, null);
    } else {
      await voteOnThread(userId, threadId, voteType);
    }
    revalidatePath('/account/member/discussions');
    return { success: true };
  } catch {
    return { error: 'Failed to vote.' };
  }
}

export async function voteReplyAction({ replyId, voteType, currentVote }) {
  const authResult = await requireActionSession();
  if (authResult.error) return { error: authResult.error };
  const userId = authResult.user.id;

  if (!replyId) return { error: 'Missing reply ID.' };
  try {
    if (currentVote === voteType) {
      await removeVote(userId, null, replyId);
    } else {
      await voteOnReply(userId, replyId, voteType);
    }
    revalidatePath('/account/member/discussions');
    return { success: true };
  } catch {
    return { error: 'Failed to vote.' };
  }
}

// ─── Data Fetch Actions  ─────────────────────────────────────────────────────

export async function fetchThreadDetailAction(threadId) {
  if (!threadId) return { error: 'Missing thread ID.' };
  try {
    const [thread, replies] = await Promise.all([
      getDiscussionThreadById(threadId),
      getThreadReplies(threadId),
    ]);
    return { thread, replies };
  } catch {
    return { error: 'Failed to fetch thread.' };
  }
}
