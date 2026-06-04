/**
 * @file Expanded single-thread view: header, content, responses and the
 *   reply composer. Loads full thread detail (content + replies) on mount.
 *
 * @module ThreadDetail
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  createReplyAction,
  fetchDiscussionDetailAction,
  updateStatusAction,
} from '@/app/_lib/actions/discussion-actions';
import {
  CheckCircle2,
  Pin,
  ArrowLeft,
  Clock,
  Share2,
  MoreHorizontal,
  Heart,
  Code2,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { cn, TYPE_TO_TAG, mapReplyToComment } from './utils';

export default function ThreadDetail({
  threadId,
  threads,
  onBack,
  likedThreads = new Set(),
  onToggleLike,
  onTogglePin,
  onReplyPosted,
  userRoles = [],
}) {
  const [replyText, setReplyText] = useState('');
  const [comments, setComments] = useState([]);
  const [loadedContent, setLoadedContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const base = useMemo(
    () => threads.find((t) => t.id === threadId) || null,
    [threadId, threads]
  );

  const [threadStatus, setThreadStatus] = useState(base?.status || 'open');
  const [threadTags, setThreadTags] = useState(base?.tags || []);

  const loadDetail = useCallback(async () => {
    const result = await fetchDiscussionDetailAction({ threadId });
    if (result?.thread) {
      setLoadedContent(result.thread.content || '');
      setComments((result.thread.replies || []).map(mapReplyToComment));
      setThreadStatus(result.thread.status || 'open');

      let typeTag = TYPE_TO_TAG[result.thread.type] || {
        text: 'Discussion',
        color: 'purple',
      };
      if (
        result.thread.type === 'announcement' &&
        result.thread.tags &&
        result.thread.tags.includes('Release Log')
      ) {
        typeTag = { text: 'Release Log', color: 'indigo' };
      }
      const tags = [{ ...typeTag }];
      const solved =
        result.thread.is_solved ||
        result.thread.status === 'resolved' ||
        result.thread.status === 'closed';
      if (solved)
        tags.push({ text: 'Solved', icon: CheckCircle2, color: 'emerald' });
      if (result.thread.is_pinned)
        tags.push({ text: 'Pinned', icon: Pin, color: 'slate' });
      setThreadTags(tags);
    }
  }, [threadId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const threadDetail = base
    ? {
        ...base,
        content: loadedContent || base.content,
        comments,
        tags: threadTags.length ? threadTags : base.tags,
      }
    : null;

  const getHighestRole = (roles = []) => {
    const priority = ['admin', 'mentor', 'advisor', 'executive', 'member'];
    for (const r of priority) {
      if (roles.includes(r)) return r;
    }
    return 'member';
  };
  const highestRole = getHighestRole(userRoles);

  const canSolve = useMemo(() => {
    if (threadStatus === 'resolved' || threadStatus === 'closed') return false;

    // Get thread type
    const type = base?.type || '';

    // If no type, check first tag text
    let derivedType = type;
    if (!derivedType && base?.tags?.length) {
      const firstTag = base.tags[0].text;
      if (firstTag === 'Help') derivedType = 'general_question';
      else if (firstTag === 'Discussion') derivedType = 'course_problem';
      else if (firstTag === 'Feature Request') derivedType = 'feature_request';
      else if (firstTag === 'Announce') derivedType = 'announcement';
      else if (firstTag === 'Release Log') derivedType = 'announcement';
    }

    // 1. Feature Request: only be solve by admin
    if (derivedType === 'feature_request') {
      return highestRole === 'admin';
    }
    // 2. Discussion (course_problem or assignment_issue): only solved by mentor
    if (derivedType === 'course_problem' || derivedType === 'assignment_issue') {
      return highestRole === 'mentor';
    }
    // 3. Help & Support (general_question, bug_report, ui_issue): can be solve by mentor, executive, advisor, admin
    if (
      derivedType === 'general_question' ||
      derivedType === 'bug_report' ||
      derivedType === 'ui_issue'
    ) {
      return ['mentor', 'executive', 'advisor', 'admin'].includes(highestRole);
    }

    return false;
  }, [threadStatus, base, highestRole]);

  const handleSolve = async () => {
    const result = await updateStatusAction({ threadId, status: 'resolved' });
    if (result?.error) {
      alert(result.error);
      return;
    }
    await loadDetail();
    if (onReplyPosted) onReplyPosted();
  };

  const handlePostReply = async () => {
    if (!replyText.trim() || isPosting) return;
    setIsPosting(true);
    const result = await createReplyAction({
      threadId,
      content: replyText.trim(),
    });
    setIsPosting(false);
    if (result?.error) {
      alert(result.error);
      return;
    }
    setReplyText('');
    await loadDetail();
    if (onReplyPosted) onReplyPosted();
  };

  if (!threadDetail)
    return <div className="text-gray-400">Thread not found.</div>;

  const isPinned = threadDetail.tags?.some((t) => t.text === 'Pinned');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto flex max-w-4xl flex-col gap-6 duration-500">
      <button
        onClick={onBack}
        className="group flex w-fit items-center gap-2 text-sm text-gray-400 transition-colors hover:text-gray-200"
      >
        <ArrowLeft
          size={16}
          className="transition-transform group-hover:-translate-x-1"
        />
        Back to discussions
      </button>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-sm">
        {/* Thread Header */}
        <div className="border-b border-white/[0.06] p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {threadDetail.tags.map((tag, idx) => {
              const Icon = tag.icon;
              return (
                <span
                  key={idx}
                  className="flex items-center gap-1.5 rounded-md border border-white/[0.14] bg-gray-800/50 px-2.5 py-1 text-[11px] font-bold tracking-wider text-gray-300 uppercase"
                >
                  {Icon && (
                    <Icon size={12} className="text-current opacity-80" />
                  )}
                  {tag.text}
                </span>
              );
            })}
          </div>

          <h1 className="mb-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {threadDetail.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-inner ${threadDetail.avatarColor}`}
              >
                {threadDetail.avatarText.length > 3
                  ? threadDetail.avatarText.substring(0, 2)
                  : threadDetail.avatarText}
              </div>
              <div>
                <div className="cursor-pointer font-semibold text-gray-200 transition-colors hover:text-violet-400">
                  {threadDetail.author}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <Clock size={12} />
                  {threadDetail.time}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canSolve && threadStatus !== 'resolved' && (
                <button
                  onClick={handleSolve}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 shadow-sm transition-all hover:bg-emerald-600/35 hover:text-emerald-300"
                >
                  <CheckCircle2 size={14} />
                  Solve
                </button>
              )}
              <button
                onClick={() => onTogglePin && onTogglePin(threadId)}
                className={`flex items-center gap-1.5 rounded-lg p-2 text-sm font-medium transition-colors ${isPinned ? 'bg-violet-500/10 text-violet-400' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                title={isPinned ? 'Unpin thread' : 'Pin thread'}
              >
                <Pin size={18} className={isPinned ? 'fill-violet-400' : ''} />
              </button>
              <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200">
                <Share2 size={18} />
              </button>
              <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Thread Content */}
        <div className="space-y-4 bg-white/[0.01] p-6 text-sm leading-relaxed font-medium text-gray-300 sm:p-8">
          {threadDetail.content
            .split('\n')
            .map((line, i) => {
              if (line.startsWith('```') || line.endsWith('```')) return null;
              if (/^\d+\.\s/.test(line))
                return (
                  <p
                    key={i}
                    className="border-l-2 border-violet-500/30 py-0.5 pl-4"
                  >
                    {line}
                  </p>
                );
              if (line.startsWith('**') && line.endsWith('**'))
                return (
                  <strong key={i} className="block text-white">
                    {line.replace(/\*\*/g, '')}
                  </strong>
                );
              if (line.trim() === '') return <div key={i} className="h-2" />;
              return <p key={i}>{line}</p>;
            })
            .filter(Boolean)}
        </div>

        {/* Thread Actions */}
        <div className="flex items-center gap-4 border-t border-white/[0.06] bg-white/[0.02] px-6 py-4 sm:px-8">
          <button
            onClick={() => onToggleLike && onToggleLike(threadId)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
              likedThreads.has(threadId)
                ? 'bg-rose-500/10 text-rose-400'
                : 'text-gray-400 hover:bg-rose-500/10 hover:text-rose-400'
            )}
          >
            <Heart
              size={18}
              className={likedThreads.has(threadId) ? 'fill-rose-400' : ''}
            />
            <span>{likedThreads.has(threadId) ? 'Liked' : 'Like'}</span>
          </button>
          <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:bg-violet-500/10 hover:text-violet-400">
            <MessageSquare size={18} className="group-hover:fill-violet-400/20" />
            <span>Reply</span>
          </button>
        </div>
      </div>

      {/* Responses Section */}
      <div className="mt-4">
        <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-200">
          Responses
          <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs font-semibold text-gray-400">
            {threadDetail.comments.length}
          </span>
        </h3>

        <div className="flex flex-col gap-4">
          {threadDetail.comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-sm transition-colors hover:border-white/[0.1]"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-inner ${comment.avatarColor}`}
                >
                  {comment.avatarText}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="cursor-pointer text-sm font-semibold text-gray-300 transition-colors hover:text-violet-400">
                        {comment.author}
                      </span>
                      <span className="text-xs font-medium text-gray-500">
                        • {comment.time}
                      </span>
                    </div>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-gray-300">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <button className="flex items-center gap-1.5 text-gray-400 transition-colors hover:text-rose-400">
                      <Heart size={14} />
                      <span>{comment.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-gray-400 transition-colors hover:text-violet-400">
                      <MessageSquare size={14} />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reply Input */}
      <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-sm">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 font-bold text-white">
            NP
          </div>
          <div className="flex-1">
            <textarea
              placeholder="Write a reply..."
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="mb-3 w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-sm text-gray-200 shadow-sm transition-all placeholder:text-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
            ></textarea>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200">
                  <Code2 size={16} />
                </button>
                <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200">
                  <FileText size={16} />
                </button>
              </div>
              <button
                disabled={!replyText.trim() || isPosting}
                onClick={handlePostReply}
                className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition-all hover:bg-violet-500 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0d1117] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPosting ? 'Posting…' : 'Post Reply'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
