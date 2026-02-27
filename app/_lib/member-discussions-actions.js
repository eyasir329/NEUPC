'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from './supabase';
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

export async function createThreadAction({
  categoryId,
  title,
  content,
  tags,
  userId,
}) {
  if (!userId || !categoryId || !title?.trim() || !content?.trim()) {
    return { error: 'All required fields must be provided.' };
  }
  const parsedTags = Array.isArray(tags)
    ? tags.map((t) => t.trim()).filter(Boolean)
    : (tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

  try {
    const thread = await createDiscussionThread({
      category_id: categoryId,
      title: title.trim(),
      content: content.trim(),
      author_id: userId,
      tags: parsedTags,
    });
    revalidatePath('/account/member/discussions');
    return { success: true, thread };
  } catch (err) {
    return { error: err.message || 'Failed to create thread.' };
  }
}

export async function deleteThreadAction({ threadId, userId }) {
  if (!threadId || !userId) return { error: 'Missing fields.' };
  try {
    // Verify ownership before delete
    const thread = await getDiscussionThreadById(threadId);
    if (thread?.author_id !== userId) return { error: 'Not authorized.' };
    await deleteDiscussionThread(threadId);
    revalidatePath('/account/member/discussions');
    return { success: true };
  } catch (err) {
    return { error: err.message || 'Failed to delete thread.' };
  }
}

export async function markThreadSolvedAction({ threadId, userId, isSolved }) {
  if (!threadId || !userId) return { error: 'Missing fields.' };
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
  } catch (err) {
    return { error: err.message || 'Failed to update thread.' };
  }
}

// ─── Reply Actions ───────────────────────────────────────────────────────────

export async function createReplyAction({
  threadId,
  authorId,
  content,
  parentId,
}) {
  if (!threadId || !authorId || !content?.trim()) {
    return { error: 'Reply content is required.' };
  }
  try {
    const reply = await createDiscussionReply({
      thread_id: threadId,
      author_id: authorId,
      content: content.trim(),
      ...(parentId && { parent_id: parentId }),
    });
    revalidatePath('/account/member/discussions');
    return { success: true, reply };
  } catch (err) {
    return { error: err.message || 'Failed to post reply.' };
  }
}

export async function deleteReplyAction({ replyId, userId }) {
  if (!replyId || !userId) return { error: 'Missing fields.' };
  try {
    await deleteDiscussionReply(replyId);
    revalidatePath('/account/member/discussions');
    return { success: true };
  } catch (err) {
    return { error: err.message || 'Failed to delete reply.' };
  }
}

export async function markSolutionAction({ replyId, isSolution }) {
  if (!replyId) return { error: 'Missing reply ID.' };
  try {
    await markReplyAsSolution(replyId, isSolution);
    revalidatePath('/account/member/discussions');
    return { success: true };
  } catch (err) {
    return { error: err.message || 'Failed to mark solution.' };
  }
}

// ─── Vote Actions ────────────────────────────────────────────────────────────

export async function voteThreadAction({
  userId,
  threadId,
  voteType,
  currentVote,
}) {
  if (!userId || !threadId) return { error: 'Missing fields.' };
  try {
    if (currentVote === voteType) {
      // Toggle off
      await removeVote(userId, threadId, null);
    } else {
      await voteOnThread(userId, threadId, voteType);
    }
    revalidatePath('/account/member/discussions');
    return { success: true };
  } catch (err) {
    return { error: err.message || 'Failed to vote.' };
  }
}

export async function voteReplyAction({
  userId,
  replyId,
  voteType,
  currentVote,
}) {
  if (!userId || !replyId) return { error: 'Missing fields.' };
  try {
    if (currentVote === voteType) {
      await removeVote(userId, null, replyId);
    } else {
      await voteOnReply(userId, replyId, voteType);
    }
    revalidatePath('/account/member/discussions');
    return { success: true };
  } catch (err) {
    return { error: err.message || 'Failed to vote.' };
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
  } catch (err) {
    return { error: err.message || 'Failed to fetch thread.' };
  }
}
