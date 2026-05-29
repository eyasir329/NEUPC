/**
 * @file Lesson Comments
 * @module LessonComments
 *
 * Threaded comment section for bootcamp lessons and practice exams.
 * Backed by the lesson_comments table. Supports nested replies,
 * inline editing, and two-step delete confirmation.
 */

'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link';
import { getInitials, driveImageUrl } from '@/app/_lib/utils';
import {
  addLessonCommentAction,
  editLessonCommentAction,
  deleteLessonCommentAction,
} from '@/app/_lib/member-lesson-comments-actions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year:
      new Date(dateStr).getFullYear() !== new Date().getFullYear()
        ? 'numeric'
        : undefined,
  });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ user, size = 'md' }) {
  const [imgError, setImgError] = useState(false);
  const cls =
    size === 'sm'
      ? 'h-7 w-7 text-[10px]'
      : size === 'lg'
        ? 'h-10 w-10 text-sm'
        : 'h-8 w-8 text-xs';
  const name = user?.full_name || 'User';
  const src = user?.avatar_url ? driveImageUrl(user.avatar_url) : null;

  if (src && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`${cls} shrink-0 rounded-full object-cover ring-1 ring-white/10`}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <span
      className={`${cls} inline-flex shrink-0 items-center justify-center rounded-full bg-white/8 font-semibold text-gray-300 ring-1 ring-white/10`}
    >
      {getInitials(name)}
    </span>
  );
}

// ─── Comment Form ─────────────────────────────────────────────────────────────

function CommentForm({
  lessonId,
  parentId = null,
  currentUser,
  onSuccess,
  onCancel,
  initialValue = '',
  isEdit = false,
  commentId = null,
  autoFocus = false,
}) {
  const [content, setContent] = useState(initialValue);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);
  const maxLen = 2000;

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [autoFocus]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);

    const fd = new FormData();
    if (isEdit) {
      fd.set('id', commentId);
    } else {
      fd.set('lessonId', lessonId);
      if (parentId) fd.set('parentId', parentId);
    }
    fd.set('content', content.trim());

    startTransition(async () => {
      const res = isEdit
        ? await editLessonCommentAction(fd)
        : await addLessonCommentAction(fd);
      if (res?.error) {
        setError(res.error);
      } else {
        onSuccess?.(res.comment);
        if (!isEdit) setContent('');
      }
    });
  }

  const placeholder = isEdit
    ? 'Edit your comment…'
    : parentId
      ? 'Write a reply…'
      : 'Ask a question or share insights…';

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-3">
        {!isEdit && <Avatar user={currentUser} size="md" />}
        <div className="min-w-0 flex-1">
          <div
            className={`overflow-hidden rounded-xl border transition-colors ${
              content
                ? 'border-white/15'
                : 'border-white/8 focus-within:border-white/15'
            } bg-white/[0.03]`}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              maxLength={maxLen}
              rows={isEdit ? 4 : 3}
              className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm leading-relaxed text-gray-200 placeholder:text-gray-600 focus:outline-none"
            />
            <div className="flex items-center justify-between border-t border-white/6 px-4 py-2">
              <span
                className={`text-xs tabular-nums ${
                  content.length > maxLen * 0.9
                    ? 'text-amber-500'
                    : 'text-gray-700'
                }`}
              >
                {content.length}/{maxLen}
              </span>
              <div className="flex items-center gap-2">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg px-3 py-1.5 text-xs text-gray-500 transition-colors hover:text-gray-300"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!content.trim() || isPending}
                  className="rounded-lg bg-white/8 px-4 py-1.5 text-xs font-medium text-gray-200 transition-all hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isPending
                    ? isEdit
                      ? 'Saving…'
                      : 'Posting…'
                    : isEdit
                      ? 'Save'
                      : parentId
                        ? 'Reply'
                        : 'Post'}
                </button>
              </div>
            </div>
          </div>
          {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </form>
  );
}

// ─── Comment Item ─────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  currentUser,
  lessonId,
  allComments,
  onAdd,
  onEdit,
  onDelete,
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [delPending, startDelTransition] = useTransition();

  const isOwn = currentUser?.id === comment.user_id;
  const user = comment.users ?? {};
  const replies = allComments.filter((c) => c.parent_id === comment.id);
  const isEdited =
    comment.updated_at &&
    new Date(comment.updated_at).getTime() -
      new Date(comment.created_at).getTime() >
      5000;

  function handleDelete() {
    startDelTransition(async () => {
      const fd = new FormData();
      fd.set('id', comment.id);
      const res = await deleteLessonCommentAction(fd);
      if (!res?.error) onDelete(comment.id);
    });
  }

  return (
    <div className="flex gap-3">
      <div className="shrink-0 pt-0.5">
        <Avatar user={user} size="md" />
      </div>

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <CommentForm
            lessonId={lessonId}
            isEdit
            commentId={comment.id}
            initialValue={comment.content}
            currentUser={currentUser}
            autoFocus
            onSuccess={(updated) => {
              onEdit(comment.id, updated.content);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            {/* Bubble */}
            <div className="rounded-2xl rounded-tl-sm bg-white/[0.04] px-4 py-3">
              <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-sm font-semibold text-white">
                  {user.full_name || 'Unknown'}
                </span>
                <span className="text-xs text-gray-600">
                  {formatTimeAgo(comment.created_at)}
                </span>
                {isEdited && (
                  <span className="text-[10px] text-gray-700">(edited)</span>
                )}
              </div>
              <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-gray-300">
                {comment.content}
              </p>
            </div>

            {/* Action row */}
            <div className="mt-1.5 flex items-center gap-4 pl-2">
              {currentUser && !comment.parent_id && (
                <button
                  onClick={() => setShowReplyForm((v) => !v)}
                  className="text-xs text-gray-600 transition-colors hover:text-gray-300"
                >
                  {showReplyForm ? 'Cancel' : 'Reply'}
                </button>
              )}
              {isOwn && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-gray-600 transition-colors hover:text-gray-300"
                  >
                    Edit
                  </button>
                  {deleteConfirm ? (
                    <span className="flex items-center gap-2 text-xs">
                      <button
                        onClick={handleDelete}
                        disabled={delPending}
                        className="text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
                      >
                        {delPending ? '…' : 'Confirm delete'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(false)}
                        className="text-gray-600 transition-colors hover:text-gray-400"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="text-xs text-gray-600 transition-colors hover:text-red-400"
                    >
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* Replies */}
        {(replies.length > 0 || showReplyForm) && (
          <div className="mt-4 space-y-4 border-l border-white/6 pl-4">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUser={currentUser}
                lessonId={lessonId}
                allComments={allComments}
                onAdd={onAdd}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {showReplyForm && (
              <CommentForm
                lessonId={lessonId}
                parentId={comment.id}
                currentUser={currentUser}
                autoFocus
                onSuccess={(newComment) => {
                  onAdd(newComment);
                  setShowReplyForm(false);
                }}
                onCancel={() => setShowReplyForm(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function LessonComments({
  lessonId,
  initialComments = [],
  currentUser = null,
}) {
  const [comments, setComments] = useState(initialComments);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const topLevel = comments.filter((c) => !c.parent_id);

  function handleAdd(c) {
    setComments((prev) => [...prev, c]);
  }
  function handleEdit(id, newContent) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, content: newContent, updated_at: new Date().toISOString() }
          : c
      )
    );
  }
  function handleDelete(id) {
    setComments((prev) =>
      prev.filter((c) => c.id !== id && c.parent_id !== id)
    );
  }

  return (
    <section className="mt-10 border-t border-white/[0.07] pt-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Discussion
        </h2>
        {comments.length > 0 && (
          <span className="rounded-full bg-white/6 px-2.5 py-0.5 text-xs font-medium text-gray-400 tabular-nums">
            {comments.length}
          </span>
        )}
      </div>

      {/* Compose or sign-in prompt */}
      {currentUser ? (
        <div className="mb-8">
          <CommentForm
            lessonId={lessonId}
            currentUser={currentUser}
            onSuccess={handleAdd}
          />
        </div>
      ) : (
        <div className="mb-8 flex items-center gap-4 rounded-xl border border-white/8 bg-white/2 p-4">
          <p className="text-sm text-gray-500">
            <Link
              href="/login"
              className="font-medium text-gray-300 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white"
            >
              Sign in
            </Link>{' '}
            to join the discussion.
          </p>
        </div>
      )}

      {/* Comments */}
      {topLevel.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.05] py-8 text-center">
          <p className="text-xs text-gray-600">
            No comments yet.{' '}
            {currentUser ? 'Be the first to ask a question.' : ''}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              lessonId={lessonId}
              allComments={comments}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
